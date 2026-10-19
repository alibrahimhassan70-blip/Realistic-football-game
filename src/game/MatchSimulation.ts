import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  PITCH_LENGTH,
  PITCH_WIDTH,
  HALF_LENGTH,
  HALF_WIDTH,
  GOAL_WIDTH,
  HALF_GOAL_WIDTH,
  GOAL_HEIGHT,
  BALL_RADIUS,
  BASE_RUN_SPEED,
  SPRINT_MULTIPLIER,
  DRIBBLE_PROXIMITY,
  TACKLE_RANGE,
  TACKLE_LUNGE_SPEED,
} from './constants';
import { BallState, CameraViewMode, GameMode, MatchScore, MatchState, PlayerData } from './types';
import { HOME_ROSTER, AWAY_ROSTER } from './playersData';
import { updateBallPhysics, checkGoal, calculatePassTrajectory, calculateShotTrajectory, calculateTackleSuccess } from './physics';
import { buildPlayerModel, PlayerMeshRig } from './graphics/playerModel';
import { buildStadium, StadiumScene } from './graphics/stadium';
import { InputManager, InputState } from './controls/inputManager';
import { soundManager } from './audio/soundManager';

export interface MatchSimCallbacks {
  onScoreUpdate: (score: MatchScore) => void;
  onGoalScored: (scoringTeam: 'home' | 'away', scorerName: string) => void;
  onStateChange: (state: MatchState) => void;
  onShootPowerChange: (power: number) => void;
  onActivePlayerChange: (player: PlayerData) => void;
}

export class MatchSimulation {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private stadium: StadiumScene;

  private homePlayers: { rig: PlayerMeshRig; pos: THREE.Vector3; vel: THREE.Vector3; homeX: number; homeZ: number }[] = [];
  private awayPlayers: { rig: PlayerMeshRig; pos: THREE.Vector3; vel: THREE.Vector3; homeX: number; homeZ: number }[] = [];

  private ball: BallState = {
    x: 0,
    y: BALL_RADIUS,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    spinX: 0,
    spinY: 0,
    spinZ: 0,
  };

  private ballOwner: { player: PlayerData; isHome: boolean; index: number } | null = null;
  private activePlayerIndex: number = 6; // Mbappé ST by default
  private matchState: MatchState = 'kickoff';
  private gameMode: GameMode = 'kickoff';
  private cameraMode: CameraViewMode = 'broadcast';
  private input: InputManager;
  private callbacks: MatchSimCallbacks;

  private score: MatchScore = { home: 0, away: 0, timeSeconds: 0, period: 1 };
  private replayTimer: number = 0;
  private celebrationTimer: number = 0;
  private animTime: number = 0;
  private isDisposed: boolean = false;
  private animationFrameId: number | null = null;
  private isHeadless: boolean = false;

  // Reusable vectors to prevent GC
  private _vec3A = new THREE.Vector3();
  private _vec3B = new THREE.Vector3();

  constructor(container: HTMLElement, callbacks: MatchSimCallbacks, gameMode: GameMode = 'kickoff') {
    this.container = container;
    this.callbacks = callbacks;
    this.gameMode = gameMode;
    this.input = new InputManager();

    this.isHeadless =
      typeof navigator !== 'undefined' &&
      (Boolean((navigator as { webdriver?: boolean }).webdriver) ||
        /HeadlessChrome/i.test(navigator.userAgent));

    // 1. Scene & Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c18);
    this.scene.fog = new THREE.FogExp2(0x0a1428, 0.0075);

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.5, 300);
    this.camera.position.set(0, 24, 38);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isHeadless, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    if (!this.isHeadless) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    container.appendChild(this.renderer.domElement);

