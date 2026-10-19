// Standardized Pitch Scale: Length 70m, Width 46m, Goal Width 7.32m, Height 2.44m
export const PITCH_LENGTH = 70;
export const PITCH_WIDTH = 46;
export const HALF_LENGTH = PITCH_LENGTH / 2; // 35
export const HALF_WIDTH = PITCH_WIDTH / 2;   // 23

// Goal constants
export const GOAL_WIDTH = 7.32;
export const GOAL_HEIGHT = 2.44;
export const GOAL_DEPTH = 2.2;
export const HALF_GOAL_WIDTH = GOAL_WIDTH / 2; // 3.66

// Penalty box bounds
export const PENALTY_BOX_LENGTH = 14;
export const PENALTY_BOX_WIDTH = 30;

// Physics parameters
export const BALL_RADIUS = 0.22;
export const GRAVITY = -9.81 * 1.6; // slightly snappier arcade-sim gravity
export const AIR_DRAG = 0.985;
export const GROUND_FRICTION = 0.965;
export const BOUNCE_RESTITUTION = 0.65;
export const MAGNUS_COEFF = 0.45; // curve lift

// Gameplay speeds
export const BASE_RUN_SPEED = 7.5; // m/s
export const SPRINT_MULTIPLIER = 1.45;
export const DRIBBLE_PROXIMITY = 0.95;
export const TACKLE_RANGE = 1.6;
export const TACKLE_LUNGE_SPEED = 14.0;
export const PASS_SPEED = 17.0;
export const MAX_SHOT_SPEED = 32.0;

// Colors & Visuals
export const HOME_TEAM_COLOR = '#0047AB'; // Royal Blue
export const HOME_TEAM_NAME = 'Madrid Blancos & Royals';
export const AWAY_TEAM_COLOR = '#C8102E'; // Scarlet Red
export const AWAY_TEAM_NAME = 'Global All-Stars';
