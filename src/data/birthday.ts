/** Home の誕生日カウントダウンで使う月日（生年は公開しない方針のため月日のみ保持する）。 */
export type MonthDay = {
  month: number;
  day: number;
};

export const BIRTHDAY: MonthDay = { month: 7, day: 18 };
