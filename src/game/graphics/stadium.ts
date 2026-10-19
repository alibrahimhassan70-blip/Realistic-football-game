import * as THREE from 'three';
import {
  PITCH_LENGTH,
  PITCH_WIDTH,
  HALF_LENGTH,
  GOAL_WIDTH,
  GOAL_HEIGHT,
  HALF_GOAL_WIDTH,
  GOAL_DEPTH,
  BALL_RADIUS,
} from '../constants';
import {
  createPitchTexture,
  createPitchBumpMap,
  createSoccerBallTexture,
  createAdBoardTexture,
  createCrowdTexture,
} from './textures';

export interface StadiumScene {
  group: THREE.Group;
  ballMesh: THREE.Mesh;
  ballShadow: THREE.Mesh;
  goalNetLeft: THREE.Mesh;
  goalNetRight: THREE.Mesh;
  adBoards: THREE.Mesh[];
  floodlights: THREE.Light[];
  update: (time: number) => void;
  dispose: () => void;
}

export function buildStadium(isHeadless: boolean = false): StadiumScene {
  const stadiumGroup = new THREE.Group();
  stadiumGroup.name = 'stadium_root';

  // 1. Pitch Ground
  const pitchTex = createPitchTexture();
  const pitchBump = createPitchBumpMap();
  const pitchGeo = new THREE.PlaneGeometry(PITCH_LENGTH, PITCH_WIDTH, 1, 1);
  const pitchMat = new THREE.MeshStandardMaterial({
    map: pitchTex,
    bumpMap: pitchBump,
    bumpScale: 0.04,
    roughness: 0.82,
    metalness: 0.04,
  });
  const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
  pitchMesh.rotation.x = -Math.PI / 2;
  pitchMesh.receiveShadow = !isHeadless;
  stadiumGroup.add(pitchMesh);

  // Outer safety apron / turf perimeter
  const apronGeo = new THREE.PlaneGeometry(PITCH_LENGTH + 24, PITCH_WIDTH + 20, 1, 1);
  const apronMat = new THREE.MeshStandardMaterial({
    color: 0x144d1a,
    roughness: 0.9,
    metalness: 0.02,
  });
  const apronMesh = new THREE.Mesh(apronGeo, apronMat);
  apronMesh.rotation.x = -Math.PI / 2;
  apronMesh.position.y = -0.01;
  stadiumGroup.add(apronMesh);

  // 2. Goalposts & Nets (Left & Right)
  const postRadius = 0.07;
  const postMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.7,
  });

  const netMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    wireframe: true,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 0.75,
  });

  function createGoal(xPos: number, isRight: boolean) {
    const goalGroup = new THREE.Group();
    goalGroup.position.set(xPos, 0, 0);

    // Left & Right upright posts
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, GOAL_HEIGHT, 16);
    postGeo.translate(0, GOAL_HEIGHT / 2, 0);

    const post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.z = -HALF_GOAL_WIDTH;
    post1.castShadow = !isHeadless;
    goalGroup.add(post1);

    const post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.z = HALF_GOAL_WIDTH;
    post2.castShadow = !isHeadless;
    goalGroup.add(post2);

    // Top crossbar
    const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, GOAL_WIDTH, 16);
    crossbarGeo.rotateX(Math.PI / 2);
    const crossbar = new THREE.Mesh(crossbarGeo, postMat);
    crossbar.position.set(0, GOAL_HEIGHT, 0);
    crossbar.castShadow = !isHeadless;
    goalGroup.add(crossbar);

    // Rear net box
    const netDepth = isRight ? GOAL_DEPTH : -GOAL_DEPTH;
    const netGeo = new THREE.BoxGeometry(Math.abs(netDepth), GOAL_HEIGHT, GOAL_WIDTH, 8, 4, 8);
    netGeo.translate(netDepth / 2, GOAL_HEIGHT / 2, 0);
    const netMesh = new THREE.Mesh(netGeo, netMat);
    goalGroup.add(netMesh);

    return { goalGroup, netMesh };
  }

  const leftGoal = createGoal(-HALF_LENGTH, false);
  stadiumGroup.add(leftGoal.goalGroup);

  const rightGoal = createGoal(HALF_LENGTH, true);
  stadiumGroup.add(rightGoal.goalGroup);

  // 3. Corner Flags
  const flagMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const corners = [
    { x: -HALF_LENGTH, z: -PITCH_WIDTH / 2 },
    { x: -HALF_LENGTH, z: PITCH_WIDTH / 2 },
    { x: HALF_LENGTH, z: -PITCH_WIDTH / 2 },
    { x: HALF_LENGTH, z: PITCH_WIDTH / 2 },
  ];
  corners.forEach(c => {
    const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5);
    poleGeo.translate(0, 0.75, 0);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(c.x, 0, c.z);

    const flagGeo = new THREE.PlaneGeometry(0.35, 0.25);
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.18, 1.35, 0);
    pole.add(flag);

    stadiumGroup.add(pole);
  });

  // 4. Perimeter Electronic LED Advertising Boards
  const adTex = createAdBoardTexture();
  const adMat = new THREE.MeshStandardMaterial({
    map: adTex,
    emissive: new THREE.Color(0x334466),
    emissiveMap: adTex,
    roughness: 0.3,
    metalness: 0.2,
  });

  const adBoards: THREE.Mesh[] = [];

  // Sideline boards
  const sideAdGeo = new THREE.BoxGeometry(PITCH_LENGTH + 6, 0.9, 0.2);
  const sideAdTop = new THREE.Mesh(sideAdGeo, adMat);
  sideAdTop.position.set(0, 0.45, -PITCH_WIDTH / 2 - 2.8);
  stadiumGroup.add(sideAdTop);
  adBoards.push(sideAdTop);

  const sideAdBottom = new THREE.Mesh(sideAdGeo, adMat);
  sideAdBottom.position.set(0, 0.45, PITCH_WIDTH / 2 + 2.8);
  sideAdBottom.rotation.y = Math.PI;
  stadiumGroup.add(sideAdBottom);
  adBoards.push(sideAdBottom);

  // Endline boards (behind goals)
  const endAdGeo = new THREE.BoxGeometry(0.2, 0.9, PITCH_WIDTH + 4);
  const endAdLeft = new THREE.Mesh(endAdGeo, adMat);
  endAdLeft.position.set(-HALF_LENGTH - 4.5, 0.45, 0);
  stadiumGroup.add(endAdLeft);
  adBoards.push(endAdLeft);

  const endAdRight = new THREE.Mesh(endAdGeo, adMat);
  endAdRight.position.set(HALF_LENGTH + 4.5, 0.45, 0);
  stadiumGroup.add(endAdRight);
  adBoards.push(endAdRight);

  // 5. Grandstands with Thousands of Animated Fans
  const crowdTex = createCrowdTexture();
  const standMat = new THREE.MeshStandardMaterial({
    map: crowdTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Long side stands (North & South)
  function createSidelineStand(zPos: number, isNorth: boolean) {
    const standGroup = new THREE.Group();
    standGroup.position.set(0, 0, zPos);

    // 3 Tiers of tiered seating
    for (let tier = 0; tier < 3; tier++) {
      const tierW = PITCH_LENGTH + 20 + tier * 8;
      const tierD = 7;
      const tierH = 4.5;
      const tierGeo = new THREE.BoxGeometry(tierW, tierH, tierD);
      const tierMesh = new THREE.Mesh(tierGeo, standMat);
      tierMesh.position.set(
        0,
        tier * 4.2 + 2.2,
        isNorth ? -(tier * 5.5 + 4) : tier * 5.5 + 4
      );
      standGroup.add(tierMesh);
    }
    return standGroup;
  }

  stadiumGroup.add(createSidelineStand(-PITCH_WIDTH / 2 - 6, true));
  stadiumGroup.add(createSidelineStand(PITCH_WIDTH / 2 + 6, false));

  // Goal side stands (East & West)
  function createGoalStand(xPos: number, isWest: boolean) {
    const standGroup = new THREE.Group();
    standGroup.position.set(xPos, 0, 0);

    for (let tier = 0; tier < 3; tier++) {
      const tierW = 8;
      const tierD = PITCH_WIDTH + 14 + tier * 6;
      const tierH = 4.5;
      const tierGeo = new THREE.BoxGeometry(tierW, tierH, tierD);
      const tierMesh = new THREE.Mesh(tierGeo, standMat);
      tierMesh.position.set(
        isWest ? -(tier * 6 + 4) : tier * 6 + 4,
        tier * 4.2 + 2.2,
        0
      );
      standGroup.add(tierMesh);
    }
    return standGroup;
  }

  stadiumGroup.add(createGoalStand(-HALF_LENGTH - 8, true));
  stadiumGroup.add(createGoalStand(HALF_LENGTH + 8, false));

  // Stadium Roof Trusses (4 corner structural supports & arches)
  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.3,
  });

  // 6. Massive Corner Floodlight Towers
  const floodlights: THREE.Light[] = [];
  const towerPositions = [
    { x: -HALF_LENGTH - 12, z: -PITCH_WIDTH / 2 - 14 },
    { x: -HALF_LENGTH - 12, z: PITCH_WIDTH / 2 + 14 },
    { x: HALF_LENGTH + 12, z: -PITCH_WIDTH / 2 - 14 },
    { x: HALF_LENGTH + 12, z: PITCH_WIDTH / 2 + 14 },
  ];

  towerPositions.forEach((pos, idx) => {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(pos.x, 0, pos.z);

    // Steel pylon tower
    const pylonGeo = new THREE.CylinderGeometry(0.8, 1.8, 30, 8);
    pylonGeo.translate(0, 15, 0);
    const pylon = new THREE.Mesh(pylonGeo, trussMat);
    towerGroup.add(pylon);

    // Floodlight rack head
    const rackGeo = new THREE.BoxGeometry(6, 4, 1.5);
    rackGeo.translate(0, 31, 0);
    const rack = new THREE.Mesh(rackGeo, trussMat);
    towerGroup.add(rack);

    // Bright Floodlight bank (emissive panels)
    const bulbGeo = new THREE.PlaneGeometry(5.4, 3.4);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0, 31, 0.8);
    bulb.lookAt(0, 0, 0);
    towerGroup.add(bulb);

    stadiumGroup.add(towerGroup);

    // Spotlight pointing at pitch center
    if (!isHeadless) {
      const spot = new THREE.SpotLight(0xf0f8ff, 1.4, 120, Math.PI / 4, 0.5, 1.2);
      spot.position.set(pos.x, 31, pos.z);
      spot.target.position.set(pos.x > 0 ? 10 : -10, 0, 0);
      stadiumGroup.add(spot.target);
      if (idx === 0) {
        // One primary shadow caster for lossless performance
        spot.castShadow = true;
        spot.shadow.mapSize.width = 1024;
        spot.shadow.mapSize.height = 1024;
        spot.shadow.camera.near = 10;
        spot.shadow.camera.far = 110;
        spot.shadow.bias = -0.0005;
      }
      stadiumGroup.add(spot);
      floodlights.push(spot);
    }
  });

  // 7. Official 3D Soccer Ball Model
  const ballTex = createSoccerBallTexture();
  const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 24, 24);
  const ballMat = new THREE.MeshStandardMaterial({
    map: ballTex,
    roughness: 0.35,
    metalness: 0.3,
  });
  const ballMesh = new THREE.Mesh(ballGeo, ballMat);
  ballMesh.position.set(0, BALL_RADIUS, 0);
  ballMesh.castShadow = !isHeadless;
  stadiumGroup.add(ballMesh);

  // Ball contact shadow disc
  const ballShadowGeo = new THREE.CircleGeometry(BALL_RADIUS * 1.3, 16);
  const ballShadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const ballShadow = new THREE.Mesh(ballShadowGeo, ballShadowMat);
  ballShadow.rotation.x = -Math.PI / 2;
  ballShadow.position.y = 0.015;
  stadiumGroup.add(ballShadow);

  const update = (time: number) => {
    // Subtle crowd waving motion & LED board pulse
    adTex.offset.x = (time * 0.08) % 1;
  };

  const dispose = () => {
    pitchTex.dispose();
    pitchBump.dispose();
    pitchGeo.dispose();
    pitchMat.dispose();
    ballTex.dispose();
    ballGeo.dispose();
    ballMat.dispose();
    adTex.dispose();
    adMat.dispose();
    crowdTex.dispose();
    standMat.dispose();
    concreteMat.dispose();
    postMat.dispose();
    netMat.dispose();
  };

  return {
    group: stadiumGroup,
    ballMesh,
    ballShadow,
    goalNetLeft: leftGoal.netMesh,
    goalNetRight: rightGoal.netMesh,
    adBoards,
    floodlights,
    update,
    dispose,
  };
}
