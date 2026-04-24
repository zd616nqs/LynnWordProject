
export interface Word {
  id: string;
  term: string;
  phonetic: string;
  definitionEn: string;
  definitionCn: string;
  sentences: string[];
  sentenceTranslations: string[];
  level: number; // 0-7 (Mastery level)
  nextReviewDate: number; // Timestamp
  encounterCount: number;
  lastEncountered: number;
  isMastered: boolean;
}

export interface DailyActivity {
  added: boolean;
  reviewed: boolean;
}

export interface ActivityLog {
  [date: string]: DailyActivity; // YYYY-MM-DD
}

export interface ReviewSession {
  totalWords: number;
  completed: number;
  currentWordIndex: number;
}

export type AppView = 'dashboard' | 'add' | 'study' | 'list' | 'mastered';
