import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StudySession from './StudySession';
import { Word } from '../types';

vi.mock('../geminiClient', () => ({
  generateQuizDistractors: vi.fn(),
  evaluatePronunciation: vi.fn(),
  playTTS: vi.fn(),
}));

import { generateQuizDistractors } from '../geminiClient';

function makeWord(): Word {
  return {
    id: 'w1',
    term: 'resilient',
    phonetic: '/rɪˈzɪliənt/',
    definitionEn: 'able to recover quickly',
    definitionCn: '有韧性的',
    sentences: ['She is resilient under pressure.'],
    sentenceTranslations: ['她在压力下很有韧性。'],
    level: 0,
    nextReviewDate: Date.now(),
    encounterCount: 1,
    lastEncountered: Date.now(),
    isMastered: false,
  };
}

describe('StudySession', () => {
  it('falls back to safe options when distractor request fails', async () => {
    vi.mocked(generateQuizDistractors).mockRejectedValueOnce(new Error('boom'));

    render(<StudySession words={[makeWord()]} onFinish={() => {}} onResult={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(await screen.findByText('另一个常见但错误的释义')).toBeInTheDocument();
  });
});

