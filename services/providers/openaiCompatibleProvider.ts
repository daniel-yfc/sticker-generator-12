import { StickerProvider, StyleOption, VariationStrength } from './types';

export interface OpenAICompatibleConfig {
  name: string;
  baseURL: string;
  apiKeyEnv: string;
  models: string[]; // comma-separated in env, parsed to array
  supportsEdits?: boolean;
  authHeader?: string; // default 'Authorization'
  authPrefix?: string; // default 'Bearer '
}

const DEFAULT_TIMEOUT_MS = 60000;

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

const getStrengthGuidance = (strength: VariationStrength): string => {
  switch (strength) {
    case 'low':
      return 'Subtle shift: same posture/composition, only tiny expression tweaks (smile, wink, slight head tilt).';
    case 'high':
      return 'Creative shift: same identity/style, but dynamic new pose/action/emotion (celebration, thumbs-up, sunglasses, big laugh).';
    default:
      return 'Moderate shift: same identity/style, clear new pose/gesture (thumbs up, waving, hand on chin).';
  }
};

const buildStylePrompt = (style: StyleOption): string =>
  `Art style directive: ${style.prompt}. Produce a die-cut sticker: thick white border, solid white background, 1:1, stylized illustration (not a photo).`;

export function createOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): StickerProvider {
  const envKeys = ((globalThis as any).process?.env?.[cfg.apiKeyEnv] || '').split(',').map((k: string) => k.trim()).filter(Boolean);
  const authHeader = cfg.authHeader || 'Authorization';
  const authPrefix = cfg.authPrefix || 'Bearer ';

  const postJSON = async (url: string, body: any, signal?: AbortSignal, retryKeys: string[] = envKeys) => {
    const keysToTry = retryKeys.length > 0 ? retryKeys : [''];
    let lastError: unknown = null;

    for (const key of keysToTry) {
      try {
        const res = await withTimeout(
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              [authHeader]: `${authPrefix}${key}`,
            },
            body: JSON.stringify(body),
            signal,
          }),
          DEFAULT_TIMEOUT_MS,
          signal
        );
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (res.status === 401 || res.status === 403 || res.status === 429) {
            lastError = new Error(res.status === 429 ? 'error_timeout' : 'error_process');
            continue; // try next key
          }
          if (/safety|policy|blocked/i.test(text)) throw new Error('error_safety');
          throw new Error('error_process');
        }
        return res.json();
      } catch (err) {
        lastError = err;
        if (signal?.aborted) throw new Error('error_cancelled', { cause: err });
        // continue to next key
      }
    }
    if (lastError) throw lastError;
    throw new Error('error_process');
  };

  const throwIfAborted = (signal?: AbortSignal): void => {
    if (signal?.aborted) throw new Error('error_cancelled');
  };

  const fetchImageAsDataUrl = async (url: string): Promise<string> => {
    const imgRes = await fetch(url);
    const blob = await imgRes.blob();
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('error_process'));
      reader.readAsDataURL(blob);
    });
  };

  return {
    name: cfg.name,
    async generateSticker(imageBase64, style, variationPrompt, signal, modelOverride) {
      throwIfAborted(signal);
      const model = modelOverride || cfg.models[0];
      const payload: any = {
        model,
        prompt: `${buildStylePrompt(style)}${variationPrompt ? ` Action: ${variationPrompt}.` : ''}`,
        image: imageBase64,
        n: 1,
        size: '1024x1024',
      };
      const data = await postJSON(`${cfg.baseURL}/v1/images/generations`, payload, signal);
      const url = data?.data?.[0]?.url || data?.data?.[0]?.image_url;
      if (!url) throw new Error('error_no_image');
      const imageUrl = await fetchImageAsDataUrl(url);
      return { imageUrl, provider: cfg.name, model };
    },
    async generateStickerVariation(previousStickerBase64, style, options, signal, modelOverride) {
      const model = modelOverride || cfg.models[0];
      if (cfg.supportsEdits) {
        const payload: any = {
          model,
          prompt: `${buildStylePrompt(style)} Variation instruction: ${getStrengthGuidance(options.strength)}${options.customPrompt ? ` Custom: ${options.customPrompt}.` : ''}`,
          image: previousStickerBase64,
          n: 1,
          size: '1024x1024',
        };
        const data = await postJSON(`${cfg.baseURL}/v1/images/edits`, payload, signal);
        const url = data?.data?.[0]?.url || data?.data?.[0]?.image_url;
        if (!url) throw new Error('error_no_image');
        const imageUrl = await fetchImageAsDataUrl(url);
        return { imageUrl, provider: cfg.name, model };
      } else {
        const payload: any = {
          model,
          prompt: `${buildStylePrompt(style)} Create a variation of the provided sticker. ${getStrengthGuidance(options.strength)}${options.customPrompt ? ` Custom: ${options.customPrompt}.` : ''} Keep character identity and style identical.`,
          image: previousStickerBase64,
          n: 1,
          size: '1024x1024',
        };
        const data = await postJSON(`${cfg.baseURL}/v1/images/generations`, payload, signal);
        const url = data?.data?.[0]?.url || data?.data?.[0]?.image_url;
        if (!url) throw new Error('error_no_image');
        const imageUrl = await fetchImageAsDataUrl(url);
        return { imageUrl, provider: cfg.name, model };
      }
    },
    async generateStickerSet(sourceImageBase64, style, variations, signal, modelOverride) {
      const results = await Promise.all(variations.map((v) => this.generateSticker(sourceImageBase64, style, v, signal, modelOverride)));
      return results;
    },
  };
}
