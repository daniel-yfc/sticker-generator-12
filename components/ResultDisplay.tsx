import React, { useState } from 'react';
import { Download, RefreshCcw, Check, Wand2, Repeat, Sparkles, Layers, Sliders, ArrowRight, Smile, ThumbsUp, Zap, X } from 'lucide-react';
import { StyleOption, VariationStrength } from '../types';

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

const QUICK_TAGS = [
  '😄 開懷大笑',
  '👍 豎起拇指比讚',
  '😉 眨眼微笑',
  '😎 戴帥氣墨鏡',
  '❤️ 雙手比心',
  '😮 吃驚張大嘴',
  '🤔 托腮思考',
  '🎉 興奮歡呼',
  '👋 熱情揮手',
  '☕ 悠閒喝咖啡'
];

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
  variationPrompt: currentVariationPrompt
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
    img.crossOrigin = "Anonymous";
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

  const handleTagClick = (tagText: string) => {
    // Strip emoji prefix for cleaner prompt
    const cleanTag = tagText.replace(/^[^\s]+ /, '');
    setCustomPrompt(prev => {
      if (!prev.trim()) return cleanTag;
      if (prev.includes(cleanTag)) return prev;
      return `${prev}、${cleanTag}`;
    });
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
              <span className="text-gray-500 text-sm">{t('result_style_label')}：<strong className="text-gray-800">{styleName}</strong></span>
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
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                onClick={handleMagicWand}
                disabled={isProcessing}
                className="bg-white p-2.5 rounded-full shadow-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-gray-100 tooltip-trigger group/btn transition-all active:scale-95"
                title={t('btn_magic_wand')}
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
          <div className="flex flex-wrap justify-center gap-3 mt-8 w-full max-w-lg">
            <button
              onClick={onReuse}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium transition-colors border border-indigo-100"
            >
              <Repeat className="w-4 h-4" />
              {t('btn_reuse')}
            </button>
            <button
              onClick={onReset}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('btn_reset')}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              {t('btn_download')}
            </button>
          </div>
        </div>
      </div>

      {/* Feature 2: Sticker Variation Generator Studio */}
      <div className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 rounded-2xl shadow-xl border-2 border-indigo-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-indigo-100/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-xl font-bold text-gray-900">{t('variation_title')}</h3>
            </div>
            <p className="text-gray-600 text-sm mt-1 max-w-xl">
              {t('variation_subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-indigo-200 rounded-full text-xs font-semibold text-indigo-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              鎖定風格：{styleName}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs font-medium text-purple-700">
              鎖定同人物主體
            </span>
          </div>
        </div>

        {/* Intensity Selection Cards */}
        <div className="mt-6 space-y-3">
          <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            {t('variation_strength_label')}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Low Intensity */}
            <button
              type="button"
              onClick={() => setSelectedStrength('low')}
              className={`text-left p-4 rounded-xl border-2 transition-all relative ${
                selectedStrength === 'low'
                  ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-100'
                  : 'border-gray-200 bg-white/70 hover:border-indigo-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedStrength === 'low' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                    <Smile className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-gray-900">{t('variation_strength_low')}</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">微調</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('variation_strength_low_desc')}
              </p>
            </button>

            {/* Medium Intensity */}
            <button
              type="button"
              onClick={() => setSelectedStrength('medium')}
              className={`text-left p-4 rounded-xl border-2 transition-all relative ${
                selectedStrength === 'medium'
                  ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-100'
                  : 'border-gray-200 bg-white/70 hover:border-indigo-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedStrength === 'medium' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <ThumbsUp className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-gray-900">{t('variation_strength_medium')}</span>
                </div>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">推薦</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('variation_strength_medium_desc')}
              </p>
            </button>

            {/* High Intensity */}
            <button
              type="button"
              onClick={() => setSelectedStrength('high')}
              className={`text-left p-4 rounded-xl border-2 transition-all relative ${
                selectedStrength === 'high'
                  ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-100'
                  : 'border-gray-200 bg-white/70 hover:border-indigo-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedStrength === 'high' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-gray-900">{t('variation_strength_high')}</span>
                </div>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">創意</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('variation_strength_high_desc')}
              </p>
            </button>
          </div>
        </div>

        {/* Quick Tag Pills & Custom Action Input */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-800">
              {t('variation_prompt_label')}
            </label>
            {customPrompt && (
              <button
                type="button"
                onClick={() => setCustomPrompt('')}
                className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> 清除
              </button>
            )}
          </div>

          {/* Quick Idea Chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 rounded-lg text-xs font-medium text-gray-600 transition-colors shadow-2xs active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={t('variation_prompt_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-indigo-100/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            💡 系統將以<strong>目前的貼圖</strong>作為參考，自動分析角色五官與筆觸，保持完全相同的風格並依強度變奏表情。
          </div>

          <button
            type="button"
            onClick={handleTriggerVariation}
            disabled={isGeneratingVariation}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isGeneratingVariation ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>變體生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t('btn_generate_variation')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
