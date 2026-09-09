import { describe, it, expect } from 'vitest';
import { pickLatestHeartRate, formatJstTime } from './heartRate';

describe('pickLatestHeartRate', () => {
  it('current が有効ならそれを使う', () => {
    const data = {
      current: { heartRate: 72, recordedAt: '2026-01-01T00:00:00.000Z' },
      history: [{ heartRate: 60, recordedAt: '2025-12-31T00:00:00.000Z' }],
    };
    expect(pickLatestHeartRate(data)).toEqual({
      status: 'ok',
      heartRate: 72,
      recordedAt: '2026-01-01T00:00:00.000Z',
      isFallback: false,
    });
  });

  it('current.heartRate が0なら history の最新有効値にフォールバックする', () => {
    const data = {
      current: { heartRate: 0, recordedAt: '2026-01-01T00:00:00.000Z' },
      history: [
        { heartRate: 65, recordedAt: '2025-12-31T10:00:00.000Z' },
        { heartRate: 70, recordedAt: '2025-12-31T12:00:00.000Z' },
        { heartRate: 0, recordedAt: '2025-12-31T13:00:00.000Z' },
      ],
    };
    expect(pickLatestHeartRate(data)).toEqual({
      status: 'ok',
      heartRate: 70,
      recordedAt: '2025-12-31T12:00:00.000Z',
      isFallback: true,
    });
  });

  it('history が空なら unavailable', () => {
    const data = { current: { heartRate: 0, recordedAt: '2026-01-01T00:00:00.000Z' }, history: [] };
    expect(pickLatestHeartRate(data)).toEqual({ status: 'unavailable' });
  });

  it('history が全件0なら unavailable', () => {
    const data = {
      current: { heartRate: 0, recordedAt: '2026-01-01T00:00:00.000Z' },
      history: [
        { heartRate: 0, recordedAt: '2025-12-31T10:00:00.000Z' },
        { heartRate: 0, recordedAt: '2025-12-31T12:00:00.000Z' },
      ],
    };
    expect(pickLatestHeartRate(data)).toEqual({ status: 'unavailable' });
  });

  it('想定外の形（null）は unavailable', () => {
    expect(pickLatestHeartRate(null)).toEqual({ status: 'unavailable' });
  });

  it('想定外の形（配列）は unavailable', () => {
    expect(pickLatestHeartRate([1, 2, 3])).toEqual({ status: 'unavailable' });
  });

  it('想定外の形（current/history が欠損）は unavailable', () => {
    expect(pickLatestHeartRate({})).toEqual({ status: 'unavailable' });
  });

  it('想定外の形（history の要素にheartRateが無い）は無視する', () => {
    const data = {
      current: { heartRate: 0, recordedAt: '2026-01-01T00:00:00.000Z' },
      history: [{ recordedAt: '2025-12-31T10:00:00.000Z' }, { heartRate: 55, recordedAt: '2025-12-31T11:00:00.000Z' }],
    };
    expect(pickLatestHeartRate(data)).toEqual({
      status: 'ok',
      heartRate: 55,
      recordedAt: '2025-12-31T11:00:00.000Z',
      isFallback: true,
    });
  });
});

describe('formatJstTime', () => {
  it('UTCの瞬間をJSTのHH:mmにする', () => {
    expect(formatJstTime('2026-01-01T00:00:00.000Z')).toBe('09:00');
  });

  it('UTC/JSTの日付跨ぎでも時刻だけを返す', () => {
    // UTC 2025-12-31T15:30 = JST 2026-01-01 00:30
    expect(formatJstTime('2025-12-31T15:30:00.000Z')).toBe('00:30');
  });
});
