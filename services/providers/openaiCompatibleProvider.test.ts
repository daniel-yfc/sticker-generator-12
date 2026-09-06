import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOpenAICompatibleProvider } from './openaiCompatibleProvider';

const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('openaiCompatibleProvider', () => {
  const cfg = {
    name: 'test-provider',
    baseURL: 'https://api.test.ai',
    apiKeyEnv: 'TEST_API_KEY',
    model: 'test-model',
    supportsEdits: false,
  };

  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.TEST_API_KEY = 'sk-test123';
    mockFetch.mockClear();
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it('generates a sticker and returns a data URL on success', async () => {
    const provider = createOpenAICompatibleProvider(cfg);
    const mockImageUrl = 'https://cdn.test.ai/generated.png';
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ url: mockImageUrl }] }),
      })
      .mockResolvedValueOnce({
        blob: async () => new Blob(['fake-png'], { type: 'image/png' }),
      });

    const result = await provider.generateSticker(
      'data:image/png;base64,fakebase64',
      { id: 1, prompt: 'vector art', previewColor: 'bg-blue-500' },
      'smiling'
    );

    expect(result.provider).toBe('test-provider');
    expect(result.model).toBe('test-model');
    expect(result.imageUrl).toContain('data:image/png;base64,');
  });

  it('throws error_timeout on 429 rate limit', async () => {
    const provider = createOpenAICompatibleProvider(cfg);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    });

    await expect(
      provider.generateSticker('data:image/png;base64,fake', { id: 1, prompt: 'x', previewColor: 'bg-red-500' })
    ).rejects.toThrow('error_timeout');
  });

  it('throws error_safety when response contains safety keywords', async () => {
    const provider = createOpenAICompatibleProvider(cfg);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'blocked by safety policy',
    });

    await expect(
      provider.generateSticker('data:image/png;base64,fake', { id: 1, prompt: 'x', previewColor: 'bg-red-500' })
    ).rejects.toThrow('error_safety');
  });

  it('respects AbortSignal and throws error_cancelled', async () => {
    const provider = createOpenAICompatibleProvider(cfg);
    const controller = new AbortController();
    controller.abort();

    await expect(
      provider.generateSticker('data:image/png;base64,fake', { id: 1, prompt: 'x', previewColor: 'bg-red-500' }, undefined, controller.signal)
    ).rejects.toThrow('error_cancelled');
  });

  it('uses images/edits endpoint when supportsEdits=true', async () => {
    const editCfg = { ...cfg, supportsEdits: true };
    const provider = createOpenAICompatibleProvider(editCfg);
    const mockImageUrl = 'https://cdn.test.ai/edited.png';
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ url: mockImageUrl }] }),
      })
      .mockResolvedValueOnce({
        blob: async () => new Blob(['fake-png'], { type: 'image/png' }),
      });

    await provider.generateStickerVariation(
      'data:image/png;base64,fake',
      { id: 1, prompt: 'vector art', previewColor: 'bg-blue-500' },
      { strength: 'medium' }
    );

    const firstCall = mockFetch.mock.calls[0][0] as string;
    expect(firstCall).toContain('/v1/images/edits');
  });
});
