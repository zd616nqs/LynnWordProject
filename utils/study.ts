import { Word } from '../types';

export function buildStudyQueue(words: Word[], now: number = Date.now()): Word[] {
  return words.filter(word => !word.isMastered && word.nextReviewDate <= now);
}

export function getNextLevel(currentLevel: number, correct: boolean): number {
  if (correct) return Math.min(7, currentLevel + 1);
  return Math.max(0, currentLevel - 2);
}

