import React, { useState } from 'react';
import { UploadCloud, Edit, RefreshCw, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentPreview?: string;
  onEditClick?: () => void;
  disabled: boolean;
  t: (key: string) => any;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;
const MIN_MAGIC_BYTES = 8;

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

const matchesMagicBytes = async (file: File, mime: string): Promise<boolean> => {
  const signatures = MAGIC_BYTES[mime];
  if (!signatures) return false;
  const slice = file.slice(0, MIN_MAGIC_BYTES);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return signatures.some((sig) => sig.every((b, i) => bytes[i] === b));
};

const readAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('validation_file_corrupt'));
      }
    };
    reader.onerror = () => reject(new Error('validation_file_corrupt'));
    reader.readAsDataURL(file);
  });

export const validateFile = async (file: File): Promise<{ dataUrl: string; mime: string }> => {
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    throw new Error('validation_file_type');
  }
  if (file.size <= 0) {
    throw new Error('validation_file_corrupt');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('validation_file_size');
  }
  const ok = await matchesMagicBytes(file, file.type);
  if (!ok) {
    throw new Error('validation_file_corrupt');
  }
  const dataUrl = await readAsDataURL(file);
  return { dataUrl, mime: file.type };
};

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, currentPreview, onEditClick, disabled, t }) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setValidating(true);
      setLocalError(null);
      try {
        await validateFile(file);
        onFileSelect(file);
      } catch (err: any) {
        const code = err?.message || 'validation_file_corrupt';
        setLocalError(t(code) || code);
      } finally {
        setValidating(false);
        event.target.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-base font-bold text-gray-800">{t('step2_title')}</h2>
      </div>

      {localError && (
        <div
          role="alert"
          className="mb-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{localError}</span>
        </div>
      )}

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
                    disabled={disabled || validating}
                    className="hidden"
                  />
               </label>
             </div>
          </div>
        </div>
      ) : (
        <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all h-[232px] flex flex-col items-center justify-center
          ${disabled || validating ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/10'}`}>

          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            disabled={disabled || validating}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {validating ? t('processing_title') : t('step2_drag')}
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
