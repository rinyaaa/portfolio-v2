export type HeartRateResult =
  | { status: 'ok'; heartRate: number; recordedAt: string; isFallback: boolean }
  | { status: 'unavailable' };

type ValidEntry = { heartRate: number; recordedAt: string };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidEntry(value: unknown): value is ValidEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return isFiniteNumber(entry.heartRate) && typeof entry.recordedAt === 'string';
}

/**
 * health API のレスポンス（想定外の形も含む `unknown`）から現在の心拍数を選ぶ。
 * `current.heartRate` が0（未計測）または欠損している場合は、`history` の
 * 計測時刻が最も新しい有効値（>0）にフォールバックする。
 */
export function pickLatestHeartRate(data: unknown): HeartRateResult {
  if (typeof data !== 'object' || data === null) return { status: 'unavailable' };
  const { current, history } = data as { current?: unknown; history?: unknown };

  if (isValidEntry(current) && current.heartRate > 0) {
    return { status: 'ok', heartRate: current.heartRate, recordedAt: current.recordedAt, isFallback: false };
  }

  const entries = Array.isArray(history) ? history : [];
  const validEntries = entries.filter(isValidEntry).filter((entry) => entry.heartRate > 0);
  if (validEntries.length === 0) return { status: 'unavailable' };

  const latest = validEntries.reduce((newest, entry) =>
    new Date(entry.recordedAt).getTime() > new Date(newest.recordedAt).getTime() ? entry : newest,
  );
  return { status: 'ok', heartRate: latest.heartRate, recordedAt: latest.recordedAt, isFallback: true };
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** ISO 8601 の瞬間を JST の "HH:mm" に整形する（フォールバック時の計測時刻併記に使う）。 */
export function formatJstTime(iso: string): string {
  const jst = new Date(new Date(iso).getTime() + JST_OFFSET_MS);
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const mm = String(jst.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
