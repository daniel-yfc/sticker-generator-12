import React from 'react';
import { STYLES, GALLERY_ITEMS } from '../constants';
import { StyleOption } from '../types';
import { Check } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: StyleOption;
  onSelect: (style: StyleOption) => void;
  disabled: boolean;
  t: (key: string) => any;
  stylesTranslation: any;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect, disabled, t, stylesTranslation }) => {
  const [failedImages, setFailedImages] = React.useState<Record<number, boolean>>({});
  const selectedStyleName = stylesTranslation?.[selectedStyle?.id]?.name || selectedStyle?.id || '';

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-800">{t('step1_title')}</h2>
          <span className="text-xs font-medium text-gray-400 font-mono">({STYLES.length})</span>
        </div>
        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 rounded-full truncate max-w-[210px]">
          {t('step1_selected')}：{selectedStyleName}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {STYLES.map((style) => {
          const isSelected = selectedStyle.id === style.id;
          const styleInfo = stylesTranslation?.[style.id] || { name: `Style #${style.id}`, features: '' };
          const galleryItem = GALLERY_ITEMS.find((item) => item.styleId === style.id);
          const sampleImage = galleryItem?.imageUrl;
          const hasImage = sampleImage && !failedImages[style.id];

          return (
            <button
              key={style.id}
              onClick={() => onSelect(style)}
              disabled={disabled}
              title={`${styleInfo.name} - ${styleInfo.features}`}
              className={`
                group relative flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border text-left transition-all duration-150 h-[52px]
                ${isSelected 
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500/20' 
                  : 'border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/80 text-gray-800'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Minimalist Die-cut Sticker Preview */}
              <div className="w-10 h-10 rounded-lg bg-neutral-100/90 flex items-center justify-center shrink-0 overflow-hidden relative border border-neutral-200/70 p-0.5 group-hover:scale-105 transition-transform">
                {hasImage ? (
                  <img
                    src={sampleImage}
                    alt={styleInfo.name}
                    onError={() => setFailedImages(prev => ({ ...prev, [style.id]: true }))}
                    className="w-full h-full object-contain filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.18)]"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-full rounded ${style.previewColor} flex items-center justify-center text-white text-[10px] font-mono font-bold`}>
                    #{style.id}
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-semibold text-neutral-400 shrink-0">
                    #{style.id.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-950 font-bold' : 'text-gray-800'}`}>
                    {styleInfo.name}
                  </span>
                </div>
                <p className={`text-[11px] truncate leading-tight mt-0.5 ${isSelected ? 'text-indigo-700/80' : 'text-gray-500'}`}>
                  {styleInfo.features}
                </p>
              </div>

              {/* Minimalist Selection Indicator */}
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 ml-auto">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StyleSelector;
