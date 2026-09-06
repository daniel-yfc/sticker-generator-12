import { describe, it, expect } from 'vitest';
import { validateFile, decodeImageAndValidateDimensions } from './FileUpload';

describe('FileUpload - validateFile', () => {
  it('rejects unsupported MIME types', async () => {
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    await expect(validateFile(file)).rejects.toThrow('validation_file_type');
  });

  it('rejects empty files (0 bytes)', async () => {
    const file = new File([], 'empty.png', { type: 'image/png' });
    await expect(validateFile(file)).rejects.toThrow('validation_file_corrupt');
  });

  it('rejects files larger than 10MB', async () => {
    const bigFile = new File([''], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });
    await expect(validateFile(bigFile)).rejects.toThrow('validation_file_size');
  });

  it('rejects file when magic bytes do not match declared PNG MIME', async () => {
    const fakeBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
    const file = new File([fakeBytes], 'fake.png', { type: 'image/png' });
    await expect(validateFile(file)).rejects.toThrow('validation_file_corrupt');
  });

  it('accepts valid PNG file matching magic bytes and decodes dimensions', async () => {
    const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const file = new File([pngMagic], 'valid.png', { type: 'image/png' });
    const result = await validateFile(file);
    expect(result.mime).toBe('image/png');
    expect(result.dataUrl).toContain('data:image/png;base64,');
    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
  });

  it('accepts valid JPEG file matching magic bytes and decodes dimensions', async () => {
    const jpegMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const file = new File([jpegMagic], 'valid.jpg', { type: 'image/jpeg' });
    const result = await validateFile(file);
    expect(result.mime).toBe('image/jpeg');
    expect(result.dataUrl).toContain('data:image/jpeg;base64,');
    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
  });
});

describe('FileUpload - decodeImageAndValidateDimensions', () => {
  it('successfully decodes valid data URL', async () => {
    const res = await decodeImageAndValidateDimensions('data:image/png;base64,fake');
    expect(res.width).toBe(512);
    expect(res.height).toBe(512);
  });

  it('rejects invalid image data URL triggering onerror', async () => {
    await expect(decodeImageAndValidateDimensions('invalid-non-data-url')).rejects.toThrow(
      'validation_file_corrupt'
    );
  });
});

