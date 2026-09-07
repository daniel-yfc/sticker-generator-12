// Shared server core for sticker generation.
// Used by the Vercel functions (api/generate.ts, api/config.ts) and by the
// Vite dev middleware (vite.config.ts). Never imported by client code:
// vendor API keys must stay server-side only.

import {
  getProviderChain,
  getAvailableModels,
  getAvailableProviders,
} from '../services/providers/registry';
import { StyleOption, VariationOptions } from '../services/providers/types';

export type GenerateMode = 'generate' | 'variation' | 'set';

export interface GenerateRequest {
  mode: GenerateMode;
  provider?: string;
  model?: string;
  imageBase64?: string;
  previousStickerBase64?: string;
  style: StyleOption;
  variationPrompt?: string;
  variationOptions?: VariationOptions;
  variations?: string[];
}

export interface GenerateResponse {
  images: string[];
  provider: string;
  model: string;
}

export interface ProviderPublicConfig {
  key: string;
  label: string;
  models: string[];
}

export interface PublicConfigResponse {
  defaultProvider: string;
  providers: ProviderPublicConfig[];
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  venice: 'Venice.AI',
  genspake: 'Genspake',
  'nvidia-nim': 'NVIDIA NIM',
  openrouter: 'OpenRouter',
  huggingface: 'Hugging Face',
};

const isAbortError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; message?: string };
  return e.name === 'AbortError' || /cancelled|canceled|aborted/i.test(e.message || '');
};

export function getPublicConfig(): PublicConfigResponse {
  const available = getAvailableProviders();
  const primary = getProviderChain()[0];
  return {
    defaultProvider: primary ? primary.name : 'gemini',
    providers: available.map((key) => ({
      key,
      label: PROVIDER_LABELS[key] || key,
      models: getAvailableModels(key),
    })),
  };
}

export async function handleGenerate(req: GenerateRequest, signal?: AbortSignal): Promise<GenerateResponse> {
  if (!req || typeof req !== 'object' || !req.style || typeof req.style.prompt !== 'string') {
    throw new Error('error_process');
  }

  const chain = getProviderChain(req.provider);
  if (chain.length === 0) throw new Error('error_no_provider');

  let lastError: unknown = null;

  for (const provider of chain) {
    try {
      switch (req.mode) {
        case 'generate': {
          if (!req.imageBase64) throw new Error('error_process');
          const r = await provider.generateSticker(req.imageBase64, req.style, req.variationPrompt, signal, req.model);
          return { images: [r.imageUrl], provider: r.provider, model: r.model };
        }
        case 'variation': {
          if (!req.previousStickerBase64 || !req.variationOptions) throw new Error('error_process');
          const r = await provider.generateStickerVariation(
            req.previousStickerBase64,
            req.style,
            req.variationOptions,
            signal,
            req.model
          );
          return { images: [r.imageUrl], provider: r.provider, model: r.model };
        }
        case 'set': {
          if (!req.imageBase64 || !Array.isArray(req.variations) || req.variations.length === 0) {
            throw new Error('error_process');
          }
          const results = await provider.generateStickerSet(req.imageBase64, req.style, req.variations, signal, req.model);
          if (results.length === 0) throw new Error('error_no_image');
          return { images: results.map((r) => r.imageUrl), provider: results[0].provider, model: results[0].model };
        }
        default:
          throw new Error('error_process');
      }
    } catch (err) {
      if (isAbortError(err)) throw err;
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('error_process');
}
