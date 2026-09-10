import { describe, it, expect } from 'vitest';
import { daysUntilBirthday, isBirthdayToday } from './birthday';

const BIRTHDAY = { month: 7, day: 18 };

describe('daysUntilBirthday', () => {
  it('前日は1', () => {
    // JST 2026-07-17 12:00
    expect(daysUntilBirthday(new Date('2026-07-17T03:00:00.000Z'), BIRTHDAY)).toBe(1);
  });

  it('当日は0', () => {
    expect(daysUntilBirthday(new Date('2026-07-18T03:00:00.000Z'), BIRTHDAY)).toBe(0);
  });

  it('翌日は次の誕生日まで364日（うるう年を挟まない場合）', () => {
    // JST 2026-07-19 00:00（UTC 2026-07-18T15:00）。次の誕生日は2027-07-18で、
    // 間に2/29を挟まないため、誕生日同士の間隔365日から当日分の1日を引いた364日になる。
    expect(daysUntilBirthday(new Date('2026-07-18T15:00:00.000Z'), BIRTHDAY)).toBe(364);
  });

  it('うるう年をまたぐ場合は同条件より1日多い365日', () => {
    // JST 2027-07-19 00:00。次の誕生日2028-07-18までに2028-02-29を挟むため、
    // 誕生日同士の間隔が366日になり、翌日分は365日になる。
    expect(daysUntilBirthday(new Date('2027-07-18T15:00:00.000Z'), BIRTHDAY)).toBe(365);
  });

  it('UTCとJSTの境界（UTC 15:00台 = JST翌日0時台）で1日ずれない', () => {
    // UTC 2026-07-17T15:00:00Z はそのまま切ると7/17だが、JSTでは7/18 00:00 = 当日。
    expect(daysUntilBirthday(new Date('2026-07-17T15:00:00.000Z'), BIRTHDAY)).toBe(0);
    // 境界の直前（UTC 14:59）はまだJSTで7/17なので前日扱い。
    expect(daysUntilBirthday(new Date('2026-07-17T14:59:00.000Z'), BIRTHDAY)).toBe(1);
  });

  it('年末年始をまたぐケース（誕生日が1/3、JST 2025-12-30時点）', () => {
    // JST 2025-12-30 00:00（UTC 2025-12-29T15:00）から2026-01-03まで4日。
    expect(daysUntilBirthday(new Date('2025-12-29T15:00:00.000Z'), { month: 1, day: 3 })).toBe(4);
  });
});

describe('isBirthdayToday', () => {
  it('当日はtrue', () => {
    expect(isBirthdayToday(new Date('2026-07-18T03:00:00.000Z'), BIRTHDAY)).toBe(true);
  });

  it('当日以外はfalse', () => {
    expect(isBirthdayToday(new Date('2026-07-17T03:00:00.000Z'), BIRTHDAY)).toBe(false);
  });
});
