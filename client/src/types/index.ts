export interface Runner {
  id: string;
  name: string;
  targetPaceMinPerKm: number;
  laps: number;
  lastLapTime: number; // timestamp
  lapHistory: LapRecord[];
}

export interface LapRecord {
  lapNumber: number;
  lapSec: number;
  lapPaceSecPerKm: number;
  diffSecPerKm: number;
  timestamp: number;
}

export type Theme = 'cyberpunk' | 'simple' | 'pop' | 'colorful';

export interface AppSettings {
  distanceMeters: number;
  runners: Runner[];
  theme: Theme;
}
