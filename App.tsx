import React, { useState, useEffect } from 'react';
import Bestiary from './components/Bestiary';
import MonsterCreator from './components/MonsterCreator';
import { Monster, DiceRollResult } from './types';
import { SwadeRulesModal } from './components/SwadeRulesModal';
import { DiceRollerModal } from './components/DiceRollerModal';
import { ThemeModal } from './components/ThemeModal';
import { rollTrait } from './services/diceService';
import { 
  getThemeSettings, 
  saveThemeSettings, 
  applyThemeToDOM, 
  subscribeToSystemTheme,
  ThemeSettings 
} from './services/themeService';
import { BookOpen, Plus, Dices, HelpCircle, Flame, Shield, Sparkles, Palette, Maximize, Minimize, Eye, EyeOff } from 'lucide-react';

export type View = 'bestiary' | 'creator';

const App: React.FC = () => {
  const [view, setView] = useState<View>('bestiary');
  const [monsterToEdit, setMonsterToEdit] = useState<Monster | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(getThemeSettings);
  const [activeHeaderRoll, setActiveHeaderRoll] = useState<DiceRollResult | null>(null);
  const [quickWildCard, setQuickWildCard] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerViewMode, setPlayerViewMode] = useState(false);

  // Monitor fullscreen change events (e.g. user pressed Esc or F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Erro ao alternar modo tela cheia:', err);
    }
  };

  // Apply saved theme on initial mount, track online/offline status, and sync with device light/dark mode
  useEffect(() => {
    applyThemeToDOM(themeSettings);

    // Auto-detect & synchronize in real-time with device/OS day (light) or night (dark) theme
    const unsubscribeTheme = subscribeToSystemTheme((systemMode) => {
      setThemeSettings((prev) => {
        const activeTheme = systemMode === 'diurno' ? prev.dayTheme : prev.nightTheme;
        const updated: ThemeSettings = {
          ...prev,
          mode: systemMode,
          theme: activeTheme,
        };
        saveThemeSettings(updated);
        applyThemeToDOM(updated);
        return updated;
      });
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      unsubscribeTheme();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdateThemeSettings = (newSettings: ThemeSettings) => {
    setThemeSettings(newSettings);
    saveThemeSettings(newSettings);
  };

  const handleEditMonster = (monster: Monster) => {
    setMonsterToEdit(monster);
    setView('creator');
  };

  const handleCreatorClose = () => {
    setMonsterToEdit(null);
    setView('bestiary');
  };

  // Quick dice rolling from header
  const handleQuickDieRoll = (sides: number) => {
    const result = rollTrait(
      `Rolagem Rápida d${sides}`,
      `d${sides}`,
      quickWildCard,
      4
    );
    setActiveHeaderRoll(result);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col selection:bg-amber-800 selection:text-white">
      
      {/* Ornate Top Header */}
      <header className="bg-stone-950/90 border-b border-amber-900/40 backdrop-blur-md sticky top-0 z-40 no-print shadow-xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('bestiary')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-800 to-amber-950 p-0.5 shadow-lg shadow-amber-900/30 flex items-center justify-center border border-amber-500/40">
              <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-amber-200 tracking-wide flex items-center gap-2">
                Bestiário de Lendas
                <span className="text-[10px] bg-amber-950/90 text-amber-400 border border-amber-700/60 px-2 py-0.5 rounded font-mono font-bold tracking-normal hidden sm:inline">
                  SWADE
                </span>
                {!isOnline && (
                  <span className="text-[10px] bg-amber-900/90 text-amber-300 border border-amber-600 px-2 py-0.5 rounded-full font-mono font-bold tracking-normal flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    OFFLINE
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-stone-400 font-crimson italic hidden sm:block">
                Compêndio Savage Worlds • "Rápido! Furioso! Divertido!"
              </p>
            </div>
          </div>

          {/* Quick Dice Roller Toolbar in Header */}
          <div className="hidden lg:flex items-center gap-1.5 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-stone-800 text-xs">
            <span className="text-[11px] text-stone-400 font-cinzel mr-1 flex items-center gap-1">
              <Dices className="w-3.5 h-3.5 text-amber-500" />
              Rolador Rápido:
            </span>
            {[4, 6, 8, 10, 12].map((sides) => (
              <button
                key={sides}
                onClick={() => handleQuickDieRoll(sides)}
                className="px-2 py-0.5 rounded bg-stone-950 hover:bg-amber-950/70 border border-stone-800 hover:border-amber-600 text-stone-200 font-mono-dice transition-colors font-bold text-xs"
                title={`Rolar d${sides} com Ases${quickWildCard ? ' (+ Dado Selvagem d6)' : ''}`}
              >
                d{sides}
              </button>
            ))}
            <label className="flex items-center gap-1 ml-2 text-[11px] text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={quickWildCard}
                onChange={(e) => setQuickWildCard(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-stone-700 text-amber-600 cursor-pointer"
              />
              <span className="font-cinzel">Dado Selvagem</span>
            </label>
          </div>

          {/* Navigation & Help */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Player View / Fog of War Toggle */}
            <button
              onClick={() => setPlayerViewMode(!playerViewMode)}
              className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 shadow-sm ${
                playerViewMode
                  ? 'bg-blue-950/80 border-blue-500/80 text-blue-300 font-bold'
                  : 'bg-stone-900/90 border-stone-800 hover:border-amber-600/70 text-stone-300 hover:text-amber-300'
              }`}
              title={playerViewMode ? 'Modo Jogador Ativo (Segredos e Lore do Mestre Ocultos)' : 'Alternar Modo Jogador / Névoa de Guerra'}
            >
              {playerViewMode ? <EyeOff className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline font-cinzel">
                {playerViewMode ? 'Modo Jogador' : 'Visão Mestre'}
              </span>
            </button>
            <button
              onClick={() => setShowThemeModal(true)}
              className="p-2 text-stone-300 hover:text-amber-300 bg-stone-900/90 border border-stone-800 hover:border-amber-600/70 rounded-lg transition-all text-xs flex items-center gap-1.5 shadow-sm"
              title="Mudar Tema, Cores e Fontes do Grimório"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-cinzel font-bold">Tema</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 shadow-sm ${
                isFullscreen
                  ? 'bg-amber-950/70 border-amber-500/80 text-amber-300'
                  : 'bg-stone-900/90 border-stone-800 hover:border-amber-600/70 text-stone-300 hover:text-amber-300'
              }`}
              title={isFullscreen ? 'Sair da Tela Cheia (Esc ou clique)' : 'Modo Tela Cheia (Focar no Compêndio)'}
              aria-label={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline font-cinzel font-bold">Normal</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline font-cinzel font-bold">Tela Cheia</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowRulesModal(true)}
              className="p-2 text-stone-400 hover:text-amber-400 bg-stone-900 border border-stone-800 rounded-lg hover:border-amber-700 transition-colors text-xs flex items-center gap-1"
              title="Guia Rápido de Regras SWADE"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline font-cinzel">Regras SWADE</span>
            </button>

            <button
              onClick={() => {
                setMonsterToEdit(null);
                setView('bestiary');
              }}
              className={`px-3.5 py-2 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center gap-2 ${
                view === 'bestiary'
                  ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Compêndio</span>
            </button>

            <button
              onClick={() => {
                setMonsterToEdit(null);
                setView('creator');
              }}
              className={`px-3.5 py-2 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center gap-2 ${
                view === 'creator'
                  ? 'bg-red-700 text-white shadow-md shadow-red-700/30'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Criar Monstro</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow w-full">
        {view === 'bestiary' ? (
          <Bestiary
            onEditMonster={handleEditMonster}
            showCreator={() => setView('creator')}
            isPlayerView={playerViewMode}
          />
        ) : (
          <MonsterCreator
            monsterToEdit={monsterToEdit}
            onSaveSuccess={handleCreatorClose}
            onCancel={() => setView('bestiary')}
          />
        )}
      </main>

      {/* Thematic Footer */}
      <footer className="bg-stone-950 border-t border-stone-900 py-6 text-center text-xs text-stone-500 font-crimson no-print space-y-1">
        <p className="font-cinzel text-stone-400">
          Bestiário de Lendas • Savage Worlds Edição Aventura (SWADE)
        </p>
        <p className="italic">
          Folclore brasileiro, mitos sombrios e criaturas de terror com mecânicas de combate oficiais.
        </p>
      </footer>

      {/* Theme Customizer Modal */}
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        settings={themeSettings}
        onUpdateSettings={handleUpdateThemeSettings}
      />

      {/* Quick SWADE Rules Reference Modal */}
      <SwadeRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Header Dice Roller Modal */}
      <DiceRollerModal
        rollResult={activeHeaderRoll}
        onClose={() => setActiveHeaderRoll(null)}
        onReroll={(newRoll) => setActiveHeaderRoll(newRoll)}
      />

    </div>
  );
};

export default App;
