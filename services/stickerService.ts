// Facade preserving the existing geminiService export signatures.
// App.tsx should import from this file going forward.
//
// Proxy mode: all generation goes through the serverless API (api/generate.ts,
// backed by server/generateCore.ts). Vendor API keys live only on the server;
// the browser bundle contains none. The user's provider/model selection is
// sent with each request and honored as the primary provider server-side.

import { StyleOption, VariationOptions } from '../types';

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

export interface ProviderPublicConfig {
  key: string;
  label: string;
  models: string[];
}

export interface ProviderConfigResponse {
  defaultProvider: string;
  providers: ProviderPublicConfig[];
}

// Providers/models that are actually usable (server has keys for them).
export async function getProviderConfig(signal?: AbortSignal): Promise<ProviderConfigResponse> {
  const res = await fetch('/api/config', { signal });
  if (!res.ok) throw new Error('error_process');
  return (await res.json()) as ProviderConfigResponse;
}

interface GenerateApiResponse {
  images: string[];
  provider: string;
  model: string;
}

const postGenerate = async (
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<GenerateApiResponse> => {
  if (signal?.aborted) throw new GenerationCancelledError();

  let res: Response;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw new GenerationCancelledError();
    throw err;
  }

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON error body (platform error page, proxy failure, ...)
  }

  if (!res.ok) {
    const message = payload && typeof payload.error === 'string' ? payload.error : 'error_process';
    if (message === 'error_cancelled') throw new GenerationCancelledError();
    throw new Error(message);
  }

  if (!payload || !Array.isArray(payload.images) || payload.images.length === 0) {
    throw new Error('error_no_image');
  }

  lastProviderMetadata = { provider: payload.provider, model: payload.model };
  return payload as GenerateApiResponse;
};

export async function generateSticker(
  imageBase64: string,
  style: StyleOption,
  variationPrompt?: string,
  signal?: AbortSignal,
  modelOverride?: string,
  providerOverride?: string
): Promise<string> {
  const res = await postGenerate(
    { mode: 'generate', imageBase64, style, variationPrompt, model: modelOverride, provider: providerOverride },
    signal
  );
  return res.images[0];
}

export async function generateStickerVariation(
  previousStickerBase64: string,
  style: StyleOption,
  options: VariationOptions,
  signal?: AbortSignal,
  modelOverride?: string,
  providerOverride?: string
): Promise<string> {
  const res = await postGenerate(
    {
      mode: 'variation',
      previousStickerBase64,
      style,
      variationOptions: options,
      model: modelOverride,
      provider: providerOverride,
    },
    signal
  );
  return res.images[0];
}

export async function generateStickerSet(
  sourceImageBase64: string,
  style: StyleOption,
  variations: string[],
  signal?: AbortSignal,
  modelOverride?: string,
  providerOverride?: string
): Promise<string[]> {
  const res = await postGenerate(
    { mode: 'set', imageBase64: sourceImageBase64, style, variations, model: modelOverride, provider: providerOverride },
    signal
  );
  return res.images;
}
