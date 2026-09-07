import React, { useState, useEffect } from 'react';
import { Sparkles, Sticker, Globe, Settings } from 'lucide-react';
import { Language, ViewMode, ProviderSettings } from '../types';
import { getProviderConfig, ProviderPublicConfig } from '../services/stickerService';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  t: (key: string) => any;
  onProviderSettingsChange?: (settings: ProviderSettings) => void;
}

const PROVIDER_SETTINGS_KEY = 'sticker_maker_provider_settings';

// Fallback list used until /api/config responds (or if it fails). Models are
// intentionally empty: the server then applies its own default model.
const STATIC_PROVIDERS: ProviderPublicConfig[] = [
  { key: 'gemini', label: 'Google Gemini', models: [] },
  { key: 'venice', label: 'Venice.AI', models: [] },
  { key: 'genspake', label: 'Genspake', models: [] },
  { key: 'nvidia-nim', label: 'NVIDIA NIM', models: [] },
  { key: 'openrouter', label: 'OpenRouter', models: [] },
  { key: 'huggingface', label: 'Hugging Face', models: [] },
];

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, currentLang, onLangChange, t, onProviderSettingsChange }) => {
  const navItems: { id: ViewMode; label: string }[] = [
    { id: 'create', label: t('nav_create') },
    { id: 'history', label: t('nav_history') },
    { id: 'gallery', label: t('nav_gallery') },
  ];

  const [showSettings, setShowSettings] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [providerOptions, setProviderOptions] = useState<ProviderPublicConfig[]>(STATIC_PROVIDERS);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROVIDER_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedProvider(parsed.provider || 'gemini');
        setSelectedModel(parsed.model || '');
      }
    } catch (e) {
      console.warn('Failed to load provider settings:', e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getProviderConfig()
      .then((cfg) => {
        if (cancelled || !cfg.providers || cfg.providers.length === 0) return;
        setProviderOptions(cfg.providers);
        // If the saved provider has no server-side key, fall back to the server default.
        setSelectedProvider((prev) =>
          cfg.providers.some((p) => p.key === prev) ? prev : cfg.defaultProvider
        );
      })
      .catch(() => {
        // Config endpoint unreachable — keep static list; generation errors
        // will surface with a clear server message at call time.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const models = providerOptions.find((p) => p.key === selectedProvider)?.models || [];
    setAvailableModels(models);
    if (models.length > 0 && !models.includes(selectedModel)) {
      setSelectedModel(models[0]);
    }
  }, [selectedProvider, providerOptions]);

  useEffect(() => {
    if (onProviderSettingsChange) {
      onProviderSettingsChange({ provider: selectedProvider, model: selectedModel });
    }
    try {
      localStorage.setItem(PROVIDER_SETTINGS_KEY, JSON.stringify({ provider: selectedProvider, model: selectedModel }));
    } catch (e) {
      console.warn('Failed to save provider settings:', e);
    }
  }, [selectedProvider, selectedModel]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Home"
            className="flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
            onClick={() => onViewChange('create')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewChange('create');
              }
            }}
          >
            <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
              <Sticker className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">{t('header_title')}</h1>
              <p className="text-xs text-gray-500 font-medium">{t('header_subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
            <nav className="flex bg-gray-100/80 p-1 rounded-lg">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                    currentView === item.id
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <button
                  type="button"
                  aria-label="Language selector"
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">{currentLang}</span>
                </button>

                <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block">
                  <button onClick={() => onLangChange('zh-TW')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">繁體中文</button>
                  <button onClick={() => onLangChange('en')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">English</button>
                  <button onClick={() => onLangChange('ja')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">日本語</button>
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md transition-colors"
                  aria-label="Provider settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {showSettings && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-30">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700">Provider</label>
                        <select
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="mt-1 w-full px-2 py-1 text-sm border border-gray-200 rounded-md"
                        >
                          {providerOptions.map((p) => (
                            <option key={p.key} value={p.key}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700">Model</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="mt-1 w-full px-2 py-1 text-sm border border-gray-200 rounded-md"
                        >
                          {availableModels.length === 0 && <option value="">server default</option>}
                          {availableModels.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>V2.1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
