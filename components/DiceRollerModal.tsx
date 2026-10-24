import React, { useState, useEffect } from 'react';
import { DiceRollResult } from '../types';
import { 
  Dices, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  X, 
  ShieldAlert, 
  Zap, 
  History, 
  Trash2, 
  Clock, 
  ArrowLeft 
} from 'lucide-react';
import { 
  rollTrait, 
  getDiceSessionHistory, 
  saveDiceRollToSessionHistory, 
  clearDiceSessionHistory 
} from '../services/diceService';

interface DiceRollerModalProps {
  rollResult: DiceRollResult | null;
  onClose: () => void;
  onReroll: (newResult: DiceRollResult) => void;
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({
  rollResult,
  onClose,
  onReroll,
}) => {
  const [animating, setAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [history, setHistory] = useState<DiceRollResult[]>(() => getDiceSessionHistory());
  const [selectedHistoryRoll, setSelectedHistoryRoll] = useState<DiceRollResult | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Trigger vibration shake, subtle glow, and haptic feedback on new roll or reroll
  useEffect(() => {
    if (rollResult) {
      const updatedHistory = saveDiceRollToSessionHistory(rollResult);
      setHistory(updatedHistory);
      setSelectedHistoryRoll(null); // Reset to active roll when a new roll occurs

      setAnimating(true);
      setAnimationKey((prev) => prev + 1);

      // Mobile haptic vibration if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          if (rollResult.isCriticalFailure) {
            navigator.vibrate([60, 40, 60, 40, 90]);
          } else if (rollResult.raises > 0) {
            navigator.vibrate([40, 30, 80]);
          } else {
            navigator.vibrate([35, 25, 35]);
          }
        } catch {}
      }

      const timer = setTimeout(() => {
        setAnimating(false);
      }, 850);

      return () => clearTimeout(timer);
    }
  }, [rollResult]);

  // Handle ESC key for confirmation dialog or modal closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showClearConfirm) {
          setShowClearConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showClearConfirm, onClose]);

  if (!rollResult) return null;

  // Currently inspected roll (either user selected past roll from history or current roll)
  const currentView = selectedHistoryRoll || rollResult;
  const isViewingPastRoll = selectedHistoryRoll !== null;

  const handleSpendBennie = () => {
    // Reroll using a Savage Worlds Bennie (Benesse do Mestre/Jogador)
    const newRoll = rollTrait(
      currentView.title,
      currentView.formula.split(' ')[0],
      currentView.isWildCard,
      currentView.targetNumber
    );
    setSelectedHistoryRoll(null);
    onReroll(newRoll);
  };

  const handleConfirmClearHistory = () => {
    clearDiceSessionHistory();
    setHistory([]);
    setSelectedHistoryRoll(null);
    setShowClearConfirm(false);
  };

  // Determine glow style based on outcome
  const getGlowClass = () => {
    if (!animating) return 'shadow-md';
    if (currentView.isCriticalFailure) return 'animate-dice-glow-crimson border-red-500/80';
    if (currentView.raises > 0) return 'animate-dice-glow-emerald border-emerald-500/80';
    return 'animate-dice-glow-theme';
  };

  const formatRollTime = (timestamp: Date | string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'var(--modal-backdrop)' }}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col p-5 sm:p-6 relative overflow-hidden border transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-accent)',
          color: 'var(--text-primary)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 20px color-mix(in srgb, var(--border-accent) 25%, transparent)'
        }}
      >
        
        {/* Ornate corner flourishes styled with theme border accent */}
        <div 
          className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg pointer-events-none opacity-80" 
          style={{ borderColor: 'var(--border-accent)' }}
        />
        <div 
          className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg pointer-events-none opacity-80" 
          style={{ borderColor: 'var(--border-accent)' }}
        />
        <div 
          className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg pointer-events-none opacity-80" 
          style={{ borderColor: 'var(--border-accent)' }}
        />
        <div 
          className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-lg pointer-events-none opacity-80" 
          style={{ borderColor: 'var(--border-accent)' }}
        />

        {/* Modal Header */}
        <div 
          className="flex items-center justify-between pb-3 border-b shrink-0 mb-3"
          style={{ borderColor: 'var(--border-base)' }}
        >
          <div className="flex items-center gap-2">
            <div 
              className={`p-2 rounded-lg border transition-transform ${animating ? 'rotate-12 scale-110' : ''}`}
              style={{
                backgroundColor: 'var(--badge-bg)',
                color: 'var(--accent-highlight)',
                borderColor: 'var(--border-accent)'
              }}
            >
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 
                className="font-cinzel text-lg font-bold tracking-wide flex items-center gap-1.5"
                style={{ color: 'var(--accent-title)' }}
              >
                {currentView.title}
                {currentView.raises > 0 && (
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                )}
              </h3>
              <p className="text-xs font-mono-dice" style={{ color: 'var(--text-muted)' }}>
                Fórmula: <span className="font-bold" style={{ color: 'var(--accent-highlight)' }}>{currentView.formula}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors hover:opacity-100 opacity-70"
            style={{ 
              color: 'var(--text-muted)',
              backgroundColor: 'transparent'
            }}
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Past Roll Inspection Notification Banner */}
        {isViewingPastRoll && (
          <div 
            className="shrink-0 mb-3 p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2"
            style={{
              backgroundColor: 'var(--badge-bg)',
              borderColor: 'var(--border-accent)',
              color: 'var(--badge-text)'
            }}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-highlight)' }} />
              <span>Inspecionando rolagem do histórico ({formatRollTime(currentView.timestamp)})</span>
            </div>
            <button
              onClick={() => setSelectedHistoryRoll(null)}
              className="text-[11px] font-cinzel font-bold px-2 py-1 rounded border flex items-center gap-1 transition-all"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <ArrowLeft className="w-3 h-3" style={{ color: 'var(--accent-highlight)' }} />
              Voltar à Atual
            </button>
          </div>
        )}

        {/* Scrollable Content: Big badge, breakdown and session history */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          
          {/* Big Result Badge with Vibration & Theme Glow */}
          <div 
            key={animationKey}
            className={`text-center py-4 px-6 rounded-xl border relative overflow-hidden transition-all duration-300 ${
              animating ? 'animate-dice-shake ' + getGlowClass() : 'shadow-md'
            }`}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-accent)',
              boxShadow: animating ? undefined : '0 4px 16px color-mix(in srgb, var(--border-accent) 18%, transparent)'
            }}
          >
            {/* Subtle light sheen sweep across the badge using active theme color */}
            {animating && (
              <div 
                className="absolute inset-0 pointer-events-none animate-dice-shine-sweep w-full h-full" 
                style={{
                  background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--accent-highlight) 30%, transparent), transparent)'
                }}
              />
            )}

            <div 
              className="text-xs uppercase tracking-widest font-cinzel mb-1 flex items-center justify-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Resultado Final</span>
              <span className="font-mono-dice font-bold" style={{ color: 'var(--accent-highlight)' }}>
                (Alvo {currentView.targetNumber})
              </span>
              {animating && (
                <Zap className="w-3 h-3 animate-bounce" style={{ color: 'var(--accent-highlight)' }} />
              )}
            </div>

            {/* Animated final number styled with active theme colors */}
            <div 
              className={`font-cinzel text-5xl font-black transition-all ${
                animating ? 'animate-dice-number-impact' : ''
              }`}
              style={{
                color: 'var(--accent-title)',
                filter: animating 
                  ? 'drop-shadow(0 0 16px var(--accent-highlight))' 
                  : 'drop-shadow(0 2px 8px color-mix(in srgb, var(--accent-highlight) 35%, transparent))'
              }}
            >
              {currentView.finalTotal}
            </div>

            {/* Outcome Status Banner */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
              {currentView.isCriticalFailure ? (
                <span className="bg-red-950/90 text-red-300 border border-red-700 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  FALHA CRÍTICA! (Olhos de Cobra)
                </span>
              ) : currentView.isSuccess ? (
                <span 
                  className="px-3 py-1 rounded-full flex items-center gap-1.5 border font-cinzel font-bold shadow-xs"
                  style={{
                    backgroundColor: 'var(--badge-bg)',
                    borderColor: 'var(--border-accent)',
                    color: 'var(--badge-text)',
                  }}
                >
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-highlight)' }} />
                  SUCESSO {currentView.raises > 0 && `com ${currentView.raises} Ampliação${currentView.raises > 1 ? 'ões' : ''}! (+${currentView.raises * 4})`}
                </span>
              ) : (
                <span 
                  className="px-3 py-1 rounded-full flex items-center gap-1.5 border"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <ShieldAlert className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                  FALHA (Abaixo do Alvo {currentView.targetNumber})
                </span>
              )}
            </div>
          </div>

          {/* Dice Breakdown Details */}
          <div 
            className="space-y-3 p-4 rounded-xl border text-sm"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-base)',
              color: 'var(--text-primary)',
            }}
          >
            {/* Trait Die Breakdown */}
            <div 
              className="flex items-center justify-between border-b pb-2"
              style={{ borderColor: 'var(--border-base)' }}
            >
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: 'var(--accent-highlight)' }}
                />
                Dado de Traço (d{currentView.traitDiceSides}):
              </span>
              <div className="font-mono-dice" style={{ color: 'var(--text-primary)' }}>
                {currentView.traitRolls.map((r, idx) => {
                  const isAce = r === currentView.traitDiceSides;
                  return (
                    <span key={idx}>
                      <span
                        className={
                          isAce
                            ? "px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5 animate-pulse border shadow-xs"
                            : ""
                        }
                        style={
                          isAce 
                            ? {
                                backgroundColor: 'var(--badge-bg)',
                                borderColor: 'var(--border-accent)',
                                color: 'var(--badge-text)',
                                boxShadow: '0 0 8px color-mix(in srgb, var(--accent-highlight) 30%, transparent)'
                              }
                            : { color: 'var(--text-primary)' }
                        }
                        title={isAce ? `Ás! Dado explodiu no valor máximo ${r}!` : undefined}
                      >
                        {r}
                        {isAce && <Sparkles className="w-2.5 h-2.5 inline" style={{ color: 'var(--accent-highlight)' }} />}
                      </span>
                      {idx < currentView.traitRolls.length - 1 ? " + " : ""}
                    </span>
                  );
                })}
                {currentView.traitRolls.length > 1 && (
                  <span className="font-semibold" style={{ color: 'var(--accent-highlight)' }}>
                    {" "} = {currentView.traitTotal}
                  </span>
                )}
              </div>
            </div>

            {/* Wild Die Breakdown if applicable */}
            {currentView.isWildCard && currentView.wildRolls && (
              <div 
                className="flex items-center justify-between border-b pb-2"
                style={{ borderColor: 'var(--border-base)' }}
              >
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Dado Selvagem (d6):
                </span>
                <div className="font-mono-dice" style={{ color: 'var(--text-primary)' }}>
                  {currentView.wildRolls.map((r, idx) => {
                    const isAce = r === 6;
                    return (
                      <span key={idx}>
                        <span
                          className={
                            isAce
                              ? "px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/80 text-red-300 font-bold shadow-sm shadow-red-500/30 inline-flex items-center gap-0.5 animate-pulse"
                              : ""
                          }
                          style={!isAce ? { color: 'var(--text-primary)' } : undefined}
                          title={isAce ? "Ás no Dado Selvagem! Rolagem máxima 6!" : undefined}
                        >
                          {r}
                          {isAce && <Sparkles className="w-2.5 h-2.5 text-red-400 inline" />}
                        </span>
                        {idx < (currentView.wildRolls?.length || 0) - 1 ? " + " : ""}
                      </span>
                    );
                  })}
                  {(currentView.wildRolls?.length || 0) > 1 && (
                    <span className="text-red-400 font-semibold"> = {currentView.wildTotal}</span>
                  )}
                </div>
              </div>
            )}

            {/* Modifiers */}
            {currentView.modifier !== 0 && (
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Modificador:</span>
                <span className="font-mono-dice font-bold" style={{ color: 'var(--accent-highlight)' }}>
                  {currentView.modifier > 0 ? `+${currentView.modifier}` : currentView.modifier}
                </span>
              </div>
            )}

            {/* Explanation note for Savage Worlds */}
            <div className="text-[11px] italic pt-1 text-center" style={{ color: 'var(--text-dim)' }}>
              {currentView.isWildCard
                ? "Regra de Carta Selvagem: Considera-se o maior valor entre o Dado de Traço e o Dado Selvagem."
                : "Regra Extra: Rola apenas o dado da característica (sem Dado Selvagem)."}
            </div>
          </div>

          {/* Session History Section: Stores and shows the last 5 rolls */}
          <div 
            className="rounded-xl border p-3 sm:p-4 space-y-2.5"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-base)',
            }}
          >
            <div 
              className="flex items-center justify-between border-b pb-2"
              style={{ borderColor: 'var(--border-base)' }}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" style={{ color: 'var(--accent-highlight)' }} />
                <span 
                  className="font-cinzel text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent-title)' }}
                >
                  Histórico da Sessão
                </span>
                <span 
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Últimas {history.length}/5
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[11px] flex items-center gap-1.5 transition-colors px-2 py-1 rounded border shadow-xs hover:border-red-600 hover:text-red-400"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                  title="Limpar histórico da sessão atual"
                >
                  <Trash2 className="w-3 h-3 opacity-75" />
                  <span>Limpar Histórico</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-4 text-center text-xs font-crimson italic" style={{ color: 'var(--text-dim)' }}>
                Nenhuma rolagem anterior gravada nesta sessão.
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map((item, index) => {
                  const isCurrentItem = 
                    (selectedHistoryRoll && selectedHistoryRoll.timestamp === item.timestamp && selectedHistoryRoll.finalTotal === item.finalTotal) ||
                    (!selectedHistoryRoll && rollResult.timestamp === item.timestamp && rollResult.finalTotal === item.finalTotal);

                  return (
                    <div
                      key={`${item.title}-${new Date(item.timestamp).getTime()}-${index}`}
                      onClick={() => setSelectedHistoryRoll(item)}
                      className="p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-2"
                      style={
                        isCurrentItem
                          ? {
                              backgroundColor: 'var(--badge-bg)',
                              borderColor: 'var(--border-accent)',
                              color: 'var(--badge-text)',
                              boxShadow: '0 0 10px color-mix(in srgb, var(--accent-highlight) 25%, transparent)',
                            }
                          : {
                              backgroundColor: 'var(--bg-subtle)',
                              borderColor: 'var(--border-base)',
                              color: 'var(--text-secondary)',
                            }
                      }
                      title="Clique para inspecionar os detalhes desta rolagem"
                    >
                      {/* Left info: order index, time, title, formula */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 text-center text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
                          #{index + 1}
                        </span>
                        <span className="text-[10px] font-mono flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Clock className="w-2.5 h-2.5 inline opacity-70" />
                          {formatRollTime(item.timestamp)}
                        </span>
                        <div 
                          className="truncate font-medium"
                          style={{ color: isCurrentItem ? 'var(--badge-text)' : 'var(--text-primary)' }}
                        >
                          {item.title}
                          <span className="ml-1.5 text-[10px] font-mono-dice font-bold" style={{ color: 'var(--accent-highlight)' }}>
                            ({item.formula.split(' ')[0]})
                          </span>
                        </div>
                      </div>

                      {/* Right info: Outcome badge & Final Total */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.isCriticalFailure ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold">
                            Crítica
                          </span>
                        ) : item.isSuccess ? (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 border"
                            style={{
                              backgroundColor: 'var(--badge-bg)',
                              borderColor: 'var(--border-accent)',
                              color: 'var(--badge-text)',
                            }}
                          >
                            Sucesso {item.raises > 0 && `+${item.raises} amp`}
                          </span>
                        ) : (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] border"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-dim)',
                            }}
                          >
                            Falha
                          </span>
                        )}

                        <div 
                          className="w-7 text-right font-cinzel font-black text-sm"
                          style={{ color: 'var(--accent-title)' }}
                        >
                          {item.finalTotal}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div 
          className="flex items-center gap-3 pt-3 border-t shrink-0 mt-3"
          style={{ borderColor: 'var(--border-base)' }}
        >
          <button
            onClick={handleSpendBennie}
            className="flex-1 flex items-center justify-center gap-2 font-cinzel font-bold py-2.5 px-4 rounded-lg shadow-md hover:brightness-110 active:scale-[0.98] transition-all text-sm border"
            style={{
              backgroundColor: 'var(--accent-highlight)',
              borderColor: 'var(--border-accent)',
              color: 'var(--bg-app)',
              boxShadow: '0 4px 14px color-mix(in srgb, var(--accent-highlight) 35%, transparent)'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${animating ? 'animate-spin' : ''}`} />
            Rolar Benesse (Gastar Bennie)
          </button>
          <button
            onClick={onClose}
            className="font-medium py-2.5 px-5 rounded-lg transition-colors text-sm border hover:brightness-110"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-base)',
              color: 'var(--text-primary)'
            }}
          >
            Fechar
          </button>
        </div>

        {/* Confirmation Dialog to Clear History */}
        {showClearConfirm && (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs p-4 animate-in fade-in duration-150"
            style={{ backgroundColor: 'var(--modal-backdrop)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowClearConfirm(false);
            }}
          >
            <div 
              className="border rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-accent)',
                color: 'var(--text-primary)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
              }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-red-950/80 text-red-400 border border-red-800/80 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 
                    className="font-cinzel text-base font-bold tracking-wide"
                    style={{ color: 'var(--accent-title)' }}
                  >
                    Limpar Histórico?
                  </h4>
                  <p 
                    className="text-xs mt-1.5 font-crimson leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Deseja realmente resetar e apagar a lista com as {history.length} {history.length === 1 ? 'rolagem gravada' : 'rolagens gravadas'} desta sessão?
                  </p>
                </div>
              </div>

              <div 
                className="flex items-center justify-end gap-2.5 pt-2 border-t"
                style={{ borderColor: 'var(--border-base)' }}
              >
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-cinzel border transition-colors hover:brightness-110"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearHistory}
                  className="px-3.5 py-2 rounded-lg text-xs font-cinzel font-bold text-white bg-red-700 hover:bg-red-600 transition-all flex items-center gap-1.5 shadow-md shadow-red-950/60 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Confirmar e Limpar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

