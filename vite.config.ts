import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenAI, Type } from '@google/genai';

function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'ai-proxy-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.method !== 'POST' || !req.url?.startsWith('/api/ai/')) {
              next();
              return;
            }

            try {
              if (req.url === '/api/ai/enrich-word') {
                if (!env.GEMINI_API_KEY) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on server' }));
                  return;
                }
                const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
                const body = await readJsonBody(req);
                if (!body.term) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing term' }));
                  return;
                }

                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: `Analyze the English word or phrase: "${body.term}". Provide its US phonetic symbol, a clear English definition, a concise Chinese definition, exactly 5 realistic English usage sentences for a professional or daily life context, AND their corresponding Chinese translations.`,
                  config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        phonetic: { type: Type.STRING },
                        definitionEn: { type: Type.STRING },
                        definitionCn: { type: Type.STRING },
                        sentences: { type: Type.ARRAY, items: { type: Type.STRING } },
                        sentenceTranslations: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['phonetic', 'definitionEn', 'definitionCn', 'sentences', 'sentenceTranslations'],
                    },
                  },
                });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end((response as any).text ?? '{}');
                return;
              }

              if (req.url === '/api/ai/distractors') {
                if (!env.GEMINI_API_KEY) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on server' }));
                  return;
                }
                const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
                const body = await readJsonBody(req);
                if (!body.term || !body.definitionCn) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing term or definitionCn' }));
                  return;
                }

                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: `Generate 3 incorrect but plausible Chinese definitions for the English word "${body.term}". The correct definition is "${body.definitionCn}". Return only an array of 3 strings.`,
                  config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end((response as any).text ?? '[]');
                return;
              }

              if (req.url === '/api/ai/pronunciation') {
                if (!env.GEMINI_API_KEY) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on server' }));
                  return;
                }
                const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
                const body = await readJsonBody(req);
                if (!body.term || !body.base64Audio) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing term or base64Audio' }));
                  return;
                }

                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: {
                    parts: [
                      {
                        text: `Evaluate the pronunciation of the word "${body.term}" in the attached audio. Provide a score from 0-100 and brief feedback in Chinese.`,
                      },
                      { inlineData: { mimeType: 'audio/webm', data: body.base64Audio } },
                    ],
                  },
                  config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING },
                      },
                      required: ['score', 'feedback'],
                    },
                  },
                });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end((response as any).text ?? '{}');
                return;
              }

              if (req.url === '/api/ai/tts') {
                const body = await readJsonBody(req);
                if (!env.SILICONFLOW_API_KEY) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'SILICONFLOW_API_KEY is not configured on server' }));
                  return;
                }
                if (!body.text) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing text' }));
                  return;
                }

                const ttsRes = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${env.SILICONFLOW_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'fnlp/MOSS-TTSD-v0.5',
                    input: `[S1]${body.text}`,
                    response_format: 'mp3',
                  }),
                });

                if (!ttsRes.ok) {
                  res.statusCode = ttsRes.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'TTS request failed' }));
                  return;
                }

                const audio = Buffer.from(await ttsRes.arrayBuffer());
                res.statusCode = 200;
                res.setHeader('Content-Type', 'audio/mpeg');
                res.end(audio);
                return;
              }

              next();
            } catch (error) {
              console.error('AI proxy middleware error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal AI proxy error' }));
            }
          });
        },
      },
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
