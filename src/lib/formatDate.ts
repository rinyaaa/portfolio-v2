/**
 * "YYYY-MM-DD" を日本語表記に整形する。

 */
export function formatJaDate(date: string | null): string {
  if (!date) return '';
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return '';
  return `${Number(y)}年${Number(m)}月${Number(d)}日`;
}
