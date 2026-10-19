import {
  BALL_RADIUS,
  GRAVITY,
  AIR_DRAG,
  GROUND_FRICTION,
  BOUNCE_RESTITUTION,
  MAGNUS_COEFF,
  HALF_LENGTH,
  HALF_WIDTH,
  GOAL_WIDTH,
  GOAL_HEIGHT,
  HALF_GOAL_WIDTH,
  GOAL_DEPTH,
} from './constants.ts';
import type { BallState, PlayerData, Vector2D } from './types.ts';

export interface GoalCheckResult {
  isGoal: boolean;
  scoringTeam: 'home' | 'away' | null;
}

export function updateBallPhysics(ball: BallState, dt: number): { hitGround: boolean; hitPost: boolean } {
  // Apply curve / Magnus force: spinY curves left/right (x, z), spinX curves dip/lift
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy + ball.vz * ball.vz);
  if (speed > 0.1) {
    // Magnus acceleration perpendicular to velocity
    const curveAx = -ball.vz * ball.spinY * MAGNUS_COEFF;
    const curveAz = ball.vx * ball.spinY * MAGNUS_COEFF;
    ball.vx += curveAx * dt;
    ball.vz += curveAz * dt;
    ball.vy += ball.spinX * MAGNUS_COEFF * dt;
  }

  // Apply gravity
  ball.vy += GRAVITY * dt;

  // Apply air drag
  ball.vx *= Math.pow(AIR_DRAG, dt * 60);
  ball.vy *= Math.pow(AIR_DRAG, dt * 60);
  ball.vz *= Math.pow(AIR_DRAG, dt * 60);

  // Dampen spin
  ball.spinX *= 0.98;
  ball.spinY *= 0.98;
  ball.spinZ *= 0.98;

  // Integrate position
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.z += ball.vz * dt;

  let hitGround = false;
  let hitPost = false;

  // Ground collision
  if (ball.y <= BALL_RADIUS) {
    ball.y = BALL_RADIUS;
    if (Math.abs(ball.vy) > 0.5) {
      ball.vy = -ball.vy * BOUNCE_RESTITUTION;
      hitGround = true;
    } else {
      ball.vy = 0;
    }
    // Ground rolling friction
    ball.vx *= Math.pow(GROUND_FRICTION, dt * 60);
    ball.vz *= Math.pow(GROUND_FRICTION, dt * 60);
  }

  // Goal Post and Crossbar Collisions
  // Left Goal at x = -HALF_LENGTH, Right Goal at x = HALF_LENGTH
  const goalXOffsets = [-HALF_LENGTH, HALF_LENGTH];
  for (const gx of goalXOffsets) {
    const distToGoalX = Math.abs(ball.x - gx);
    if (distToGoalX < 0.6) {
      // Check left and right vertical posts (z = -HALF_GOAL_WIDTH, z = +HALF_GOAL_WIDTH)
      for (const pz of [-HALF_GOAL_WIDTH, HALF_GOAL_WIDTH]) {
        const dz = ball.z - pz;
        const distSq = distToGoalX * distToGoalX + dz * dz;
        if (distSq < (BALL_RADIUS + 0.12) * (BALL_RADIUS + 0.12) && ball.y <= GOAL_HEIGHT + 0.1) {
          ball.vx = -ball.vx * 0.7;
          ball.vz = -ball.vz * 0.7;
          hitPost = true;
        }
      }
      // Check horizontal crossbar (y = GOAL_HEIGHT, |z| <= HALF_GOAL_WIDTH)
      if (Math.abs(ball.z) <= HALF_GOAL_WIDTH) {
        const dy = Math.abs(ball.y - GOAL_HEIGHT);
        if (dy < BALL_RADIUS + 0.1) {
          ball.vy = -ball.vy * 0.7;
          ball.vx = -ball.vx * 0.7;
          hitPost = true;
        }
      }
    }
  }

  // Net Back & Side Restraints (keep ball inside goal net area when scored)
  if (Math.abs(ball.z) <= HALF_GOAL_WIDTH && ball.y <= GOAL_HEIGHT) {
    if (ball.x < -HALF_LENGTH - GOAL_DEPTH) {
      ball.x = -HALF_LENGTH - GOAL_DEPTH;
      ball.vx = -ball.vx * 0.3;
      ball.vz *= 0.5;
    } else if (ball.x > HALF_LENGTH + GOAL_DEPTH) {
      ball.x = HALF_LENGTH + GOAL_DEPTH;
      ball.vx = -ball.vx * 0.3;
      ball.vz *= 0.5;
    }
  }

  // Pitch side boundary bounce / clamp (keeps match active)
  if (Math.abs(ball.z) > HALF_WIDTH + 2) {
    ball.z = Math.sign(ball.z) * (HALF_WIDTH + 2);
    ball.vz = -ball.vz * 0.5;
  }
  if (Math.abs(ball.x) > HALF_LENGTH + 4) {
    ball.x = Math.sign(ball.x) * (HALF_LENGTH + 4);
    ball.vx = -ball.vx * 0.5;
  }

  return { hitGround, hitPost };
}

