import { describe, expect, it } from 'vitest';
import { buildStudyQueue, getNextLevel } from './study';
import { Word } from '../types';

function makeWord(overrides: Partial<Word>): Word {
  return {
    id: 'w',
    term: 'test',
    phonetic: '/test/',
    definitionEn: 'test',
    definitionCn: '测试',
    sentences: ['one'],
    sentenceTranslations: ['一'],
    level: 0,
    nextReviewDate: 0,
    encounterCount: 1,
    lastEncountered: 0,
    isMastered: false,
    ...overrides,
  };
}

describe('buildStudyQueue', () => {
  it('returns only due and not-mastered words', () => {
    const now = 1_000;
    const words: Word[] = [
      makeWord({ id: 'due-1', nextReviewDate: now - 1 }),
      makeWord({ id: 'future', nextReviewDate: now + 1 }),
      makeWord({ id: 'mastered', nextReviewDate: now - 1, isMastered: true }),
      makeWord({ id: 'due-2', nextReviewDate: now }),
    ];

    expect(buildStudyQueue(words, now).map(word => word.id)).toEqual(['due-1', 'due-2']);
  });
});

describe('getNextLevel', () => {
  it('clamps upward progression at 7', () => {
    expect(getNextLevel(7, true)).toBe(7);
    expect(getNextLevel(6, true)).toBe(7);
  });

  it('clamps downward progression at 0', () => {
    expect(getNextLevel(0, false)).toBe(0);
    expect(getNextLevel(1, false)).toBe(0);
  });
});

