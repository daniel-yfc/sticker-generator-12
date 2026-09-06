import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    'process.env.AI_PROVIDER': JSON.stringify(process.env.AI_PROVIDER || 'gemini'),
    'process.env.VENICE_API_KEY': JSON.stringify(process.env.VENICE_API_KEY || ''),
    'process.env.VENICE_MODEL': JSON.stringify(process.env.VENICE_MODEL || 'venice-v2'),
    'process.env.GENSPAKE_API_KEY': JSON.stringify(process.env.GENSPAKE_API_KEY || ''),
    'process.env.GENSPAKE_MODEL': JSON.stringify(process.env.GENSPAKE_MODEL || 'genspake-image-1'),
    'process.env.NVIDIA_NIM_API_KEY': JSON.stringify(process.env.NVIDIA_NIM_API_KEY || ''),
    'process.env.NVIDIA_NIM_BASE_URL': JSON.stringify(process.env.NVIDIA_NIM_BASE_URL || 'https://api.nvcf.nvidia.com/v2'),
    'process.env.NVIDIA_NIM_MODEL': JSON.stringify(process.env.NVIDIA_NIM_MODEL || 'stabilityai/stable-diffusion-3-5-large'),
    'process.env.OPENROUTER_API_KEY': JSON.stringify(process.env.OPENROUTER_API_KEY || ''),
    'process.env.OPENROUTER_MODEL': JSON.stringify(process.env.OPENROUTER_MODEL || 'openai/gpt-image-1'),
    'process.env.HUGGINGFACE_API_KEY': JSON.stringify(process.env.HUGGINGFACE_API_KEY || ''),
    'process.env.HUGGINGFACE_MODEL': JSON.stringify(process.env.HUGGINGFACE_MODEL || 'stabilityai/stable-diffusion-3-5-large'),
  },
});
