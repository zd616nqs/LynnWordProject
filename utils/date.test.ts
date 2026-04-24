import { describe, expect, it } from 'vitest';
import { calculateActivityStreak, getLocalDateKey } from './date';
import { ActivityLog } from '../types';

describe('getLocalDateKey', () => {
  it('formats local calendar date as YYYY-MM-DD', () => {
    const date = new Date(2026, 3, 24, 12, 30, 0);
    expect(getLocalDateKey(date)).toBe('2026-04-24');
  });

  it('is stable around local midnight boundaries', () => {
    const beforeMidnight = new Date(2026, 3, 24, 23, 59, 59);
    const afterMidnight = new Date(2026, 3, 25, 0, 0, 1);

    expect(getLocalDateKey(beforeMidnight)).toBe('2026-04-24');
    expect(getLocalDateKey(afterMidnight)).toBe('2026-04-25');
  });
});

describe('calculateActivityStreak', () => {
  it('uses the same local date key format as activity logging', () => {
    const start = new Date(2026, 3, 24, 10, 0, 0);
    const activityLog: ActivityLog = {
      [getLocalDateKey(start)]: { added: true, reviewed: false },
      [getLocalDateKey(new Date(2026, 3, 23, 10, 0, 0))]: { added: false, reviewed: true },
    };

    expect(calculateActivityStreak(activityLog, start)).toBe(2);
  });
});

