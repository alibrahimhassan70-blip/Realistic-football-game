export type GameMode = 'kickoff' | 'tournament' | 'shootout' | 'ultimate' | 'training';
export type MatchState = 'kickoff' | 'playing' | 'goal' | 'replay' | 'halftime' | 'fulltime' | 'paused';
export type CameraViewMode = 'broadcast' | 'dynamic' | 'endline' | 'topdown';
export type StadiumTime = 'night' | 'sunset' | 'day';
export type Formation = '4-3-3' | '4-2-3-1' | '3-5-2';

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  overall: number;
}

export interface PlayerData {
  id: string;
  name: string;
  shortName: string;
  number: number;
  team: 'home' | 'away';
  position: 'GK' | 'CB' | 'LB' | 'RB' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';
  stats: PlayerStats;
  hairStyle: 'fade' | 'afro' | 'braids' | 'blonde' | 'slick' | 'buzz';
  skinTone: string;
  hairColor: string;
  bootColor: string;
  signatureSkill: string;
  celebration: string;
  rarity: 'gold' | 'icon' | 'ucl';
}

export interface Vector2D {
  x: number;
  z: number;
}

export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spinX: number;
  spinY: number;
  spinZ: number;
}

export interface MatchScore {
  home: number;
  away: number;
  timeSeconds: number; // e.g. 0 to 5400 (90 mins)
  period: 1 | 2 | 'ET' | 'FT';
}
