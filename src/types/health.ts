/** `https://api.nenex.me/health` のレスポンス型。 */
export type HealthCurrent = {
  heartRate: number;
  sleepHours: number;
  steps: number;
  sleepStart: string;
  sleepEnd: string;
  recordedAt: string;
};

export type HealthHistoryEntry = {
  heartRate: number;
  recordedAt: string;
  heartRateMin: number;
  heartRateMax: number;
};

export type HealthResponse = {
  current: HealthCurrent;
  history: HealthHistoryEntry[];
};
