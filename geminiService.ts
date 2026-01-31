
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function enrichWordData(term: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the English word or phrase: "${term}". Provide its US phonetic symbol, a clear English definition, a concise Chinese definition, exactly 5 realistic English usage sentences for a professional or daily life context, AND their corresponding Chinese translations.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          phonetic: { type: Type.STRING },
          definitionEn: { type: Type.STRING },
          definitionCn: { type: Type.STRING },
          sentences: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          sentenceTranslations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["phonetic", "definitionEn", "definitionCn", "sentences", "sentenceTranslations"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse enriched word data", e);
    return null;
  }
}

export async function generateQuizDistractors(term: string, definitionCn: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 3 incorrect but plausible Chinese definitions for the English word "${term}". The correct definition is "${definitionCn}". Return only an array of 3 strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return ["错误选项A", "错误选项B", "错误选项C"];
  }
}

export async function evaluatePronunciation(term: string, base64Audio: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `Evaluate the pronunciation of the word "${term}" in the attached audio. Provide a score from 0-100 and brief feedback in Chinese.` },
        { inlineData: { mimeType: 'audio/webm', data: base64Audio } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ["score", "feedback"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { score: 0, feedback: "评估失败，请重试。" };
  }
}

export async function playTTS(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  }
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