    // 4. Procedural Environment Map
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback
    }

    // 5. Ambient & Stadium Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x142814, 0.65);
    this.scene.add(hemiLight);

    const mainDirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    mainDirLight.position.set(20, 45, 25);
    if (!this.isHeadless) {
      mainDirLight.castShadow = true;
      mainDirLight.shadow.mapSize.width = 1024;
      mainDirLight.shadow.mapSize.height = 1024;
      mainDirLight.shadow.camera.near = 10;
      mainDirLight.shadow.camera.far = 120;
      const d = 35;
      mainDirLight.shadow.camera.left = -d;
      mainDirLight.shadow.camera.right = d;
      mainDirLight.shadow.camera.top = d;
      mainDirLight.shadow.camera.bottom = -d;
      mainDirLight.shadow.bias = -0.0005;
    }
    this.scene.add(mainDirLight);

    // 6. Build Stadium
    this.stadium = buildStadium(this.isHeadless);
    this.scene.add(this.stadium.group);

    // 7. Initialize Squad Players
    this.initPlayers();

    // 8. Start Loop
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    soundManager.playWhistle(true);
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private initPlayers() {
    // Default 7-player positions for fluid match
    // Home Team defends Left (-X), attacks Right (+X)
    const homeFormations = [
      { x: -HALF_LENGTH + 2.5, z: 0 },    // GK Courtois
      { x: -HALF_LENGTH + 12, z: -9 },    // CB Rüdiger
      { x: -HALF_LENGTH + 12, z: 9 },     // CB Alaba
      { x: -7, z: 0 },                     // CAM Bellingham
      { x: -14, z: 0 },                    // CM Valverde
      { x: 4, z: -12 },                    // LW Vini Jr
      { x: 6, z: 2 },                      // ST Mbappé
    ];

    // Away Team defends Right (+X), attacks Left (-X)
    const awayFormations = [
      { x: HALF_LENGTH - 2.5, z: 0 },     // GK Ederson
      { x: HALF_LENGTH - 12, z: -9 },     // CB Dias
      { x: HALF_LENGTH - 12, z: 9 },      // CB Van Dijk
      { x: 12, z: 0 },                     // CM De Bruyne
      { x: -4, z: 12 },                    // RW Messi
      { x: -6, z: -2 },                    // ST Ronaldo
      { x: -3, z: 0 },                     // ST Haaland
    ];

    HOME_ROSTER.forEach((p, idx) => {
      const isGK = idx === 0;
      const rig = buildPlayerModel(p, true, isGK);
      const spawn = homeFormations[idx] || { x: 0, z: 0 };
      rig.group.position.set(spawn.x, 0, spawn.z);
      rig.group.rotation.y = Math.PI / 2; // face towards right goal (+X)
      this.scene.add(rig.group);
      this.homePlayers.push({
        rig,
        pos: rig.group.position,
        vel: new THREE.Vector3(),
        homeX: spawn.x,
        homeZ: spawn.z,
      });
    });

    AWAY_ROSTER.forEach((p, idx) => {
      const isGK = idx === 0;
      const rig = buildPlayerModel(p, false, isGK);
      const spawn = awayFormations[idx] || { x: 0, z: 0 };
      rig.group.position.set(spawn.x, 0, spawn.z);
      rig.group.rotation.y = -Math.PI / 2; // face towards left goal (-X)
      this.scene.add(rig.group);
      this.awayPlayers.push({
        rig,
        pos: rig.group.position,
        vel: new THREE.Vector3(),
        homeX: spawn.x,
        homeZ: spawn.z,
      });
    });

    this.updateActivePlayerIndicator();
  }

  public setGameMode(mode: GameMode) {
    this.gameMode = mode;
    this.resetBallAndPlayers();
  }

  public setCameraMode(mode: CameraViewMode) {
    this.cameraMode = mode;
  }

  public setStadiumTime(time: 'night' | 'sunset' | 'day') {
    if (time === 'sunset') {
      this.scene.background = new THREE.Color(0x3b1d28);
      this.scene.fog = new THREE.FogExp2(0x3b1d28, 0.006);
    } else if (time === 'day') {
      this.scene.background = new THREE.Color(0x70a5d8);
      this.scene.fog = new THREE.FogExp2(0x70a5d8, 0.005);
    } else {
      // Night
      this.scene.background = new THREE.Color(0x060c18);
      this.scene.fog = new THREE.FogExp2(0x0a1428, 0.0075);
    }
  }

  public setTactics(formation: '4-3-3' | '4-2-3-1' | '3-5-2') {
    // Dynamic positional shift
    if (formation === '3-5-2') {
      this.homePlayers[3].homeX = -4; // push midfield up
      this.homePlayers[4].homeX = -6;
    } else if (formation === '4-2-3-1') {
      this.homePlayers[3].homeX = -9;
      this.homePlayers[4].homeX = -12;
    } else {
      this.homePlayers[3].homeX = -7;
      this.homePlayers[4].homeX = -14;
    }
  }

  public resetBallAndPlayers() {
    this.ball.x = 0;
    this.ball.y = BALL_RADIUS;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.spinX = 0;
    this.ball.spinY = 0;
    this.ballOwner = null;
    this.matchState = 'playing';
    this.callbacks.onStateChange('playing');

    // Reset positions to home coordinates
    this.homePlayers.forEach(hp => {
      hp.pos.set(hp.homeX, 0, hp.homeZ);
      hp.rig.group.rotation.set(0, Math.PI / 2, 0);
    });
    this.awayPlayers.forEach(ap => {
      ap.pos.set(ap.homeX, 0, ap.homeZ);
      ap.rig.group.rotation.set(0, -Math.PI / 2, 0);
    });

    // In Shootout mode, position active player at penalty spot
    if (this.gameMode === 'shootout') {
      const active = this.homePlayers[this.activePlayerIndex];
      active.pos.set(HALF_LENGTH - 11, 0, 0);
      active.rig.group.rotation.y = Math.PI / 2;
      this.ball.x = HALF_LENGTH - 11 + 0.6;
      this.ball.z = 0;
      this.ballOwner = { player: active.rig.data, isHome: true, index: this.activePlayerIndex };
    }
  }

  private updateActivePlayerIndicator() {
    this.homePlayers.forEach((hp, idx) => {
      hp.rig.activeMarker.visible = idx === this.activePlayerIndex;
    });
    const currentActive = this.homePlayers[this.activePlayerIndex]?.rig.data;
    if (currentActive) {
      this.callbacks.onActivePlayerChange(currentActive);
    }
  }

  public switchActivePlayer() {
    // Find closest outfield home player to the ball
    let closestIdx = 6;
    let minDist = 999;
    for (let i = 1; i < this.homePlayers.length; i++) {
      const hp = this.homePlayers[i];
      const d = Math.hypot(hp.pos.x - this.ball.x, hp.pos.z - this.ball.z);
      if (d < minDist && i !== this.activePlayerIndex) {
        minDist = d;
        closestIdx = i;
      }
    }
    this.activePlayerIndex = closestIdx;
    this.updateActivePlayerIndicator();
  }

  private lastFrameTime: number = 0;

  // Update loop
  private animate(now: number) {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (this.isHeadless) {
      if (now - this.lastFrameTime < 45) { // ~22 fps for headless software rendering
        return;
      }
      this.lastFrameTime = now;
    }

    const dt = 0.016; // clamped frame delta
    this.animTime += dt;

    const inputState = this.input.update(dt);
    this.callbacks.onShootPowerChange(inputState.shootPower);

    if (inputState.switchJustPressed) {
      this.switchActivePlayer();
    }

    if (this.matchState === 'playing') {
      this.updatePlayingState(inputState, dt);
    } else if (this.matchState === 'goal') {
      this.updateGoalCelebration(dt);
    }

    // Update 3D Stadium & Crowd
    this.stadium.update(this.animTime);

    // Sync 3D Ball
    this.stadium.ballMesh.position.set(this.ball.x, this.ball.y, this.ball.z);
    // Realistic ball rolling rotation
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vz);
    if (ballSpeed > 0.05) {
      const rollAngle = (ballSpeed * dt) / BALL_RADIUS;
      this.stadium.ballMesh.rotation.x += this.ball.vz * dt * 4;
      this.stadium.ballMesh.rotation.z -= this.ball.vx * dt * 4;
    }
    this.stadium.ballShadow.position.set(this.ball.x, 0.015, this.ball.z);
    this.stadium.ballShadow.scale.setScalar(Math.max(0.3, 1.0 - (this.ball.y - BALL_RADIUS) * 0.25));

    // Update Camera
    this.updateCamera(dt);

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  private updatePlayingState(inputState: InputState, dt: number) {
    // 1. Advance Match Clock (approx 1 match min per 1.5 real seconds)
    this.score.timeSeconds += dt * 38;
    if (Math.floor(this.score.timeSeconds) % 6 === 0) {
      this.callbacks.onScoreUpdate(this.score);
    }

    // 2. Physics step on ball
    const { hitGround, hitPost } = updateBallPhysics(this.ball, dt);
    if (hitPost) {
      soundManager.playPostHit();
    }

    // 3. User Controls Active Home Player
    const activePlayer = this.homePlayers[this.activePlayerIndex];
    if (activePlayer) {
      const stats = activePlayer.rig.data.stats;
      const speed = BASE_RUN_SPEED * (stats.pace / 85) * (inputState.sprint ? SPRINT_MULTIPLIER : 1.0);

      if (Math.abs(inputState.moveX) > 0.05 || Math.abs(inputState.moveZ) > 0.05) {
        activePlayer.vel.x = inputState.moveX * speed;
        activePlayer.vel.z = inputState.moveZ * speed;
        activePlayer.pos.x += activePlayer.vel.x * dt;
        activePlayer.pos.z += activePlayer.vel.z * dt;

        // Face movement direction smoothly
        const targetAngle = Math.atan2(inputState.moveX, inputState.moveZ);
        activePlayer.rig.group.rotation.y = targetAngle;
        activePlayer.rig.updateAnimation('running', this.animTime, inputState.sprint ? 1.4 : 1.0);
      } else {
        activePlayer.vel.set(0, 0, 0);
        activePlayer.rig.updateAnimation('idle', this.animTime, 0);
      }

      // Keep active player in pitch bounds
      activePlayer.pos.x = Math.max(-HALF_LENGTH, Math.min(HALF_LENGTH, activePlayer.pos.x));
      activePlayer.pos.z = Math.max(-HALF_WIDTH, Math.min(HALF_WIDTH, activePlayer.pos.z));

      // Check Ball Possession
      const distToBall = Math.hypot(activePlayer.pos.x - this.ball.x, activePlayer.pos.z - this.ball.z);
      if (distToBall < DRIBBLE_PROXIMITY && this.ball.y < 1.4) {
        this.ballOwner = { player: activePlayer.rig.data, isHome: true, index: this.activePlayerIndex };
      }

      // If Active Player owns the ball -> Dribble
      if (this.ballOwner?.isHome && this.ballOwner.index === this.activePlayerIndex) {
        // Dribble ball in front of player
        const forwardX = Math.sin(activePlayer.rig.group.rotation.y);
        const forwardZ = Math.cos(activePlayer.rig.group.rotation.y);
        const dribbleDist = 0.65;
        this.ball.x = activePlayer.pos.x + forwardX * dribbleDist;
        this.ball.z = activePlayer.pos.z + forwardZ * dribbleDist;
        this.ball.vx = activePlayer.vel.x;
        this.ball.vz = activePlayer.vel.z;
        this.ball.vy = 0;

        // Sound & crowd excitement when attacking in final third
        if (this.ball.x > HALF_LENGTH * 0.4) {
          const proximityToBox = (this.ball.x - HALF_LENGTH * 0.4) / (HALF_LENGTH * 0.6);
          soundManager.updateCrowdExcitement(proximityToBox);
        }

        // Action: PASS
        if (inputState.passJustPressed) {
          this.executePass(activePlayer, true);
        }

        // Action: SHOOT
        if (inputState.shootReleased) {
          this.executeShot(activePlayer, inputState.shootPower, true);
        }
      }

      // Defensive Action: TACKLE / SLIDE
      if (inputState.tackleJustPressed) {
        activePlayer.rig.updateAnimation('tackling', this.animTime, 1);
        soundManager.playTackle();
        // Check if tackling opponent with ball
        if (this.ballOwner && !this.ballOwner.isHome) {
          const opp = this.awayPlayers[this.ballOwner.index];
          const oppDist = Math.hypot(activePlayer.pos.x - opp.pos.x, activePlayer.pos.z - opp.pos.z);
          if (calculateTackleSuccess(activePlayer.rig.data, opp.rig.data, oppDist)) {
            // Dislodge ball & steal!
            this.ballOwner = { player: activePlayer.rig.data, isHome: true, index: this.activePlayerIndex };
            this.ball.vx = Math.sin(activePlayer.rig.group.rotation.y) * 8;
            this.ball.vz = Math.cos(activePlayer.rig.group.rotation.y) * 8;
          }
        }
      }
    }

    // 4. Update Autonomous AI Teammates (Home)
    this.homePlayers.forEach((hp, idx) => {
      if (idx === this.activePlayerIndex) return;
      if (idx === 0) {
        // Goalkeeper behavior
        this.updateGoalkeeper(hp, -HALF_LENGTH, dt);
      } else {
        // Outfield teammates: make smart runs into space or track back
        this.updateTeammateAI(hp, true, dt);
      }
    });

    // 5. Update Opponent AI (Away Team)
    this.updateOpponentAI(dt);

    // 6. Check Goal Event
    const goalRes = checkGoal(this.ball);
    if (goalRes.isGoal) {
      this.triggerGoal(goalRes.scoringTeam!);
    }
  }

  private executePass(playerObj: { rig: PlayerMeshRig; pos: THREE.Vector3; vel: THREE.Vector3 }, isHome: boolean) {
    const teammates = isHome ? this.homePlayers : this.awayPlayers;
    let bestTarget = teammates[1];
    let bestScore = -999;

    teammates.forEach(tm => {
      if (tm === playerObj || tm.rig.data.position === 'GK') return;
      // Preference for forward teammates in passing lane
      const dx = tm.pos.x - playerObj.pos.x;
      const dz = tm.pos.z - playerObj.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 4 || dist > 32) return;

      const forwardProgress = isHome ? dx : -dx;
      const score = forwardProgress * 1.5 - dist * 0.3;
      if (score > bestScore) {
        bestScore = score;
        bestTarget = tm;
      }
    });

    const passTraj = calculatePassTrajectory(
      { x: playerObj.pos.x, z: playerObj.pos.z },
      { x: bestTarget.pos.x, z: bestTarget.pos.z },
      { x: bestTarget.vel.x, z: bestTarget.vel.z },
      20.0
    );

    playerObj.rig.updateAnimation('kicking', this.animTime, 1);
    this.ball.vx = passTraj.vx;
    this.ball.vz = passTraj.vz;
    this.ball.vy = 1.2; // low crisp driven ground pass
    this.ballOwner = null;
    soundManager.playKick(0.6);

    // Switch active player to receiver if home
    if (isHome) {
      const newActiveIdx = this.homePlayers.indexOf(bestTarget);
      if (newActiveIdx !== -1) {
        this.activePlayerIndex = newActiveIdx;
        this.updateActivePlayerIndicator();
      }
    }
  }

  private executeShot(
    playerObj: { rig: PlayerMeshRig; pos: THREE.Vector3; vel: THREE.Vector3 },
    power: number,
    isHome: boolean
  ) {
    const targetGoalX = isHome ? HALF_LENGTH : -HALF_LENGTH;
    // Aim towards upper or lower corner of the goal
    const targetZ = playerObj.pos.z > 0 ? -HALF_GOAL_WIDTH * 0.75 : HALF_GOAL_WIDTH * 0.75;
    const curveDir = playerObj.pos.z > 0 ? 1 : -1;

    const shotTraj = calculateShotTrajectory(
      { x: playerObj.pos.x, z: playerObj.pos.z },
      targetGoalX,
      targetZ,
      power,
      playerObj.rig.data.stats.shooting,
      curveDir
    );

    playerObj.rig.updateAnimation('kicking', this.animTime, 1);
    this.ball.vx = shotTraj.vx;
    this.ball.vy = shotTraj.vy;
    this.ball.vz = shotTraj.vz;
    this.ball.spinX = shotTraj.spinX;
    this.ball.spinY = shotTraj.spinY;
    this.ballOwner = null;
    soundManager.playKick(Math.max(0.6, power));
  }

  private updateTeammateAI(
    tm: { rig: PlayerMeshRig; pos: THREE.Vector3; vel: THREE.Vector3; homeX: number; homeZ: number },
    isHome: boolean,
    dt: number
  ) {
    // Dynamic positional anchoring relative to ball
    const targetX = tm.homeX + (this.ball.x * 0.45);
    const targetZ = tm.homeZ + (this.ball.z * 0.25);

    const dx = targetX - tm.pos.x;
    const dz = targetZ - tm.pos.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 1.2) {
      const speed = BASE_RUN_SPEED * 0.85;
      tm.vel.x = (dx / dist) * speed;
      tm.vel.z = (dz / dist) * speed;
      tm.pos.x += tm.vel.x * dt;
      tm.pos.z += tm.vel.z * dt;
      tm.rig.group.rotation.y = Math.atan2(dx, dz);
      tm.rig.updateAnimation('running', this.animTime, 0.9);
    } else {
      tm.vel.set(0, 0, 0);
      tm.rig.group.rotation.y = isHome ? Math.PI / 2 : -Math.PI / 2;
      tm.rig.updateAnimation('idle', this.animTime, 0);
    }
  }

  private updateOpponentAI(dt: number) {
    // Check if any away player controls the ball
    let hasPossession = false;
    this.awayPlayers.forEach((ap, idx) => {
      if (idx === 0) {
        this.updateGoalkeeper(ap, HALF_LENGTH, dt);
        return;
      }

      const distToBall = Math.hypot(ap.pos.x - this.ball.x, ap.pos.z - this.ball.z);
      if (distToBall < DRIBBLE_PROXIMITY && this.ball.y < 1.4 && !this.ballOwner?.isHome) {
        this.ballOwner = { player: ap.rig.data, isHome: false, index: idx };
        hasPossession = true;
      }

      // If this away player has ball -> Attack Home goal (-X)
      if (this.ballOwner && !this.ballOwner.isHome && this.ballOwner.index === idx) {
        // Dribble towards home goal
        const targetX = -HALF_LENGTH;
        const targetZ = ap.pos.z * 0.5;
        const dx = targetX - ap.pos.x;
        const dz = targetZ - ap.pos.z;
        const dist = Math.hypot(dx, dz);

        const speed = BASE_RUN_SPEED * (ap.rig.data.stats.pace / 88);
        ap.vel.x = (dx / dist) * speed;
        ap.vel.z = (dz / dist) * speed;
        ap.pos.x += ap.vel.x * dt;
        ap.pos.z += ap.vel.z * dt;
        ap.rig.group.rotation.y = Math.atan2(dx, dz);
        ap.rig.updateAnimation('running', this.animTime, 1.1);

        // Keep ball at feet
        this.ball.x = ap.pos.x + (dx / dist) * 0.65;
        this.ball.z = ap.pos.z + (dz / dist) * 0.65;
        this.ball.vx = ap.vel.x;
        this.ball.vz = ap.vel.z;
        this.ball.vy = 0;

        // If in shooting range (< 24m from home goal), shoot!
        if (ap.pos.x < -HALF_LENGTH + 22 && Math.random() < 0.035) {
          this.executeShot(ap, 0.75 + Math.random() * 0.2, false);
        }
      } else {
        // Away defender / midfielder pressing or positioning
        const isClosestToBall = distToBall < 14 && (!this.ballOwner || this.ballOwner.isHome);
        if (isClosestToBall) {
          // Press ball carrier!
          const dx = this.ball.x - ap.pos.x;
          const dz = this.ball.z - ap.pos.z;
          const d = Math.hypot(dx, dz);
          const speed = BASE_RUN_SPEED * 0.95;
          ap.vel.x = (dx / d) * speed;
          ap.vel.z = (dz / d) * speed;
          ap.pos.x += ap.vel.x * dt;
          ap.pos.z += ap.vel.z * dt;
          ap.rig.group.rotation.y = Math.atan2(dx, dz);
          ap.rig.updateAnimation('running', this.animTime, 1.0);

          // Attempt tackle if close
          if (d < TACKLE_RANGE && this.ballOwner?.isHome) {
            const homeHolder = this.homePlayers[this.ballOwner.index];
            if (calculateTackleSuccess(ap.rig.data, homeHolder.rig.data, d)) {
              this.ballOwner = { player: ap.rig.data, isHome: false, index: idx };
              soundManager.playTackle();
            }
          }
        } else {
          // Standard formation positioning
          this.updateTeammateAI(ap, false, dt);
        }
      }
    });
  }

  private updateGoalkeeper(
    gk: { rig: PlayerMeshRig; pos: THREE.Vector3; vel: THREE.Vector3 },
    goalX: number,
    dt: number
  ) {
    // GK stays along goal line and tracks ball Z coordinate clamped to goal width
    const targetZ = Math.max(-HALF_GOAL_WIDTH + 0.8, Math.min(HALF_GOAL_WIDTH - 0.8, this.ball.z * 0.7));
    const dz = targetZ - gk.pos.z;
    gk.pos.z += dz * 6.0 * dt;
    gk.pos.x = goalX + (goalX > 0 ? -1.8 : 1.8);
    gk.rig.group.rotation.y = goalX > 0 ? -Math.PI / 2 : Math.PI / 2;

    // Dive reaction when shot approaches goal within 12m
    const distToGoal = Math.abs(this.ball.x - goalX);
    if (distToGoal < 10 && Math.abs(this.ball.vx) > 12) {
      gk.rig.updateAnimation('diving', this.animTime, 1.0);
      // Chance of save
      const saveReach = 2.4;
      if (Math.abs(this.ball.z - gk.pos.z) < saveReach && this.ball.y < GOAL_HEIGHT + 0.2) {
        if (Math.random() < 0.65) {
          // Fingertip parry!
          this.ball.vx = -this.ball.vx * 0.5;
          this.ball.vz = (Math.random() - 0.5) * 14;
          soundManager.playWhistle(false);
        }
      }
    } else {
      gk.rig.updateAnimation('idle', this.animTime, 0);
    }
  }

  private triggerGoal(scoringTeam: 'home' | 'away') {
    if (this.matchState === 'goal') return;
    this.matchState = 'goal';
    this.callbacks.onStateChange('goal');

    if (scoringTeam === 'home') {
      this.score.home++;
    } else {
      this.score.away++;
    }
    this.callbacks.onScoreUpdate(this.score);

    // Identify scorer
    const scorer = scoringTeam === 'home'
      ? (this.homePlayers[this.activePlayerIndex]?.rig.data.name || 'Kylian Mbappé')
      : 'Erling Haaland';

    this.callbacks.onGoalScored(scoringTeam, scorer);
    soundManager.playGoalHorn();

    // Trigger celebration animation on scorer
    if (scoringTeam === 'home') {
      this.homePlayers[this.activePlayerIndex]?.rig.updateAnimation('celebrating', 0, 1);
    }

    this.celebrationTimer = 4.5;
  }

  private updateGoalCelebration(dt: number) {
    this.celebrationTimer -= dt;
    const scorerRig = this.homePlayers[this.activePlayerIndex]?.rig;
    if (scorerRig) {
      scorerRig.updateAnimation('celebrating', this.animTime, 1);
    }

    if (this.celebrationTimer <= 0) {
      soundManager.playWhistle(true);
      this.resetBallAndPlayers();
    }
  }

  private updateCamera(dt: number) {
    if (this.matchState === 'goal') {
      // Cinematic Replay orbit around ball & scorer
      const active = this.homePlayers[this.activePlayerIndex];
      const targetX = active ? active.pos.x : this.ball.x;
      const targetZ = active ? active.pos.z : this.ball.z;
      const angle = this.animTime * 0.8;
      const camX = targetX + Math.sin(angle) * 7.5;
      const camZ = targetZ + Math.cos(angle) * 7.5;
      this.camera.position.set(camX, 3.2, camZ);
      this.camera.lookAt(targetX, 1.4, targetZ);
      return;
    }

    if (this.cameraMode === 'broadcast') {
      // UEFA Champions broadcast elevated sideline track
      const targetCamX = THREE.MathUtils.clamp(this.ball.x * 0.75, -HALF_LENGTH + 12, HALF_LENGTH - 12);
      const targetCamZ = PITCH_WIDTH / 2 + 18;
      const targetCamY = 22;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 4.5, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 4.5, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 4.5, dt);

      this._vec3A.set(this.ball.x * 0.85, 0.5, this.ball.z * 0.5);
      this.camera.lookAt(this._vec3A);
    } else if (this.cameraMode === 'dynamic') {
      // Over-the-shoulder action camera on active player
      const active = this.homePlayers[this.activePlayerIndex];
      if (active) {
        const backX = -Math.sin(active.rig.group.rotation.y) * 5.5;
        const backZ = -Math.cos(active.rig.group.rotation.y) * 5.5;
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, active.pos.x + backX, 6.0, dt);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 4.2, 6.0, dt);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, active.pos.z + backZ, 6.0, dt);
        this._vec3A.set(active.pos.x, 1.4, active.pos.z);
        this.camera.lookAt(this._vec3A);
      }
    } else if (this.cameraMode === 'endline') {
      // Tactical Behind Goal
      this.camera.position.set(HALF_LENGTH + 14, 8, 0);
      this.camera.lookAt(0, 1.5, 0);
    } else {
      // Top down tactical
      this.camera.position.set(this.ball.x, 42, this.ball.z + 0.1);
      this.camera.lookAt(this.ball.x, 0, this.ball.z);
    }
  }

  // Virtual Controls Trigger Bridges
  public triggerPass() {
    this.input.triggerVirtualPass();
  }

  public triggerThrough() {
    this.input.triggerVirtualThrough();
  }

  public triggerTackle() {
    this.input.triggerVirtualTackle();
  }

  public setVirtualShoot(held: boolean) {
    this.input.setVirtualShoot(held);
  }

  public setVirtualSprint(active: boolean) {
    this.input.setVirtualSprint(active);
  }

  public setVirtualJoystick(x: number, z: number) {
    this.input.setVirtualJoystick(x, z);
  }

  private onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / (h || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public dispose() {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.input.destroy();
    this.homePlayers.forEach(p => p.rig.dispose());
    this.awayPlayers.forEach(p => p.rig.dispose());
    this.stadium.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
