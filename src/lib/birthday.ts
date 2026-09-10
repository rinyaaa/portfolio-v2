import type { MonthDay } from '../data/birthday';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 任意の瞬間を JST の暦日（年月日）に変換する。 */
function toJstDateParts(instant: Date): { year: number; month: number; day: number } {
  const jst = new Date(instant.getTime() + JST_OFFSET_MS);
  return {
    year: jst.getUTCFullYear(),
    month: jst.getUTCMonth() + 1,
    day: jst.getUTCDate(),
  };
}

/**
 * 誕生日までの残り日数を JST の暦日で計算する（当日は0）。
 * `now` は UTC/JST どちらの瞬間を表す Date でもよい（内部で JST の暦日に変換してから比較する）。
 */
export function daysUntilBirthday(now: Date, birthday: MonthDay): number {
  const { year, month, day } = toJstDateParts(now);
  const todayUtc = Date.UTC(year, month - 1, day);
  const thisYearBirthdayUtc = Date.UTC(year, birthday.month - 1, birthday.day);
  const targetUtc =
    thisYearBirthdayUtc >= todayUtc ? thisYearBirthdayUtc : Date.UTC(year + 1, birthday.month - 1, birthday.day);
  return Math.round((targetUtc - todayUtc) / MS_PER_DAY);
}

/** 誕生日当日かどうか（0日を「祝いの表示」に切り替えるために使う）。 */
export function isBirthdayToday(now: Date, birthday: MonthDay): boolean {
  return daysUntilBirthday(now, birthday) === 0;
}
