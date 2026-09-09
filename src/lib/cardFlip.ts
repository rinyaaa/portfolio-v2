/** 名刺フリップ（BusinessCard）の回転計算だけを切り出した純粋関数群。
 * ドラッグ量→回転角、離した時の吸着先の判定に使う（#48）。表示側は BusinessCard.tsx。 */

export const FRONT_ROTATION = 0;
export const BACK_ROTATION = 180;

/** 度数を [0, 360) に正規化する。 */
export function normalizeRotation(deg: number): number {
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

/** ドラッグの水平移動量から、次の回転角（連続値）を計算する。 */
export function rotationFromDrag(
  startRotation: number,
  deltaX: number,
  sensitivity: number
): number {
  return startRotation + deltaX * sensitivity;
}

/** 連続値の回転角を、最も近い「表(0の倍数として偶数×180)/裏(奇数×180)」の面へ吸着させる。
 * 何周ドラッグしても同じ向きに丸めるため、mod ではなく round(rotation / 180) * 180 を使う。 */
export function snapToNearestFace(rotation: number): number {
  return Math.round(rotation / 180) * 180;
}

/** 現在の回転角が裏面を向いているか（表なら false）。 */
export function isBackFace(rotation: number): boolean {
  const normalized = normalizeRotation(rotation);
  return normalized > 90 && normalized < 270;
}

/** クリック/Enter/Space によるトグル。現在の吸着角から180度進める。 */
export function toggleRotation(rotation: number): number {
  return snapToNearestFace(rotation) + BACK_ROTATION;
}
