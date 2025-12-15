/**
 * 秒数を mm:ss 形式に変換
 */
export function secToClock(s: number): string {
  const sec = Math.round(s);
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${('0' + r).slice(-2)}`;
}

/**
 * 秒/km を m:ss/km 形式に変換
 */
export function secPerKmToClock(sPerKm: number): string {
  const sec = Math.round(sPerKm);
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${('0' + r).slice(-2)}`;
}

/**
 * 現在のタイムスタンプを取得 (ミリ秒)
 */
export function now(): number {
  return Date.now();
}
