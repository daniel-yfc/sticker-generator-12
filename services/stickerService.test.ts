import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateSticker,
  generateStickerSet,
  generateStickerVariation,
  getLastProviderMetadata,
  getProviderConfig,
  GenerationCancelledError,
} from './stickerService';

const style = { id: 1, prompt: 'x', previewColor: 'bg-red-500' };

const okResponse = (body: any) =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as any;

describe('stickerService (proxy client)', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts generate requests to /api/generate with provider and model', async () => {
    mockFetch.mockResolvedValue(
      okResponse({ images: ['data:image/png;base64,aaa'], provider: 'venice', model: 'venice-v2' })
    );

    const result = await generateSticker(
      'data:image/png;base64,src',
      style,
      undefined,
      undefined,
      'venice-v2',
      'venice'
    );

    expect(result).toBe('data:image/png;base64,aaa');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/generate');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.mode).toBe('generate');
    expect(body.provider).toBe('venice');
    expect(body.model).toBe('venice-v2');
    expect(getLastProviderMetadata()).toEqual({ provider: 'venice', model: 'venice-v2' });
  });

  it('surfaces server error codes as i18n keys', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'error_no_provider' }),
    } as any);

    await expect(generateSticker('data:image/png;base64,src', style)).rejects.toThrow('error_no_provider');
  });

  it('falls back to error_process for non-JSON error responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('not json');
      },
    } as any);

    await expect(generateSticker('data:image/png;base64,src', style)).rejects.toThrow('error_process');
  });

  it('maps a pre-aborted signal to GenerationCancelledError without fetching', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      generateSticker('data:image/png;base64,src', style, undefined, controller.signal)
    ).rejects.toBeInstanceOf(GenerationCancelledError);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns every image of a sticker set', async () => {
    mockFetch.mockResolvedValue(
      okResponse({ images: ['a', 'b', 'c', 'd'], provider: 'gemini', model: 'm' })
    );

    const results = await generateStickerSet('data:image/png;base64,src', style, ['v1', 'v2', 'v3', 'v4']);
    expect(results).toEqual(['a', 'b', 'c', 'd']);
  });

  it('sends variation strength and custom prompt through', async () => {
    mockFetch.mockResolvedValue(
      okResponse({ images: ['data:image/png;base64,v'], provider: 'gemini', model: 'm' })
    );

    const result = await generateStickerVariation('data:image/png;base64,prev', style, {
      strength: 'high',
      customPrompt: 'wink',
    });

    expect(result).toBe('data:image/png;base64,v');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.mode).toBe('variation');
    expect(body.variationOptions).toEqual({ strength: 'high', customPrompt: 'wink' });
  });

  it('loads provider config from /api/config', async () => {
    mockFetch.mockResolvedValue(
      okResponse({
        defaultProvider: 'gemini',
        providers: [{ key: 'gemini', label: 'Google Gemini', models: ['m1'] }],
      })
    );

    const cfg = await getProviderConfig();
    expect(mockFetch.mock.calls[0][0]).toBe('/api/config');
    expect(cfg.defaultProvider).toBe('gemini');
    expect(cfg.providers[0].models).toEqual(['m1']);
  });
});
