import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updateBallPhysics,
  checkGoal,
  calculatePassTrajectory,
  calculateShotTrajectory,
  calculateTackleSuccess,
} from './physics.ts';
import { HALF_LENGTH, GOAL_HEIGHT } from './constants.ts';
import type { BallState, PlayerData } from './types.ts';

test('ball physics applies gravity and ground bounce', () => {
  const ball: BallState = {
    x: 0,
    y: 5.0,
    z: 0,
    vx: 5.0,
    vy: 0,
    vz: 0,
    spinX: 0,
    spinY: 0,
    spinZ: 0,
  };

  // Step 0.1s
  const { hitGround } = updateBallPhysics(ball, 0.1);
  assert.ok(ball.y < 5.0, 'Ball should fall under gravity');
  assert.ok(ball.x > 0, 'Ball should advance along vx');
  assert.equal(hitGround, false);

  // Drop until it hits ground
  for (let i = 0; i < 50; i++) {
    updateBallPhysics(ball, 0.05);
  }
  assert.ok(ball.y >= 0.2, 'Ball should rest or bounce above ground radius');
});

test('checkGoal accurately detects goals across lines', () => {
  // Ball in middle of pitch -> not a goal
  const midBall: BallState = {
    x: 0,
    y: 1.0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    spinX: 0,
    spinY: 0,
    spinZ: 0,
  };
  assert.equal(checkGoal(midBall).isGoal, false);

  // Ball in right goal inside net bounds
  const rightGoalBall: BallState = {
    x: HALF_LENGTH + 0.5,
    y: 1.2,
    z: 1.5,
    vx: 10,
    vy: 0,
    vz: 0,
    spinX: 0,
    spinY: 0,
    spinZ: 0,
  };
  const rightRes = checkGoal(rightGoalBall);
  assert.equal(rightRes.isGoal, true);
  assert.equal(rightRes.scoringTeam, 'home');

  // Ball over crossbar -> not a goal
  const overCrossbarBall: BallState = {
    x: HALF_LENGTH + 0.5,
    y: GOAL_HEIGHT + 1.0,
    z: 0,
    vx: 10,
    vy: 0,
    vz: 0,
    spinX: 0,
    spinY: 0,
    spinZ: 0,
  };
  assert.equal(checkGoal(overCrossbarBall).isGoal, false);

  // Ball wide of posts -> not a goal
  const wideBall: BallState = {
    x: HALF_LENGTH + 0.5,
    y: 1.0,
    z: 10.0,
    vx: 10,
    vy: 0,
    vz: 0,
    spinX: 0,
    spinY: 0,
    spinZ: 0,
  };
  assert.equal(checkGoal(wideBall).isGoal, false);
});

test('calculatePassTrajectory computes leading velocity vector', () => {
  const fromPos = { x: 0, z: 0 };
  const targetPos = { x: 10, z: 0 };
  const targetVel = { x: 2, z: 0 };

  const pass = calculatePassTrajectory(fromPos, targetPos, targetVel, 20.0);
  assert.ok(pass.vx > 0, 'Pass should move forward towards target');
  assert.ok(Math.hypot(pass.vx, pass.vz) > 19.0, 'Pass speed should match designated magnitude');
});

test('calculateShotTrajectory sets elevation and curve spin', () => {
  const shooter = { x: 20, z: 5 };
  const shot = calculateShotTrajectory(shooter, HALF_LENGTH, 0, 0.8, 92, -1);

  assert.ok(shot.vx > 0, 'Shot should project toward right goal');
  assert.ok(shot.vy > 0, 'Shot should have upward launch angle');
  assert.ok(shot.spinY < 0, 'Left curl should create negative spinY');
});

test('calculateTackleSuccess respects distance limits', () => {
  const defender: PlayerData = {
    id: 'def',
    name: 'Defender',
    shortName: 'Def',
    number: 4,
    team: 'home',
    position: 'CB',
    stats: { pace: 80, shooting: 50, passing: 70, dribbling: 60, defense: 90, physical: 88, overall: 85 },
    hairStyle: 'buzz',
    skinTone: '#ffffff',
    hairColor: '#000000',
    bootColor: '#000000',
    signatureSkill: '',
    celebration: '',
    rarity: 'gold',
  };
  const attacker: PlayerData = {
    id: 'att',
    name: 'Attacker',
    shortName: 'Att',
    number: 9,
    team: 'away',
    position: 'ST',
    stats: { pace: 90, shooting: 90, passing: 70, dribbling: 90, defense: 30, physical: 70, overall: 90 },
    hairStyle: 'buzz',
    skinTone: '#ffffff',
    hairColor: '#000000',
    bootColor: '#000000',
    signatureSkill: '',
    celebration: '',
    rarity: 'gold',
  };

  // Distance too far (> 2.2m)
  assert.equal(calculateTackleSuccess(defender, attacker, 5.0), false);
});
