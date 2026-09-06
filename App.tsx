
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import StyleSelector from './components/StyleSelector';
import FileUpload from './components/FileUpload';
import ProcessingView from './components/ProcessingView';
import ResultDisplay from './components/ResultDisplay';
import Gallery from './components/Gallery';
import StickerHistory from './components/StickerHistory';
import ImageEditor from './components/ImageEditor';
import StickerSetView from './components/StickerSetView';
import { STYLES, TRANSLATIONS } from './constants';
import { AppStatus, StyleOption, Language, ViewMode, StickerRecord, VariationStrength } from './types';
import { generateSticker, generateStickerSet, generateStickerVariation } from './services/geminiService';
import { AlertCircle, ArrowRight, Layers, Sticker, RefreshCw, Sparkles } from 'lucide-react';

const HISTORY_KEY = 'sticker_maker_history_v2';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>(STYLES[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previousSticker, setPreviousSticker] = useState<string | null>(null);
  const [isVariationResult, setIsVariationResult] = useState<boolean>(false);
  const [lastVariationStrength, setLastVariationStrength] = useState<VariationStrength | undefined>(undefined);
  const [lastVariationPrompt, setLastVariationPrompt] = useState<string | undefined>(undefined);
  const [generatedSet, setGeneratedSet] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('create');
  const [language, setLanguage] = useState<Language>('zh-TW');
  
  const [history, setHistory] = useState<StickerRecord[]>([]);

  const isProcessing = status === AppStatus.PROCESSING || status === AppStatus.SET_PROCESSING || status === AppStatus.VARIATION_PROCESSING;

  const t = (key: string) => {
    return (TRANSLATIONS[language] as any)[key] || key;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Storage access not permitted or failed to parse:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Storage write not permitted or quota exceeded:", e);
    }
  }, [history]);

  const addToHistory = (
    imageUrl: string,
    styleId: number,
    options?: {
      isVariation?: boolean;
      variationStrength?: VariationStrength;
      variationPrompt?: string;
    }
  ) => {
    const newRecord: StickerRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      imageUrl,
      styleId,
      timestamp: Date.now(),
      isVariation: options?.isVariation,
      variationStrength: options?.variationStrength,
      variationPrompt: options?.variationPrompt,
    };
    setHistory(prev => [newRecord, ...prev]);
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleStyleSelect = useCallback((style: StyleOption) => {
    setSelectedStyle(style);
  }, []);

  const handleGallerySelect = async (styleId: number, imageUrl?: string) => {
    const style = STYLES.find(s => s.id === styleId);
    if (style) {
      setSelectedStyle(style);
      
      if (imageUrl) {
        setStatus(AppStatus.UPLOADING);
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setRawImage(reader.result as string);
            setStatus(AppStatus.EDITING);
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error("Failed to import gallery image", err);
          setStatus(AppStatus.ERROR);
          setErrorMessage(t('error_upload'));
        }
      }
      
      setView('create');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.UPLOADING);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImage(reader.result);
        setStatus(AppStatus.EDITING); 
      }
    };
    reader.onerror = () => {
      setErrorMessage(t('error_upload'));
      setStatus(AppStatus.ERROR);
    };
    reader.readAsDataURL(file);
  };

  const handleEditConfirm = (newImageBase64: string) => {
    setProcessedImage(newImageBase64);
    setStatus(AppStatus.READY);
  };

  const handleGenerate = async () => {
    if (!processedImage) return;
    
    setStatus(AppStatus.PROCESSING);
    setErrorMessage(null);
    setGeneratedImage(null);
    setPreviousSticker(null);
    setIsVariationResult(false);
    setLastVariationStrength(undefined);
    setLastVariationPrompt(undefined);

    const uiTimeout = setTimeout(() => {
      if (status === AppStatus.PROCESSING) {
        setErrorMessage(t("error_timeout"));
        setStatus(AppStatus.ERROR);
      }
    }, 70000);

    try {
      const resultImage = await generateSticker(processedImage, selectedStyle);
      
      const img = new Image();
      img.onload = () => {
          clearTimeout(uiTimeout);
          setGeneratedImage(resultImage);
          addToHistory(resultImage, selectedStyle.id);
          setStatus(AppStatus.SUCCESS);
      };
      img.onerror = () => {
          clearTimeout(uiTimeout);
          setErrorMessage(t('error_process'));
          setStatus(AppStatus.ERROR);
      };
      img.src = resultImage;

    } catch (error: any) {
      clearTimeout(uiTimeout);
      setErrorMessage(t(error.message));
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGenerateVariation = async (strength: VariationStrength, customPrompt?: string) => {
    if (!generatedImage) return;

    const baseSticker = generatedImage;
    setPreviousSticker(baseSticker);
    setStatus(AppStatus.VARIATION_PROCESSING);
    setErrorMessage(null);

    const uiTimeout = setTimeout(() => {
      if (status === AppStatus.VARIATION_PROCESSING) {
        setErrorMessage(t("error_timeout"));
        setStatus(AppStatus.ERROR);
      }
    }, 75000);

    try {
      const resultImage = await generateStickerVariation(baseSticker, selectedStyle, {
        strength,
        customPrompt,
        sourceImageBase64: processedImage || undefined
      });

      const img = new Image();
      img.onload = () => {
        clearTimeout(uiTimeout);
        setGeneratedImage(resultImage);
        setIsVariationResult(true);
        setLastVariationStrength(strength);
        setLastVariationPrompt(customPrompt);
        addToHistory(resultImage, selectedStyle.id, {
          isVariation: true,
          variationStrength: strength,
          variationPrompt: customPrompt
        });
        setStatus(AppStatus.SUCCESS);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      img.onerror = () => {
        clearTimeout(uiTimeout);
        setErrorMessage(t('error_process'));
        setStatus(AppStatus.SUCCESS);
      };
      img.src = resultImage;

    } catch (error: any) {
      clearTimeout(uiTimeout);
      setErrorMessage(t(error.message));
      setStatus(AppStatus.SUCCESS);
    }
  };

  const handleGenerateSet = async () => {
    if (!processedImage) return;

    setStatus(AppStatus.SET_PROCESSING);
    setErrorMessage(null);
    setGeneratedSet([]);

    const variations = [
      "giving a friendly thumbs up with a big smile",
      "looking very happy and laughing joyfully",
      "looking surprised with wide eyes and open mouth",
      "looking cool wearing stylish sunglasses"
    ];

    try {
      const results = await generateStickerSet(processedImage, selectedStyle, variations);
      results.forEach(imgUrl => addToHistory(imgUrl, selectedStyle.id));
      setGeneratedSet(results);
      setStatus(AppStatus.SET_SUCCESS);
    } catch (error: any) {
      setErrorMessage(t(error.message));
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setGeneratedImage(null);
    setPreviousSticker(null);
    setIsVariationResult(false);
    setLastVariationStrength(undefined);
    setLastVariationPrompt(undefined);
    setGeneratedSet([]);
    setErrorMessage(null);
    setRawImage(null);
    setProcessedImage(null);
  };

  const handleReuse = () => {
    setStatus(AppStatus.READY);
    setGeneratedImage(null);
    setPreviousSticker(null);
    setIsVariationResult(false);
    setLastVariationStrength(undefined);
    setLastVariationPrompt(undefined);
    setGeneratedSet([]);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleImageUpdate = (newUrl: string) => {
    setGeneratedImage(newUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header 
        currentView={view} 
        onViewChange={setView}
        currentLang={language}
        onLangChange={setLanguage}
        t={t}
      />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
        
        {view === 'gallery' ? (
          <Gallery 
            onSelectStyle={handleGallerySelect} 
            t={t}
            stylesTranslation={(TRANSLATIONS[language] as any).styles}
          />
        ) : view === 'history' ? (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center gap-6">
              <div className="bg-white/20 p-4 rounded-2xl">
                 <Layers className="w-12 h-12" />
              </div>
              <div className="text-center md:text-left">
                 <h2 className="text-3xl font-bold">{t('history_title')}</h2>
                 <p className="text-indigo-100 mt-1">{t('history_subtitle')}</p>
              </div>
              <button 
                onClick={() => setView('create')}
                className="md:ml-auto bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
              >
                + {t('nav_create')}
              </button>
            </div>
            <StickerHistory 
              history={history} 
              onDelete={deleteFromHistory} 
              t={t}
              stylesTranslation={(TRANSLATIONS[language] as any).styles}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            
            {status === AppStatus.EDITING && rawImage && (
               <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                 <div className="w-full max-w-xl">
                   <ImageEditor 
                     imageSrc={rawImage}
                     onConfirm={handleEditConfirm}
                     onCancel={() => {
                        setRawImage(null);
                        setStatus(AppStatus.IDLE);
                     }}
                     t={t}
                   />
                 </div>
               </div>
            )}

            {status === AppStatus.IDLE && (
               <div className="mb-8 p-8 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                 <div className="bg-indigo-50 p-4 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('welcome_title')}</h2>
                    <p className="text-gray-500">
                      {t('welcome_desc')} <span className="font-bold text-indigo-600 underline decoration-2 underline-offset-4">{t('welcome_default_style')}</span>。
                    </p>
                 </div>
               </div>
            )}

            {status === AppStatus.SUCCESS && generatedImage ? (
              <div className="space-y-12 animate-fadeIn">
                {errorMessage && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      onClick={() => setErrorMessage(null)}
                      className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-100"
                    >
                      關閉
                    </button>
                  </div>
                )}
                <ResultDisplay 
                  imageUrl={generatedImage} 
                  previousImageUrl={previousSticker}
                  style={selectedStyle} 
                  onReset={handleReset} 
                  onReuse={handleReuse} 
                  onImageUpdate={handleImageUpdate}
                  onGenerateVariation={handleGenerateVariation}
                  isGeneratingVariation={status === AppStatus.VARIATION_PROCESSING}
                  t={t}
                  stylesTranslation={(TRANSLATIONS[language] as any).styles}
                  isVariationResult={isVariationResult}
                  variationStrength={lastVariationStrength}
                  variationPrompt={lastVariationPrompt}
                />
                <div className="border-t border-gray-200 pt-12">
                   <div className="flex items-center gap-3 mb-6">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-xl font-bold text-gray-800">當前貼圖集 (Current Set)</h3>
                   </div>
                   <StickerHistory 
                    history={history.slice(0, 10)} 
                    onDelete={deleteFromHistory} 
                    t={t} 
                    stylesTranslation={(TRANSLATIONS[language] as any).styles}
                  />
                </div>
              </div>
            ) : status === AppStatus.SET_SUCCESS && generatedSet.length > 0 ? (
               <div className="space-y-12 animate-fadeIn">
                  <StickerSetView 
                    stickers={generatedSet}
                    style={selectedStyle}
                    onReset={handleReset}
                    t={t}
                    stylesTranslation={(TRANSLATIONS[language] as any).styles}
                  />
                  <div className="border-t border-gray-200 pt-12">
                   <div className="flex items-center gap-3 mb-6">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-xl font-bold text-gray-800">當前貼圖集 (Current Set)</h3>
                   </div>
                   <StickerHistory 
                    history={history.slice(0, 10)} 
                    onDelete={deleteFromHistory} 
                    t={t} 
                    stylesTranslation={(TRANSLATIONS[language] as any).styles}
                  />
                </div>
               </div>
            ) : (
              <>
                {(status === AppStatus.IDLE || status === AppStatus.READY || status === AppStatus.UPLOADING || status === AppStatus.ERROR) && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 order-2 lg:order-1">
                      <StyleSelector 
                        selectedStyle={selectedStyle} 
                        onSelect={handleStyleSelect} 
                        disabled={isProcessing}
                        t={t}
                        stylesTranslation={(TRANSLATIONS[language] as any).styles}
                      />
                    </div>
                    <div className="lg:col-span-1 order-1 lg:order-2 space-y-4">
                       <div className="sticky top-24 space-y-6">
                          <FileUpload 
                            onFileSelect={handleFileSelect} 
                            currentPreview={processedImage || undefined}
                            onEditClick={() => setStatus(AppStatus.EDITING)}
                            disabled={isProcessing}
                            t={t}
                          />
                           
                          {status === AppStatus.READY && (
                            <div className="space-y-3">
                              <button
                                onClick={handleGenerate}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group"
                              >
                                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                GO! (Single)
                                <ArrowRight className="w-6 h-6" />
                              </button>
                              <button
                                onClick={handleGenerateSet}
                                className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl font-bold text-lg border border-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                              >
                                <Layers className="w-5 h-5" />
                                {t('btn_generate_set')}
                              </button>
                            </div>
                          )}

                          {status === AppStatus.ERROR && errorMessage && (
                              <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex flex-col gap-4 shadow-sm animate-fadeIn">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="w-6 h-6 shrink-0" />
                                  <div>
                                    <h3 className="font-bold text-lg">{t('error_header')}</h3>
                                    <p className="text-sm opacity-90">{errorMessage}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={handleGenerate}
                                  className="bg-white text-red-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-red-50 transition-colors w-fit flex items-center gap-2"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  {t('btn_retry')}
                                </button>
                              </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}
                
                {isProcessing && (
                  <ProcessingView 
                    t={t} 
                    customTitle={status === AppStatus.VARIATION_PROCESSING ? t('variation_title') : undefined}
                    customMessage={status === AppStatus.VARIATION_PROCESSING ? t('processing_variation') : undefined}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-4">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Sticker className="w-6 h-6" />
             </div>
          </div>
          <p className="text-gray-400 text-sm">{t('footer')}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
