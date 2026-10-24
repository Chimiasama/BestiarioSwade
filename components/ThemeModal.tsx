import React from 'react';
import { 
  ThemeMode,
  AppTheme, 
  AppFontFamily, 
  AppFontSize, 
  ThemeSettings, 
  THEME_OPTIONS, 
  FONT_OPTIONS, 
  FONT_SIZE_OPTIONS,
  THEME_PAIRS,
} from '../services/themeService';
import { Palette, X, Type, Check, Sparkles, Moon, Sun, Eye } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThemeSettings;
  onUpdateSettings: (newSettings: ThemeSettings) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const currentMode: ThemeMode = settings.mode;

  const handleModeChange = (newMode: ThemeMode) => {
    if (newMode === currentMode) return;
    const targetTheme = newMode === 'diurno' 
      ? (settings.dayTheme || THEME_PAIRS[settings.theme] || 'pergaminho')
      : (settings.nightTheme || THEME_PAIRS[settings.theme] || 'grimorio');

    onUpdateSettings({
      ...settings,
      mode: newMode,
      theme: targetTheme,
      ...(newMode === 'diurno' ? { dayTheme: targetTheme } : { nightTheme: targetTheme }),
    });
  };

  const handleSelectTheme = (optId: AppTheme, optMode: ThemeMode) => {
    onUpdateSettings({
      ...settings,
      theme: optId,
      mode: optMode,
      ...(optMode === 'diurno' ? { dayTheme: optId } : { nightTheme: optId }),
    });
  };

  // Filter options by current active mode
  const currentThemes = THEME_OPTIONS.filter((opt) => opt.mode === currentMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-stone-950 border border-amber-600/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl shadow-amber-950/40 relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-600/60 rounded-xl text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg font-bold text-amber-200">
                Aparência do Grimório
              </h2>
              <p className="text-xs text-stone-400 font-crimson">
                Modo diurno & noturno com proteção visual, paletas imersivas e tipografia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-6 py-4 overflow-y-auto pr-1">

          {/* Section 0: Mode Selection (Noturno vs Diurno) */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-cinzel text-amber-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Sincronização Automática
              </span>
              <span className="text-[11px] text-stone-400 font-crimson">
                Detecta tema claro/escuro do seu dispositivo
              </span>
            </div>

            <label className="font-cinzel text-xs font-bold text-amber-300 flex items-center justify-between tracking-wider pt-1">
              <span className="flex items-center gap-1.5 uppercase">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Iluminação Ativa
              </span>
              <span className="text-[10px] text-stone-400 font-crimson normal-case italic">
                {currentMode === 'diurno' ? 'Modo Diurno (Pergaminho Suave)' : 'Modo Noturno (Escuro Imersivo)'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Noturno */}
              <button
                type="button"
                onClick={() => handleModeChange('noturno')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 relative ${
                  currentMode === 'noturno'
                    ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500 shadow-md shadow-amber-950/60'
                    : 'border-stone-800 bg-stone-900/70 hover:border-stone-700 hover:bg-stone-900 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-amber-400 shrink-0 mt-0.5">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-cinzel text-xs font-bold text-stone-200">
                      Modo Noturno
                    </span>
                    {currentMode === 'noturno' && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 font-crimson mt-0.5 leading-snug">
                    Fundo escuro obsidiana, iluminação por velas e runas brilhantes.
                  </p>
                </div>
              </button>

              {/* Diurno */}
              <button
                type="button"
                onClick={() => handleModeChange('diurno')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 relative ${
                  currentMode === 'diurno'
                    ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500 shadow-md shadow-amber-950/60'
                    : 'border-stone-800 bg-stone-900/70 hover:border-stone-700 hover:bg-stone-900 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-900/40 border border-amber-600/50 text-amber-300 shrink-0 mt-0.5">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-cinzel text-xs font-bold text-amber-200">
                      Modo Diurno
                    </span>
                    {currentMode === 'diurno' && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 font-crimson mt-0.5 leading-snug">
                    Tons de pergaminho antigo e papiro. Sem branco ofuscante!
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 1: Themes / Palettes of the selected mode */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-cinzel text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Paletas Temáticas ({currentMode === 'diurno' ? 'Diurnas' : 'Noturnas'})
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentThemes.map((opt) => {
                const isSelected = settings.theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectTheme(opt.id, opt.mode)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500 shadow-md shadow-amber-950/50'
                        : 'border-stone-800 bg-stone-900/70 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {/* Rich Mini Swatch with 3 color layers */}
                          <div 
                            className="w-5 h-5 rounded-md border flex items-center justify-center overflow-hidden shadow-inner shrink-0"
                            style={{ backgroundColor: opt.bgHex, borderColor: opt.borderHex }}
                            title={`Fundo: ${opt.bgHex}, Borda: ${opt.borderHex}`}
                          >
                            <span 
                              className="text-[10px] font-bold font-mono" 
                              style={{ color: opt.textHex }}
                            >
                              Aa
                            </span>
                          </div>
                          <span className={`font-cinzel text-xs font-bold ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                            {opt.name}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-amber-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] uppercase font-mono tracking-wider text-amber-500/80 mb-1">
                        {opt.badge}
                      </div>

                      <p className="text-[11px] text-stone-400 font-crimson leading-tight">
                        {opt.description}
                      </p>
                    </div>

                    {/* Color chip preview bar */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-800/60 text-[10px] text-stone-500 font-mono">
                      <span>Amostra:</span>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: opt.bgHex }} />
                        <span className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: opt.borderHex }} />
                        <span className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: opt.textHex }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Typography Selection */}
          <div className="space-y-2.5">
            <label className="font-cinzel text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              Estilo de Tipografia
            </label>
            <div className="grid grid-cols-1 gap-2">
              {FONT_OPTIONS.map((opt) => {
                const isSelected = settings.fontFamily === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onUpdateSettings({ ...settings, fontFamily: opt.id })}
                    className={`p-2.5 px-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                        : 'border-stone-800 bg-stone-900/70 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                  >
                    <div>
                      <div className="font-cinzel text-xs font-bold text-stone-200">
                        {opt.name}
                      </div>
                      <div className="text-[11px] text-stone-400 font-crimson">
                        {opt.description}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-amber-400 shrink-0 ml-2">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Text Scale / Reading Distance */}
          <div className="space-y-2.5">
            <label className="font-cinzel text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <span>📏</span>
              Escala de Leitura (Distância da Mesa)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FONT_SIZE_OPTIONS.map((opt) => {
                const isSelected = settings.fontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onUpdateSettings({ ...settings, fontSize: opt.id })}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/50 ring-1 ring-amber-500 text-amber-200 font-bold'
                        : 'border-stone-800 bg-stone-900/70 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                    }`}
                  >
                    <div className="text-xs font-cinzel">{opt.name}</div>
                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">{opt.scale}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-400 font-crimson">
            Ativo: <strong className="text-amber-300 font-cinzel">{THEME_OPTIONS.find(t => t.id === settings.theme)?.name}</strong> ({settings.mode === 'diurno' ? 'Modo Diurno' : 'Modo Noturno'})
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-cinzel font-bold text-xs rounded-xl shadow-md shadow-amber-900/30 transition-all"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
