import React, { useState } from 'react';
import { Check, Wand2, Sparkles, Layers } from 'lucide-react';
import { StyleOption, VariationStrength } from '../types';
import ResultActions from './ResultActions';
import VariationStudio from './VariationStudio';

interface ResultDisplayProps {
  imageUrl: string;
  previousImageUrl?: string | null;
  style: StyleOption;
  onReset: () => void;
  onReuse: () => void;
  onImageUpdate: (newImage: string) => void;
  onGenerateVariation: (strength: VariationStrength, customPrompt?: string) => Promise<void> | void;
  isGeneratingVariation?: boolean;
  t: (key: string) => any;
  stylesTranslation: any;
  isVariationResult?: boolean;
  variationStrength?: VariationStrength;
  variationPrompt?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  imageUrl,
  previousImageUrl,
  style,
  onReset,
  onReuse,
  onImageUpdate,
  onGenerateVariation,
  isGeneratingVariation = false,
  t,
  stylesTranslation,
  isVariationResult = false,
  variationStrength: currentVariationStrength,
  variationPrompt: _currentVariationPrompt
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStrength, setSelectedStrength] = useState<VariationStrength>('medium');
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeView, setActiveView] = useState<'current' | 'previous'>('current');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `sticker-pro-${style.id}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side background removal (Magic Wand)
  const handleMagicWand = () => {
    setIsProcessing(true);
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check for pure or near white
        if (r > 240 && g > 240 && b > 240) {
          data[i + 3] = 0; // Alpha 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const newUrl = canvas.toDataURL('image/png');
      onImageUpdate(newUrl);
      setIsProcessing(false);
    };
  };

  const handleTriggerVariation = () => {
    onGenerateVariation(selectedStrength, customPrompt.trim() || undefined);
  };

  const styleName = stylesTranslation[style.id]?.name || `風格 #${style.id}`;
  const displayedImage = activeView === 'previous' && previousImageUrl ? previousImageUrl : imageUrl;

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Main Sticker Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Check className="w-5 h-5" />
              <span className="font-bold text-sm">{t('result_verified')}</span>
              {isVariationResult && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {t('tag_variation')}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('result_title')}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm">
                {t('result_style_label')}：<strong className="text-gray-800">{styleName}</strong>
              </span>
              {currentVariationStrength && (
                <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                  強度：{currentVariationStrength === 'low' ? '微幅 (Low)' : currentVariationStrength === 'high' ? '創意 (High)' : '標準 (Medium)'}
                </span>
              )}
            </div>
          </div>
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
            <Check className="w-4 h-4" />
            {t('result_saved')}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col items-center">
          {/* Compare toggle bar if previous image exists */}
          {previousImageUrl && (
            <div className="mb-6 flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-xl border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveView('current')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'current'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {t('compare_variation')}
              </button>
              <button
                type="button"
                onClick={() => setActiveView('previous')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'previous'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-gray-500" />
                {t('compare_original')}
              </button>
            </div>
          )}

          <div className="relative group">
            <div className="transparent-grid rounded-2xl overflow-hidden border-2 border-gray-200 shadow-inner bg-gray-100">
              <img
                src={displayedImage}
                alt="Generated Sticker"
                className={`w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] object-contain transition-opacity ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
              />
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleMagicWand}
                disabled={isProcessing}
                className="bg-white p-2.5 rounded-full shadow-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-gray-100 tooltip-trigger group/btn transition-all active:scale-95 cursor-pointer"
                title={t('btn_magic_wand')}
                aria-label={t('btn_magic_wand')}
              >
                <Wand2 className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute -bottom-3 -right-3 bg-white px-3 py-1 shadow-md rounded-full text-xs font-mono text-gray-600 border border-gray-200">
              512 x 512 px
            </div>
          </div>

          {activeView === 'previous' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mt-4">
              📌 目前正在查看上一張基準貼圖。點選上方按鈕切換回新變體。
            </p>
          )}

          {/* Core Action Bar */}
          <ResultActions
            onReuse={onReuse}
            onReset={onReset}
            onDownload={handleDownload}
            t={t}
          />
        </div>
      </div>

      {/* Feature 2: Sticker Variation Generator Studio */}
      <VariationStudio
        styleName={styleName}
        selectedStrength={selectedStrength}
        onSelectStrength={setSelectedStrength}
        customPrompt={customPrompt}
        onCustomPromptChange={setCustomPrompt}
        onTriggerVariation={handleTriggerVariation}
        isGeneratingVariation={isGeneratingVariation}
        t={t}
      />
    </div>
  );
};

export default ResultDisplay;
