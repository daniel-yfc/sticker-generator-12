// Facade preserving the existing geminiService export signatures.
// App.tsx should import from this file going forward.

import { StyleOption, VariationOptions } from './types';
import { getProvider } from './providers/registry';

export class GenerationCancelledError extends Error {
  constructor() {
    super('error_cancelled');
    this.name = 'GenerationCancelledError';
  }
}

export async function generateSticker(
  imageBase64: string,
  style: StyleOption,
  variationPrompt?: string,
  signal?: AbortSignal
): Promise<string> {
  const provider = getProvider();
  const result = await provider.generateSticker(imageBase64, style, variationPrompt, signal);
  return result.imageUrl;
}

export async function generateStickerVariation(
  previousStickerBase64: string,
  style: StyleOption,
  options: VariationOptions,
  signal?: AbortSignal
): Promise<string> {
  const provider = getProvider();
  const result = await provider.generateStickerVariation(previousStickerBase64, style, options, signal);
  return result.imageUrl;
}

export async function generateStickerSet(
  sourceImageBase64: string,
  style: StyleOption,
  variations: string[],
  signal?: AbortSignal
): Promise<string[]> {
  const provider = getProvider();
  const results = await provider.generateStickerSet(sourceImageBase64, style, variations, signal);
  return results.map((r) => r.imageUrl);
}
