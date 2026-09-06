import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getProvider } from './registry';

describe('provider registry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Object.assign(process.env, { AI_PROVIDER: 'gemini' });
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it('returns geminiProvider by default when AI_PROVIDER is unset', () => {
    delete process.env.AI_PROVIDER;
    const provider = getProvider();
    expect(provider.name).toBe('gemini');
  });

  it('returns geminiProvider when AI_PROVIDER=gemini', () => {
    process.env.AI_PROVIDER = 'gemini';
    const provider = getProvider();
    expect(provider.name).toBe('gemini');
  });

  it('returns venice provider when AI_PROVIDER=venice', () => {
    process.env.AI_PROVIDER = 'venice';
    process.env.VENICE_API_KEY = 'test-key';
    const provider = getProvider();
    expect(provider.name).toBe('venice');
  });

  it('returns genspake provider when AI_PROVIDER=genspake', () => {
    process.env.AI_PROVIDER = 'genspake';
    process.env.GENSPAKE_API_KEY = 'test-key';
    const provider = getProvider();
    expect(provider.name).toBe('genspake');
  });

  it('returns nvidia-nim provider when AI_PROVIDER=nvidia-nim', () => {
    process.env.AI_PROVIDER = 'nvidia-nim';
    process.env.NVIDIA_NIM_API_KEY = 'test-key';
    const provider = getProvider();
    expect(provider.name).toBe('nvidia-nim');
  });

  it('returns openrouter provider when AI_PROVIDER=openrouter', () => {
    process.env.AI_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'test-key';
    const provider = getProvider();
    expect(provider.name).toBe('openrouter');
  });

  it('returns huggingface provider when AI_PROVIDER=huggingface', () => {
    process.env.AI_PROVIDER = 'huggingface';
    process.env.HUGGINGFACE_API_KEY = 'test-key';
    const provider = getProvider();
    expect(provider.name).toBe('huggingface');
  });
});
