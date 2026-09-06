import React from 'react';
import { Download, RefreshCcw, Repeat } from 'lucide-react';

interface ResultActionsProps {
  onReuse: () => void;
  onReset: () => void;
  onDownload: () => void;
  t: (key: string) => any;
}

const ResultActions: React.FC<ResultActionsProps> = ({
  onReuse,
  onReset,
  onDownload,
  t,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-8 w-full max-w-lg">
      <button
        type="button"
        onClick={onReuse}
        className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium transition-colors border border-indigo-100 cursor-pointer"
      >
        <Repeat className="w-4 h-4" />
        {t('btn_reuse')}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors cursor-pointer"
      >
        <RefreshCcw className="w-4 h-4" />
        {t('btn_reset')}
      </button>
      <button
        type="button"
        onClick={onDownload}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        {t('btn_download')}
      </button>
    </div>
  );
};

export default ResultActions;
