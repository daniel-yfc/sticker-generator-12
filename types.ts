
export interface StyleOption {
  id: number;
  prompt: string;
  previewColor: string;
}

export type VariationStrength = 'low' | 'medium' | 'high';

export interface VariationOptions {
  strength: VariationStrength;
  customPrompt?: string;
  sourceImageBase64?: string;
}

export enum AppStatus {
  IDLE = 'idle',
  EDITING = 'editing',
  READY = 'ready',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  SET_PROCESSING = 'set_processing',
  VARIATION_PROCESSING = 'variation_processing',
  SUCCESS = 'success',
  SET_SUCCESS = 'set_success',
  ERROR = 'error',
}

export interface StickerGenerationResult {
  imageUrl: string;
  isValid: boolean;
  errors?: string[];
}

export type Language = 'zh-TW' | 'en' | 'ja';
export type ViewMode = 'create' | 'gallery' | 'history';

export interface GalleryItem {
  id: string;
  imageUrl: string;
  styleId: number;
  author: string;
}

export interface StickerRecord {
  id: string;
  imageUrl: string;
  styleId: number;
  timestamp: number;
  sourceImageId?: string;
  parentStickerId?: string;
  isVariation?: boolean;
  variationStrength?: VariationStrength;
  variationPrompt?: string;
}

export interface StickerSet {
  sourceId: string;
  stickers: StickerRecord[];
}
