import React from 'react';
import { UploadCloud, Edit, RefreshCw } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentPreview?: string;
  onEditClick?: () => void;
  disabled: boolean;
  t: (key: string) => any;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, currentPreview, onEditClick, disabled, t }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileSelect(event.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-base font-bold text-gray-800">{t('step2_title')}</h2>
      </div>
      
      {currentPreview ? (
        <div className="bg-white rounded-xl border border-indigo-100 p-3 shadow-xs animate-fadeIn h-[232px] flex flex-col justify-between">
          <div className="flex-1 bg-gray-100/80 rounded-lg overflow-hidden relative mb-2 transparent-grid flex items-center justify-center min-h-0">
             <img src={currentPreview} alt="Preview" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-between shrink-0 pt-1">
             <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
               {t('step2_ready')}
             </span>
             <div className="flex gap-1.5">
               {onEditClick && (
                 <button onClick={onEditClick} className="p-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors" title={t('step2_reedit')}>
                   <Edit className="w-3.5 h-3.5" />
                 </button>
               )}
               <label className="p-1.5 text-gray-500 bg-gray-100 border border-gray-200/60 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" title={t('step2_change')}>
                 <RefreshCw className="w-3.5 h-3.5" />
                 <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    disabled={disabled}
                    className="hidden"
                  />
               </label>
             </div>
          </div>
        </div>
      ) : (
        <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all h-[232px] flex flex-col items-center justify-center
          ${disabled ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/10'}`}>
          
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {t('step2_drag')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('step2_hint')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
