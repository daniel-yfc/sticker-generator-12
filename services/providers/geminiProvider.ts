import { GoogleGenAI } from '@google/genai';
import { StickerProvider, StickerProviderResult, StyleOption, VariationOptions, VariationStrength } from './types';

const GEMINI_API_KEY = (globalThis as any).process?.env?.GEMINI_API_KEY;

const DEFAULT_TIMEOUT_MS = 60000;
const VARIATION_TIMEOUT_MS = 65000;

const withTimeout = <T>(promise: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('error_timeout')), ms);
  });
  const abortPromise = signal
    ? new Promise<T>((_, reject) => {
        if (signal.aborted) reject(new Error('error_cancelled'));
        signal.addEventListener('abort', () => reject(new Error('error_cancelled')), { once: true });
      })
    : undefined;
  return Promise.race([promise, timeoutPromise, ...(abortPromise ? [abortPromise] : [])]).finally(() => {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }) as Promise<T>;
};

const extractImageDataUrl = (response: any): string => {
  if (!response?.candidates || response.candidates.length === 0) throw new Error('error_safety');
  const candidate = response.candidates[0];
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    if (candidate.finishReason === 'SAFETY') throw new Error('error_safety');
    throw new Error('error_process');
  }
  const parts = candidate.content?.parts;
  if (!parts) throw new Error('error_no_image');
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error('error_no_image');
};

const getStrengthGuidance = (strength: VariationStrength): string => {
  switch (strength) {
    case 'low':
      return 'VARIATION STRENGTH: SUBTLE (LOW)\n- Maintain exact head orientation, posture, composition.\n- Only subtle facial shifts (smile, wink, slight tilt).\n- Keep clothing, styling, geometry almost identical.';
    case 'high':
      return 'VARIATION STRENGTH: CREATIVE (HIGH)\n- Maintain character identity and exact art style.\n- Make dynamic changes to pose/action/emotion (celebration, thumbs-up, sunglasses, open-mouth joy).\n- Produce a bold, playful companion sticker.';
    default:
      return 'VARIATION STRENGTH: MODERATE (MEDIUM)\n- Maintain character identity and exact art style.\n- Introduce a clear new pose/gesture (big laugh, thumbs up, peace sign, waving, hand on chin).\n- Balance fresh expression with high consistency.';
  }
};

export const geminiProvider: StickerProvider = {
  name: 'gemini',
  async generateSticker(imageBase64, style, variationPrompt, signal) {
    if (!GEMINI_API_KEY) throw new Error('error_process');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const basePrompt = `Generate a high-quality die-cut sticker of the person in the provided image.\nART STYLE: ${style.prompt}.\nCRITICAL INSTRUCTIONS:\n1. TRANSFORM into a stylistic illustration matching the Art Style.\n2. DO NOT produce a realistic photo.\n3. SIMPLIFY details to match sticker aesthetic.\n4. Add a thick, clean WHITE BORDER (die-cut style).\n5. Use a solid white background.`;
    const extra = variationPrompt ? `\nExpression/Action Variation: ${variationPrompt}. Ensure style consistency.` : '\nExpression: Expressive and charismatic.';
    const finalPrompt = basePrompt + extra;
    const response: any = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }, { inlineData: { mimeType: 'image/jpeg', data: base64Data } }] },
        config: { imageConfig: { aspectRatio: '1:1' } },
      }),
      DEFAULT_TIMEOUT_MS,
      signal
    );
    return { imageUrl: extractImageDataUrl(response), provider: 'gemini', model: 'gemini-2.5-flash-image' };
  },
  async generateStickerVariation(previousStickerBase64, style, options, signal) {
    if (!GEMINI_API_KEY) throw new Error('error_process');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prevData = previousStickerBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const prompt = `You are a master sticker artist.\nTASK: Generate a NEW STICKER VARIATION based on the provided reference sticker.\nCRITICAL INSTRUCTIONS:\n1. SAME CHARACTER: exact same facial structure, hair, eye shape, age.\n2. SAME ART STYLE: ${style.prompt}.\n3. VARIATION SPECIFICATIONS:\n${getStrengthGuidance(options.strength)}\n${options.customPrompt ? `\nUser's Custom Goal: "${options.customPrompt}".` : ''}\n4. STICKER REQUIREMENTS: thick white die-cut border, solid white background, 1:1, stylized artwork.`;
    const parts: any[] = [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: prevData } }];
    if (options.sourceImageBase64) {
      const srcData = options.sourceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: srcData } });
    }
    const response: any = await withTimeout(
      ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { imageConfig: { aspectRatio: '1:1' } } }),
      VARIATION_TIMEOUT_MS,
      signal
    );
    return { imageUrl: extractImageDataUrl(response), provider: 'gemini', model: 'gemini-2.5-flash-image' };
  },
  async generateStickerSet(sourceImageBase64, style, variations, signal) {
    const results = await Promise.all(variations.map((v) => this.generateSticker(sourceImageBase64, style, v, signal)));
    return results;
  },
};
