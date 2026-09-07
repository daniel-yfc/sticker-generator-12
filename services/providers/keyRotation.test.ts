import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOpenAICompatibleProvider } from './openaiCompatibleProvider';

const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('openaiCompatibleProvider - key rotation and model selection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.TEST_MULTI_KEY = 'key-a,key-b,key-c';
    process.env.TEST_MULTI_MODEL = 'model-1,model-2';
    mockFetch.mockClear();
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  const cfg = {
    name: 'multi-test',
    baseURL: 'https://api.multi.test',
    apiKeyEnv: 'TEST_MULTI_KEY',
    models: ['model-1', 'model-2'],
    supportsEdits: false,
  };

  it('rotates through multiple API keys on 401/403/429', async () => {
    const provider = createOpenAICompatibleProvider(cfg);
    const authHeaders: string[] = [];

    mockFetch.mockImplementation(async (_url: string, init: any) => {
      if (!init?.body) {
        // Image fetch — return a blob
        return { blob: async () => new Blob(['fake'], { type: 'image/png' }) };
      }
      authHeaders.push(init.headers['Authorization']);
      if (authHeaders.length < 3) {
        return { ok: false, status: 401, text: async () => 'unauthorized' };
      }
      return {
        ok: true,
        json: async () => ({ data: [{ url: 'https://cdn.multi.test/img.png' }] }),
      };
    });

    await provider.generateSticker('data:image/png;base64,fake', { id: 1, prompt: 'x', previewColor: 'bg-red-500' });

    // Should have tried multiple keys
    expect(authHeaders.length).toBeGreaterThan(1);
  });

  it('uses modelOverride when provided instead of default', async () => {
    const provider = createOpenAICompatibleProvider(cfg);
    let capturedBody: any = null;

    mockFetch.mockImplementation(async (_url: string, init: any) => {
      if (!init?.body) {
        return { blob: async () => new Blob(['fake'], { type: 'image/png' }) };
      }
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({ data: [{ url: 'https://cdn.multi.test/img.png' }] }),
      };
    });

    const result = await provider.generateSticker(
      'data:image/png;base64,fake',
      { id: 1, prompt: 'x', previewColor: 'bg-red-500' },
      undefined,
      undefined,
      'model-2'
    );

    expect(capturedBody.model).toBe('model-2');
    expect(result.model).toBe('model-2');
  });

  it('falls back to first model in list when no override', async () => {
    const provider = createOpenAICompatibleProvider(cfg);
    let capturedBody: any = null;

    mockFetch.mockImplementation(async (_url: string, init: any) => {
      if (!init?.body) {
        return { blob: async () => new Blob(['fake'], { type: 'image/png' }) };
      }
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({ data: [{ url: 'https://cdn.multi.test/img.png' }] }),
      };
    });

    const result = await provider.generateSticker(
      'data:image/png;base64,fake',
      { id: 1, prompt: 'x', previewColor: 'bg-red-500' }
    );

    expect(capturedBody.model).toBe('model-1');
    expect(result.model).toBe('model-1');
  });
});
