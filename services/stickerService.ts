// Facade preserving the existing geminiService export signatures.
// App.tsx should import from this file going forward.

import { StyleOption, VariationOptions } from './types';
import { getProviderChain } from './providers/registry';

export class GenerationCancelledError extends Error {
  constructor() {
    super('error_cancelled');
    this.name = 'GenerationCancelledError';
  }
}

let lastProviderMetadata: { provider: string; model: string } | null = null;

export function getLastProviderMetadata(): { provider: string; model: string } | null {
  return lastProviderMetadata;
}

const isAbortError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; message?: string };
  return e.name === 'GenerationCancelledError' || /cancelled|canceled|aborted/i.test(e.message || '');
};

export async function generateSticker(
  imageBase64: string,
  style: StyleOption,
  variationPrompt?: string,
  signal?: AbortSignal,
  modelOverride?: string
): Promise<string> {
  const chain = getProviderChain();
  let lastError: unknown = null;

  for (const provider of chain) {
    try {
      const result = await provider.generateSticker(imageBase64, style, variationPrompt, signal, modelOverride);
      lastProviderMetadata = { provider: result.provider, model: result.model };
      return result.imageUrl;
    } catch (err) {
      if (isAbortError(err)) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error('error_process');
}

export async function generateStickerVariation(
  previousStickerBase64: string,
  style: StyleOption,
  options: VariationOptions,
  signal?: AbortSignal,
  modelOverride?: string
): Promise<string> {
  const chain = getProviderChain();
  let lastError: unknown = null;

  for (const provider of chain) {
    try {
      const result = await provider.generateStickerVariation(previousStickerBase64, style, options, signal, modelOverride);
      lastProviderMetadata = { provider: result.provider, model: result.model };
      return result.imageUrl;
    } catch (err) {
      if (isAbortError(err)) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error('error_process');
}

export async function generateStickerSet(
  sourceImageBase64: string,
  style: StyleOption,
  variations: string[],
  signal?: AbortSignal,
  modelOverride?: string
): Promise<string[]> {
  const chain = getProviderChain();
  let lastError: unknown = null;

  for (const provider of chain) {
    try {
      const results = await provider.generateStickerSet(sourceImageBase64, style, variations, signal, modelOverride);
      lastProviderMetadata = results.length > 0 ? { provider: results[0].provider, model: results[0].model } : null;
      return results.map((r) => r.imageUrl);
    } catch (err) {
      if (isAbortError(err)) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error('error_process');
}
