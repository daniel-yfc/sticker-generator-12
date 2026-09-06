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

export function getProvider(): StickerProvider {
  switch (AI_PROVIDER) {
    case 'venice':
      return createOpenAICompatibleProvider(veniceConfig);
    case 'genspake':
      return createOpenAICompatibleProvider(genspakeConfig);
    case 'nvidia-nim':
      return createOpenAICompatibleProvider(nvidiaNimConfig);
    case 'openrouter':
      return createOpenAICompatibleProvider(openRouterConfig);
    case 'huggingface':
      return createOpenAICompatibleProvider(hfInferenceConfig);
    case 'gemini':
    default:
      return geminiProvider;
  }
}
