import React from 'react';
import { Sparkles, Sliders, ArrowRight, Smile, ThumbsUp, Zap, X } from 'lucide-react';
import { VariationStrength } from '../types';

interface VariationStudioProps {
  styleName: string;
  selectedStrength: VariationStrength;
  onSelectStrength: (strength: VariationStrength) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  onTriggerVariation: () => void;
  isGeneratingVariation: boolean;
  t: (key: string) => any;
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

const VariationStudio: React.FC<VariationStudioProps> = ({
  styleName,
  selectedStrength,
  onSelectStrength,
  customPrompt,
  onCustomPromptChange,
  onTriggerVariation,
  isGeneratingVariation,
  t,
}) => {
  const handleTagClick = (tagText: string) => {
    const cleanTag = tagText.replace(/^[^\s]+ /, '');
    if (!customPrompt.trim()) {
      onCustomPromptChange(cleanTag);
    } else if (!customPrompt.includes(cleanTag)) {
      onCustomPromptChange(`${customPrompt}、${cleanTag}`);
    }
  };

  return (
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

        <div
          role="radiogroup"
          aria-label={t('variation_strength_label')}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {/* Low Intensity */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedStrength === 'low'}
            onClick={() => onSelectStrength('low')}
            className={`text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer ${
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
            role="radio"
            aria-checked={selectedStrength === 'medium'}
            onClick={() => onSelectStrength('medium')}
            className={`text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer ${
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
            role="radio"
            aria-checked={selectedStrength === 'high'}
            onClick={() => onSelectStrength('high')}
            className={`text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer ${
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
              onClick={() => onCustomPromptChange('')}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 cursor-pointer"
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
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 rounded-lg text-xs font-medium text-gray-600 transition-colors shadow-2xs active:scale-95 cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
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
          onClick={onTriggerVariation}
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
  );
};

export default VariationStudio;
