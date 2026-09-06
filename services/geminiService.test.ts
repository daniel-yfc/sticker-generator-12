import { describe, it, expect } from 'vitest';
import { generateSticker, GenerationCancelledError } from './geminiService';
import { StyleOption } from '../types';

const mockStyle: StyleOption = {
  id: 1,
  prompt: 'vector illustration',
  previewColor: '#ffffff',
};

describe('geminiService - generateSticker', () => {
  it('throws error_process when imageBase64 is empty or invalid format', async () => {
    await expect(generateSticker('', mockStyle)).rejects.toThrow('error_process');
    await expect(generateSticker('not-a-data-url', mockStyle)).rejects.toThrow('error_process');
  });

  it('throws error_process when base64 payload is too small', async () => {
    const tinyBase64 = 'data:image/png;base64,AAAA';
    await expect(generateSticker(tinyBase64, mockStyle)).rejects.toThrow('error_process');
  });

  it('handles cancellation via AbortSignal', async () => {
    const validBase64 = 'data:image/png;base64,' + 'A'.repeat(500);
    const controller = new AbortController();
    controller.abort();

    await expect(
      generateSticker(validBase64, mockStyle, undefined, controller.signal)
    ).rejects.toThrow(GenerationCancelledError);
  });
});