export function checkGoal(ball: BallState): GoalCheckResult {
  // Goal is scored when ball passes behind the goal line within goal posts and under crossbar
  if (Math.abs(ball.z) <= HALF_GOAL_WIDTH && ball.y <= GOAL_HEIGHT && ball.y >= 0) {
    if (ball.x < -HALF_LENGTH - BALL_RADIUS) {
      // Ball in Left Goal -> Away team scores on Home!
      return { isGoal: true, scoringTeam: 'away' };
    }
    if (ball.x > HALF_LENGTH + BALL_RADIUS) {
      // Ball in Right Goal -> Home team scores on Away!
      return { isGoal: true, scoringTeam: 'home' };
    }
  }
  return { isGoal: false, scoringTeam: null };
}

export function calculatePassTrajectory(
  fromPos: Vector2D,
  targetPos: Vector2D,
  targetVelocity: Vector2D,
  speed: number = 18.0
): { vx: number; vz: number } {
  // Lead the target slightly based on travel time
  const dx = targetPos.x - fromPos.x;
  const dz = targetPos.z - fromPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const time = Math.max(0.1, dist / speed);

  const predictedX = targetPos.x + targetVelocity.x * time * 0.6;
  const predictedZ = targetPos.z + targetVelocity.z * time * 0.6;

  const leadDx = predictedX - fromPos.x;
  const leadDz = predictedZ - fromPos.z;
  const leadDist = Math.hypot(leadDx, leadDz) || 1;

  return {
    vx: (leadDx / leadDist) * speed,
    vz: (leadDz / leadDist) * speed,
  };
}

export function calculateShotTrajectory(
  shooterPos: Vector2D,
  targetGoalX: number, // -HALF_LENGTH or +HALF_LENGTH
  targetZOffset: number, // -HALF_GOAL_WIDTH to +HALF_GOAL_WIDTH
  powerFactor: number, // 0.1 to 1.0
  playerShooting: number, // 50 to 99
  curveDirection: number = 0 // -1 (left curve), +1 (right curve)
): { vx: number; vy: number; vz: number; spinX: number; spinY: number; spinZ: number } {
  const dx = targetGoalX - shooterPos.x;
  const dz = targetZOffset - shooterPos.z;
  const dist = Math.hypot(dx, dz);

  // Speed scales from 16 to 34 m/s based on player stats and power charge
  const baseSpeed = 16 + (playerShooting / 100) * 16 * Math.max(0.3, powerFactor);

  const normX = dx / dist;
  const normZ = dz / dist;

  // Elevation based on power
  const elevationAngle = Math.min(0.5, 0.12 + powerFactor * 0.28);
  const vy = baseSpeed * Math.sin(elevationAngle);
  const horizontalSpeed = baseSpeed * Math.cos(elevationAngle);

  const vx = normX * horizontalSpeed;
  const vz = normZ * horizontalSpeed;

  // Spin for curling / knuckleball / dipping finesse
  const spinY = curveDirection * (8 + (playerShooting / 100) * 12);
  const spinX = -powerFactor * 5; // topspin dip

  return {
    vx,
    vy,
    vz,
    spinX,
    spinY,
    spinZ: 0,
  };
}

export function calculateTackleSuccess(
  defenderData: PlayerData,
  attackerData: PlayerData,
  distance: number
): boolean {
  if (distance > 2.2) return false;
  // Chance depends on defender defense + physical vs attacker dribbling
  const defenderRating = defenderData.stats.defense * 0.6 + defenderData.stats.physical * 0.4;
  const attackerRating = attackerData.stats.dribbling * 0.7 + attackerData.stats.pace * 0.3;
  const baseProb = 0.55 + (defenderRating - attackerRating) * 0.005;
  const distancePenalty = Math.max(0, (distance - 1.0) * 0.25);
  const finalProb = Math.min(0.9, Math.max(0.2, baseProb - distancePenalty));
  return Math.random() < finalProb;
}
