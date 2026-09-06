export type VariationStrength = 'low' | 'medium' | 'high';

export interface StyleOption {
  id: number;
  prompt: string;
  previewColor: string;
}

export interface VariationOptions {
  strength: VariationStrength;
  customPrompt?: string;
  sourceImageBase64?: string;
}

export interface StickerProviderResult {
  imageUrl: string;
  provider: string;
  model: string;
}

export interface StickerProvider {
  name: string;
  generateSticker(
    imageBase64: string,
    style: StyleOption,
    variationPrompt?: string,
    signal?: AbortSignal
  ): Promise<StickerProviderResult>;
  generateStickerVariation(
    previousStickerBase64: string,
    style: StyleOption,
    options: VariationOptions,
    signal?: AbortSignal
  ): Promise<StickerProviderResult>;
  generateStickerSet(
    sourceImageBase64: string,
    style: StyleOption,
    variations: string[],
    signal?: AbortSignal
  ): Promise<StickerProviderResult[]>;
}
