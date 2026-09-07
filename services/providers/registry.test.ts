import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getProvider, getProviderChain } from './registry';

describe('provider registry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Object.assign(process.env, {
      AI_PROVIDER: 'gemini',
      GEMINI_API_KEY: '',
      VENICE_API_KEY: '',
      OPENROUTER_API_KEY: '',
      NVIDIA_NIM_API_KEY: '',
      GENSPAKE_API_KEY: '',
      HUGGINGFACE_API_KEY: '',
    });
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it('returns geminiProvider by default when AI_PROVIDER is unset', () => {
    delete process.env.AI_PROVIDER;
    process.env.GEMINI_API_KEY = 'key';
    const provider = getProvider();
    expect(provider.name).toBe('gemini');
  });

  it('returns correct provider when AI_PROVIDER is set', () => {
    process.env.AI_PROVIDER = 'venice';
    process.env.VENICE_API_KEY = 'key';
    const provider = getProvider();
    expect(provider.name).toBe('venice');
  });

  it('builds fallback chain starting with primary provider when key exists', () => {
    process.env.AI_PROVIDER = 'venice';
    process.env.VENICE_API_KEY = 'venice-key';
    process.env.GEMINI_API_KEY = 'gemini-key';
    const chain = getProviderChain();
    expect(chain[0].name).toBe('venice');
    expect(chain[1].name).toBe('gemini');
  });

  it('skips providers without keys in fallback chain', () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'gemini-key';
    process.env.VENICE_API_KEY = '';
    process.env.OPENROUTER_API_KEY = 'openrouter-key';
    const chain = getProviderChain();
    const names = chain.map((p) => p.name);
    expect(names).toEqual(['gemini', 'openrouter']);
  });

  it('returns empty chain when no keys are set', () => {
    process.env.AI_PROVIDER = 'gemini';
    const chain = getProviderChain();
    expect(chain).toHaveLength(0);
  });
});
