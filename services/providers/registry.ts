import { StickerProvider } from './types';
import { geminiProvider } from './geminiProvider';
import { createOpenAICompatibleProvider } from './openaiCompatibleProvider';

const ENV = (globalThis as any).process?.env || {};

const AI_PROVIDER = (ENV.AI_PROVIDER || 'gemini').toLowerCase();

const veniceConfig = {
  name: 'venice',
  baseURL: 'https://api.venice.ai/api/v1',
  apiKeyEnv: 'VENICE_API_KEY',
  model: ENV.VENICE_MODEL || 'venice-v2',
  supportsEdits: false,
};

const genspakeConfig = {
  name: 'genspake',
  baseURL: 'https://api.genspake.com',
  apiKeyEnv: 'GENSPAKE_API_KEY',
  model: ENV.GENSPAKE_MODEL || 'genspake-image-1',
  supportsEdits: false,
};

const nvidiaNimConfig = {
  name: 'nvidia-nim',
  baseURL: ENV.NVIDIA_NIM_BASE_URL || 'https://api.nvcf.nvidia.com/v2',
  apiKeyEnv: 'NVIDIA_NIM_API_KEY',
  model: ENV.NVIDIA_NIM_MODEL || 'stabilityai/stable-diffusion-3-5-large',
  supportsEdits: true,
  authHeader: 'Authorization',
  authPrefix: 'Bearer ',
};

const openRouterConfig = {
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKeyEnv: 'OPENROUTER_API_KEY',
  model: ENV.OPENROUTER_MODEL || 'openai/gpt-image-1',
  supportsEdits: false,
};

const hfInferenceConfig = {
  name: 'huggingface',
  baseURL: 'https://api-inference.huggingface.co',
  apiKeyEnv: 'HUGGINGFACE_API_KEY',
  model: ENV.HUGGINGFACE_MODEL || 'stabilityai/stable-diffusion-3-5-large',
  supportsEdits: false,
  authHeader: 'Authorization',
  authPrefix: 'Bearer ',
};

const PROVIDER_ORDER: Array<{ key: string; factory: () => StickerProvider }> = [
  { key: 'gemini', factory: () => geminiProvider },
  { key: 'venice', factory: () => createOpenAICompatibleProvider(veniceConfig) },
  { key: 'openrouter', factory: () => createOpenAICompatibleProvider(openRouterConfig) },
  { key: 'nvidia-nim', factory: () => createOpenAICompatibleProvider(nvidiaNimConfig) },
  { key: 'genspake', factory: () => createOpenAICompatibleProvider(genspakeConfig) },
  { key: 'huggingface', factory: () => createOpenAICompatibleProvider(hfInferenceConfig) },
];

const isProviderAvailable = (key: string): boolean => {
  switch (key) {
    case 'gemini':
      return !!ENV.GEMINI_API_KEY;
    case 'venice':
      return !!ENV.VENICE_API_KEY;
    case 'genspake':
      return !!ENV.GENSPAKE_API_KEY;
    case 'nvidia-nim':
      return !!ENV.NVIDIA_NIM_API_KEY;
    case 'openrouter':
      return !!ENV.OPENROUTER_API_KEY;
    case 'huggingface':
      return !!ENV.HUGGINGFACE_API_KEY;
    default:
      return false;
  }
};

export function getProvider(): StickerProvider {
  const primary = PROVIDER_ORDER.find((p) => p.key === AI_PROVIDER) || PROVIDER_ORDER[0];
  return primary.factory();
}

export function getProviderChain(): StickerProvider[] {
  const primaryKey = AI_PROVIDER;
  const ordered = [
    ...PROVIDER_ORDER.filter((p) => p.key === primaryKey),
    ...PROVIDER_ORDER.filter((p) => p.key !== primaryKey),
  ];
  return ordered.filter((p) => isProviderAvailable(p.key)).map((p) => p.factory());
}
