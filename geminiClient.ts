type EnrichedWordData = {
  phonetic: string;
  definitionEn: string;
  definitionCn: string;
  sentences: string[];
  sentenceTranslations: string[];
};

const API_BASE = '/api/ai';

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isEnrichedWordData(value: unknown): value is EnrichedWordData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.phonetic === 'string' &&
    typeof candidate.definitionEn === 'string' &&
    typeof candidate.definitionCn === 'string' &&
    isStringArray(candidate.sentences) &&
    isStringArray(candidate.sentenceTranslations)
  );
}

export async function enrichWordData(term: string): Promise<EnrichedWordData | null> {
  try {
    const data = await postJson<unknown>('/enrich-word', { term });
    if (!isEnrichedWordData(data)) {
      throw new Error('Invalid enrich payload shape');
    }
    return data;
  } catch (error) {
    console.error('Failed to enrich word data', error);
    return null;
  }
}

export async function generateQuizDistractors(term: string, definitionCn: string): Promise<string[]> {
  const data = await postJson<unknown>('/distractors', { term, definitionCn });
  if (!isStringArray(data) || data.length < 3) {
    throw new Error('Invalid distractors payload');
  }
  return data.slice(0, 3);
}

export async function evaluatePronunciation(term: string, base64Audio: string) {
  try {
    const data = await postJson<unknown>('/pronunciation', { term, base64Audio });
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid pronunciation payload');
    }
    const candidate = data as Record<string, unknown>;
    if (typeof candidate.score !== 'number' || typeof candidate.feedback !== 'string') {
      throw new Error('Invalid pronunciation fields');
    }
    return { score: candidate.score, feedback: candidate.feedback };
  } catch (error) {
    console.error('Failed to evaluate pronunciation', error);
    return { score: 0, feedback: '评估失败，请重试。' };
  }
}

export async function playTTS(text: string) {
  try {
    const response = await fetch(`${API_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error) {
    console.error('Error during TTS playback', error);
  }
}

