import { useKeyboardViewport } from './hooks/useKeyboardViewport';
import { useDialogAccessibility } from './hooks/useDialogAccessibility';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { BackNavigationScope, useBackNavigation } from './hooks/useBackNavigation';
import { backNavigation, subscribeToAndroidBack } from './services/backNavigation';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
import { Dices, HelpCircle, Flame, Shield, Sparkles, Palette, Maximize, Minimize, Eye, EyeOff, Menu, X } from 'lucide-react';

export type View = 'bestiary' | 'creator';

const App: React.FC = () => {
  useKeyboardViewport();
  const [view, setView] = useState<View>('bestiary');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const viewScroll = useRef(0);
  const previousView = useRef<View>('bestiary');
  useBackNavigation(showHeaderMenu, () => setShowHeaderMenu(false));
  useLayoutEffect(() => {
    if (previousView.current !== view) {
      if (view === 'creator') { viewScroll.current = window.scrollY; window.scrollTo({ top: 0, behavior: 'instant' }); }
      else window.scrollTo({ top: viewScroll.current, behavior: 'instant' });
      previousView.current = view;
    }
  }, [view]);
  useEffect(() => {
    const handleNotice = (event: Event) => setNotice(String((event as CustomEvent).detail));
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && backNavigation.goBack(100)) event.preventDefault();
    };
    window.addEventListener('swade:notice', handleNotice);
    window.addEventListener('keydown', handleEscape);
    const header = document.querySelector('header');
    const observer = new ResizeObserver(() => document.documentElement.style.setProperty('--app-header-height', `${header?.getBoundingClientRect().height || 72}px`));
    if (header) observer.observe(header);
    return () => { window.removeEventListener('swade:notice', handleNotice); window.removeEventListener('keydown', handleEscape); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (!showHeaderMenu) return;
    const outside = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest('#header-tools, [aria-controls="header-tools"]')) setShowHeaderMenu(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [showHeaderMenu]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const exitDialogRef = useDialogAccessibility(showExitConfirmation);
  const [exitError, setExitError] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const exitPending = useRef(false);
  const isAndroidApp = Capacitor.getPlatform() === 'android';

  useBackNavigation(isAndroidApp, () => {
    setExitError('');
    setShowExitConfirmation(true);
  }, -1000);
  useBackNavigation(showExitConfirmation, () => setShowExitConfirmation(false), 200);

  useEffect(() => {
    if (!isAndroidApp) return;
    return subscribeToAndroidBack(CapacitorApp, () => backNavigation.goBack());
  }, [isAndroidApp]);

  const confirmExit = async () => {
    if (exitPending.current) return;
    exitPending.current = true;
    setIsExiting(true);
    try {
      await CapacitorApp.exitApp();
    } catch {
      setExitError('Não foi possível fechar o aplicativo. Tente novamente.');
    } finally {
      exitPending.current = false;
      setIsExiting(false);
    }
  };

  const [monsterToEdit, setMonsterToEdit] = useState<Monster | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(getThemeSettings);
  const [activeHeaderRoll, setActiveHeaderRoll] = useState<DiceRollResult | null>(null);
  const [quickWildCard, setQuickWildCard] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerViewMode, setPlayerViewMode] = useState(false);
  const isNativeApp =
    typeof window !== 'undefined' &&
    Boolean((window as any).Capacitor?.isNativePlatform?.());

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
        if (prev.followSystem === false) return prev;
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

  useBackNavigation(view === 'creator', handleCreatorClose, 10);

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
    <div className="app-shell min-h-[100dvh] bg-stone-950 text-stone-200 flex flex-col selection:bg-amber-800 selection:text-white w-full max-w-full overflow-x-hidden overflow-y-auto">
      
      {/* Ornate Top Header */}
      <header className="app-header bg-stone-950/95 border-b border-amber-900/40 backdrop-blur-md sticky top-0 z-40 no-print shadow-xl shadow-black/40 w-full max-w-full overflow-x-hidden pt-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-nowrap justify-between items-center gap-2 sm:gap-4">
          
          {/* Logo / Branding */}
          <button
            type="button"
            onClick={() => setView('bestiary')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-[48px] min-h-[48px] px-1 py-1 -ml-1 rounded-xl text-left overflow-hidden hover:bg-stone-900/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Voltar para o início do Bestiário de Lendas"
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-600 via-amber-800 to-amber-950 p-0.5 shadow-lg shadow-amber-900/30 flex items-center justify-center border border-amber-500/40">
              <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="font-cinzel text-base sm:text-2xl font-black text-amber-200 tracking-wide flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">Bestiário de Lendas</span>
                <span className="text-[10px] bg-amber-950/90 text-amber-400 border border-amber-700/60 px-2 py-0.5 rounded font-mono font-bold tracking-normal hidden sm:inline shrink-0">
                  SWADE
                </span>
                {!isOnline && (
                  <span className="text-[10px] bg-amber-900/90 text-amber-300 border border-amber-600 px-1.5 py-0.5 rounded-full font-mono font-bold tracking-normal flex items-center gap-1 shadow-sm shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="hidden xs:inline">OFFLINE</span>
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-stone-400 font-crimson italic hidden sm:block">
                Compêndio Savage Worlds • "Rápido! Furioso! Divertido!"
              </p>
            </div>
          </button>

          {/* Quick Dice Roller Toolbar in Header */}
          <div className="hidden 2xl:flex items-center gap-1.5 bg-stone-900/80 px-2.5 py-1 rounded-xl border border-stone-800 text-xs shrink-0">
            <span className="text-[11px] text-stone-400 font-cinzel mr-1 hidden 2xl:flex items-center gap-1">
              <Dices className="w-3.5 h-3.5 text-amber-500" />
              Rolador Rápido:
            </span>
            {[4, 6, 8, 10, 12].map((sides) => (
              <button
                key={sides}
                type="button"
                onClick={() => handleQuickDieRoll(sides)}
                className="min-w-[48px] min-h-[48px] px-2 py-1 rounded-lg bg-stone-950 hover:bg-amber-950/70 border border-stone-800 hover:border-amber-600 text-stone-200 font-mono-dice transition-colors font-bold text-xs flex items-center justify-center"
                title={`Rolar d${sides} com Ases${quickWildCard ? ' (+ Dado Selvagem d6)' : ''}`}
              >
                d{sides}
              </button>
            ))}
            <label className="min-w-[48px] min-h-[48px] px-2 flex items-center gap-1.5 ml-1 text-[11px] text-stone-400 hover:text-stone-200 cursor-pointer rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={quickWildCard}
                onChange={(e) => setQuickWildCard(e.target.checked)}
                className="w-4 h-4 rounded border-stone-700 text-amber-600 cursor-pointer shrink-0"
              />
              <span className="font-cinzel whitespace-nowrap">Dado Selvagem</span>
            </label>
          </div>

          <button type="button" className="sm:hidden min-h-12 min-w-12 rounded-lg border border-stone-700 flex items-center justify-center gap-1 px-2" aria-label="Menu de ferramentas" aria-expanded={showHeaderMenu} aria-controls="header-tools" onClick={() => setShowHeaderMenu(value => !value)}>
            {showHeaderMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-xs">Menu</span>
          </button>
          {/* Navigation & Help */}
          <div id="header-tools" className={`header-tools ${showHeaderMenu ? 'is-open' : ''} flex items-center gap-1.5 sm:gap-2 shrink-0`}>
            <div className="sm:hidden w-full border-b border-stone-700 pb-2 mb-1">
              <label className="flex items-center gap-2 text-sm text-stone-400 mb-2 min-h-11"><input type="checkbox" checked={quickWildCard} onChange={event => setQuickWildCard(event.target.checked)} className="w-5 h-5" />Dado selvagem na rolagem rápida</label>
              <div className="grid grid-cols-5 gap-1">{[4, 6, 8, 10, 12].map(sides => <button key={sides} type="button" className="min-h-11 rounded-lg border border-stone-700 font-mono-dice" onClick={() => { setShowHeaderMenu(false); handleQuickDieRoll(sides); }}>d{sides}</button>)}</div>
            </div>
            {/* Player View / Fog of War Toggle */}
            <button
              type="button"
              onClick={() => { setShowHeaderMenu(false); setPlayerViewMode(!playerViewMode); }}
              className={`min-h-[48px] min-w-[48px] px-3 py-2 rounded-lg border transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap ${
                playerViewMode
                  ? 'bg-blue-950/80 border-blue-500/80 text-blue-300 font-bold'
                  : 'bg-stone-900/90 border-stone-800 hover:border-amber-600/70 text-stone-300 hover:text-amber-300'
              }`}
              title={playerViewMode ? 'Modo Jogador Ativo (Segredos e Lore do Mestre Ocultos)' : 'Alternar Modo Jogador / Névoa de Guerra'}
              aria-label={playerViewMode ? 'Desativar Modo Jogador' : 'Ativar Modo Jogador'}
            >
              {playerViewMode ? <EyeOff className="w-4 h-4 text-blue-400 shrink-0" /> : <Eye className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="hidden sm:inline font-cinzel">
                {playerViewMode ? 'Modo Jogador' : 'Visão Mestre'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setShowHeaderMenu(false); setShowThemeModal(true); }}
              className="min-h-[48px] min-w-[48px] px-3 py-2 text-stone-300 hover:text-amber-300 bg-stone-900/90 border border-stone-800 hover:border-amber-600/70 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
              title="Mudar Tema, Cores e Fontes do Grimório"
              aria-label="Mudar Tema, Cores e Fontes do Grimório"
            >
              <Palette className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline font-cinzel font-bold">Tema</span>
            </button>

            {!isNativeApp && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`min-h-[48px] min-w-[48px] px-3 py-2 rounded-lg border transition-all text-xs hidden sm:flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap ${
                  isFullscreen
                    ? 'bg-amber-950/70 border-amber-500/80 text-amber-300'
                    : 'bg-stone-900/90 border-stone-800 hover:border-amber-600/70 text-stone-300 hover:text-amber-300'
                }`}
                title={isFullscreen ? 'Sair da Tela Cheia (Esc ou clique)' : 'Modo Tela Cheia (Focar no Compêndio)'}
                aria-label={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="hidden md:inline font-cinzel font-bold">Normal</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="hidden md:inline font-cinzel font-bold">Tela Cheia</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => { setShowHeaderMenu(false); setShowRulesModal(true); }}
              className="min-h-[48px] min-w-[48px] px-3 py-2 text-stone-400 hover:text-amber-400 bg-stone-900 border border-stone-800 rounded-lg hover:border-amber-700 transition-colors text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Guia Rápido de Regras SWADE"
              aria-label="Guia Rápido de Regras SWADE"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline font-cinzel">Regras SWADE</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-content max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 flex-grow w-full max-w-full overflow-x-hidden">
        <div hidden={view !== 'bestiary'}>
          <BackNavigationScope value={view === 'bestiary'}>
            <Bestiary
              onEditMonster={handleEditMonster}
              showCreator={() => setView('creator')}
              isPlayerView={playerViewMode}
            />
          </BackNavigationScope>
        </div>
        {view === 'creator' && (
          <MonsterCreator
            monsterToEdit={monsterToEdit}
            onSaveSuccess={handleCreatorClose}
            onCancel={handleCreatorClose}
          />
        )}
      </main>

      {/* Thematic Footer */}
      <footer className="bg-stone-950 border-t border-stone-900 py-5 sm:py-6 px-4 text-center text-xs text-stone-500 font-crimson no-print space-y-1 pb-safe">
        <p className="font-cinzel text-stone-400">
          Bestiário de Lendas • Savage Worlds Edição Aventura (SWADE)
        </p>
        <p className="italic">
          Folclore brasileiro, mitos sombrios e criaturas de terror com mecânicas de combate oficiais.
        </p>
      </footer>

      {showExitConfirmation && (
        <div ref={exitDialogRef} className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="exit-title" aria-describedby="exit-description"
            className="w-full max-w-sm rounded-xl border border-amber-800 bg-stone-950 p-6 shadow-2xl">
            <h2 id="exit-title" className="font-cinzel text-xl text-amber-200">Fechar o aplicativo?</h2>
            <p id="exit-description" className="mt-3 text-stone-300">Deseja sair do Bestiário de Lendas?</p>
            {exitError && <p role="alert" className="mt-3 text-red-300">{exitError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" autoFocus disabled={isExiting} onClick={() => setShowExitConfirmation(false)}
                className="min-h-[48px] rounded-lg border border-stone-700 px-4">Cancelar</button>
              <button type="button" disabled={isExiting} onClick={confirmExit}
                className="min-h-[48px] rounded-lg bg-amber-600 px-4 font-bold text-stone-950">Fechar app</button>
            </div>
          </section>
        </div>
      )}

      {notice && <div role="status" aria-live="polite" className="app-notice fixed bottom-5 left-3 right-3 sm:left-auto sm:max-w-md z-[150] rounded-xl border border-stone-600 bg-stone-900 text-stone-100 p-4 shadow-xl flex items-center gap-3"><span className="text-sm flex-1">{notice}</span><button type="button" aria-label="Fechar mensagem" className="min-w-11 min-h-11" onClick={() => setNotice('')}><X className="w-4 h-4" /></button></div>}
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
