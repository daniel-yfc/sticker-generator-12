import '@testing-library/jest-dom/vitest';

// JSDOM does not load or decode images. Simulate onload/onerror for Image elements.
Object.defineProperty(globalThis.Image.prototype, 'src', {
  set(src: string) {
    if (typeof src === 'string' && src.startsWith('data:image/')) {
      setTimeout(() => {
        Object.defineProperty(this, 'naturalWidth', { value: 512, configurable: true });
        Object.defineProperty(this, 'naturalHeight', { value: 512, configurable: true });
        Object.defineProperty(this, 'width', { value: 512, configurable: true });
        Object.defineProperty(this, 'height', { value: 512, configurable: true });
        if (typeof this.onload === 'function') {
          this.onload(new Event('load'));
        }
      }, 0);
    } else {
      setTimeout(() => {
        if (typeof this.onerror === 'function') {
          this.onerror(new Event('error'));
        }
      }, 0);
    }
  },
});
