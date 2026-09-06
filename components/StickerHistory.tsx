import React from 'react';
import { StickerRecord } from '../types';
import { Download, Trash2, Clock } from 'lucide-react';

interface StickerHistoryProps {
  history: StickerRecord[];
  onDelete: (id: string) => void;
  onClearAll?: () => void;
  t: (key: string) => any;
  stylesTranslation: any;
}

const StickerHistory: React.FC<StickerHistoryProps> = ({ history, onDelete, onClearAll, t, stylesTranslation }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{t('history_empty')}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('history_title')}</h2>
          <p className="text-sm text-gray-500">{t('history_subtitle')} · {t('history_limit_note')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
            {history.length} / 50
          </span>
          {onClearAll && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('history_clear_confirm'))) {
                  onClearAll();
                }
              }}
              className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('history_clear_all')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {history.map((item) => {
          const styleName = stylesTranslation[item.styleId]?.name || `Style #${item.styleId}`;
          const date = new Date(item.timestamp).toLocaleDateString();

          return (
            <div key={item.id} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              <div className="aspect-square bg-gray-100 transparent-grid p-4 relative">
                 <img 
                   src={item.imageUrl} 
                   alt="Sticker" 
                   className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-105" 
                   loading="lazy"
                 />
                 
                 {/* Actions Overlay */}
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={item.imageUrl}
                      download={`sticker-${item.id}.png`}
                      className="p-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                      title={t('btn_download')}
                      aria-label={t('btn_download')}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                      aria-label={`Delete sticker ${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              
              <div className="p-3">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-gray-800 truncate">{styleName}</p>
                  {item.isVariation && (
                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                      變體
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>{date}</span>
                  {item.variationStrength && (
                    <span className="text-indigo-600 font-medium">
                      {item.variationStrength === 'low' ? '微調' : item.variationStrength === 'high' ? '創意' : '標準'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StickerHistory;
