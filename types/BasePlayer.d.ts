export interface BasePlayer {
  seekTo (amount: number, type?: 'seconds' | 'fraction'): void;
  getCurrentTime (): number;
  getSecondsLoaded (): number;
  getDuration (): number;
  getInternalPlayer (key?: string): Record<string, any>;
  showPreview (): void;
}
