import { AttackRollModal } from './AttackRollModal';
import { getMonsterAttacks } from '../services/monsterAttacks';
import { classifyMonster, CREATURE_FAMILIES } from '../services/monsterTaxonomy';
import { ConfirmDialog } from './ConfirmDialog';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { notify, copyToClipboard } from '../services/notifications';
import { normalizeSearch } from '../services/catalogSearch';
import { useBackNavigation } from '../hooks/useBackNavigation';
import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import {
  getAllLocalMonsters,
  saveOrUpdateMonster,
  deleteMonsterFromStorage,
  duplicateMonster,
  getFavoriteMonsterIds,
  toggleFavoriteMonster,
  exportFullDatabaseAsJson,
  importFullDatabaseFromJson,
  resetDatabaseToDefaults
} from '../services/customMonsterService';
import { Monster, DiceRollResult, ParsedAttack } from '../types';
import { generatePdf, PdfTemplate, PdfTheme } from '../services/pdfService';
import { rollTrait } from '../services/diceService';
import { DiceRollerModal } from './DiceRollerModal';
import { EncounterBuilderModal } from './EncounterBuilderModal';
import { MonsterStatsModal } from './MonsterStatsModal';
import { LocalStorageManagerModal } from './LocalStorageManagerModal';
import {
  BookOpen,
  Plus,
  Eye,
  EyeOff,
  Printer,
  PieChart,
  Database,
  Wifi,
  WifiOff,
  HardDrive,
  X,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  ArrowRight,
  Skull,
  Shield,
  Footprints,
  Star,
  Download,
  Upload,
  Dices,
  Sparkles,
  Swords,
  Layers,
  Filter,
  Flame,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Share2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Table,
  FolderTree,
  AlignLeft,
  Mic,
  MicOff
} from 'lucide-react';

export const FALLBACK_MONSTER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231c1917'/%3E%3Cpath d='M200 60 L240 120 L310 130 L260 180 L270 250 L200 210 L130 250 L140 180 L90 130 L160 120 Z' fill='%23d97706' fill-opacity='0.25' stroke='%23d97706' stroke-width='3'/%3E%3Ccircle cx='200' cy='155' r='45' fill='%23292524' stroke='%23f59e0b' stroke-width='2'/%3E%3Cpath d='M185 150 Q200 130 215 150 Q200 185 185 150' fill='%23f59e0b'/%3E%3Ctext x='200' y='275' font-family='sans-serif' font-size='14' font-weight='bold' fill='%23a8a29e' text-anchor='middle'%3ESWADE BESTIARY%3C/text%3E%3C/svg%3E";

type DisplayMode = 'alphabetical' | 'cards' | 'table' | 'by-race';

// Helper to extract clean initial letter (ignoring accents)
export const getInitialLetter = (name: string): string => {
  if (!name || !name.trim()) return '#';
  const clean = name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const first = clean.charAt(0);
  return first >= 'A' && first <= 'Z' ? first : '#';
};

// Formats a complete monster statblock for Discord, Foundry or Roll20
const formatMonsterDiscordMarkdown = (m: Monster): string => {
  return [
    `**__${m.name.toUpperCase()}__** (${m.archetype} • ${m.race})`,
    `*${m.isWildCard ? '💀 Carta Selvagem' : 'Extra (Capanga)'} | Suplemento: ${m.sourcebook}*`,
    `**Atributos:** Agilidade ${m.attributes.agility} | Astúcia ${m.attributes.cunning} | Espírito ${m.attributes.spirit} | Força ${m.attributes.strength} | Vigor ${m.attributes.vigor}`,
    `**Perícias:** ${m.skills.join(', ')}`,
    `**Movimentação:** ${m.movement} | **Aparar:** ${m.parry} | **Resistência:** ${m.toughness} | **Tamanho:** ${m.size ?? 0}`,
    m.weapons ? `**Armas & Ataques:** ${m.weapons}` : '',
    m.powers ? `**Poderes Arcanos:** ${m.powers}` : '',
    m.abilities && m.abilities.length > 0 ? `**Habilidades Especiais:**\n${m.abilities.map(a => `• **${a.name}:** ${a.description}`).join('\n')}` : '',
    m.advantages ? `**Vantagens:** ${Array.isArray(m.advantages) ? m.advantages.join(', ') : m.advantages}` : '',
    m.complications ? `**Complicações:** ${Array.isArray(m.complications) ? m.complications.join(', ') : m.complications}` : '',
    m.history ? `\n> *${m.history}*` : '',
  ].filter(Boolean).join('\n');
};

// Die badge styling helper
const getDieBadgeClass = (dieStr: string) => {
  const tier = ['d12', 'd10', 'd8', 'd6'].find(die => dieStr.includes(die)) || 'd4';
  return `die-badge die-${tier}`;
};

// Print Modal with theme & favorites support
const PrintModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onPrint: (template: PdfTemplate, options: { theme: PdfTheme; onlyFavorites: boolean }) => void;
  isPrinting: boolean;
  totalMonsters: number;
  favoriteCount: number;
}> = ({ isOpen, onClose, onPrint, isPrinting, totalMonsters, favoriteCount }) => {
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>('parchment');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const dialogRef = useDialogAccessibility(isOpen);
  useBackNavigation(isOpen, onClose);

  if (!isOpen) return null;

  const activeCount = onlyFavorites ? favoriteCount : totalMonsters;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Exportar PDF" tabIndex={-1} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-stone-900 border border-amber-900/50 p-5 sm:p-7 rounded-xl shadow-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto text-stone-200 ring-1 ring-amber-500/20">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Printer className="w-6 h-6 text-amber-500" />
            <h2 className="font-cinzel text-lg sm:text-xl font-bold text-amber-300">Imprimir Bestiário em PDF</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Selector (Selection vs Favorites) */}
        {favoriteCount > 0 && (
          <div className="mb-4">
            <span className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
              Criaturas a Exportar
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOnlyFavorites(false)}
                className={`min-h-[40px] px-3 py-2 rounded-lg border text-xs font-cinzel font-bold transition-all ${
                  !onlyFavorites
                    ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Lista Atual ({totalMonsters})
              </button>
              <button
                type="button"
                onClick={() => setOnlyFavorites(true)}
                className={`min-h-[40px] px-3 py-2 rounded-lg border text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 transition-all ${
                  onlyFavorites
                    ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Favoritos ({favoriteCount})
              </button>
            </div>
          </div>
        )}

        {/* Style Selector */}
        <div className="mb-4">
          <span className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
            Estilo do Documento
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPdfTheme('parchment')}
              className={`min-h-[42px] px-3 py-2 rounded-lg border text-xs font-cinzel font-bold transition-all ${
                pdfTheme === 'parchment'
                  ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              Pergaminho (Impressão)
            </button>
            <button
              type="button"
              onClick={() => setPdfTheme('grimorio')}
              className={`min-h-[42px] px-3 py-2 rounded-lg border text-xs font-cinzel font-bold transition-all ${
                pdfTheme === 'grimorio'
                  ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              Grimório Sombrio
            </button>
          </div>
        </div>

        <p className="text-stone-400 text-xs mb-3">
          Escolha o formato do PDF ({activeCount} criatura{activeCount === 1 ? '' : 's'}):
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => onPrint('complete', { theme: pdfTheme, onlyFavorites })}
            disabled={isPrinting || activeCount === 0}
            className="w-full text-left p-3.5 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-amber-200 group-hover:text-amber-300 text-sm">Fichas Completas (Grimório A4)</h3>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-stone-400 mt-1">Página inteira por criatura com arte, atributos, perícias e lenda.</p>
          </button>

          <button
            onClick={() => onPrint('card', { theme: pdfTheme, onlyFavorites })}
            disabled={isPrinting || activeCount === 0}
            className="w-full text-left p-3.5 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-amber-200 group-hover:text-amber-300 text-sm">Cartas de Batalha (Tarô)</h3>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-stone-400 mt-1">Cartas frente e verso (70x120mm) prontas para recortar e jogar na mesa.</p>
          </button>

          <button
            onClick={() => onPrint('simple', { theme: pdfTheme, onlyFavorites })}
            disabled={isPrinting || activeCount === 0}
            className="w-full text-left p-3.5 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors group disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-amber-200 group-hover:text-amber-300 text-sm">Lista Rápida do Mestre</h3>
              <Printer className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-stone-400 mt-1">Tabela compacta com nomes e estatísticas essenciais de combate.</p>
          </button>
        </div>

        {isPrinting && (
          <div className="text-center text-amber-400 mt-5 flex items-center justify-center gap-2 text-sm font-medium animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            Gerando documento PDF estilizado, aguarde...
          </div>
        )}
      </div>
    </div>
  );
};

// Dedicated Styled PDF Export Modal for a Single Viewed Monster
const SingleMonsterPdfModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  monster: Monster;
  isFavorite: boolean;
  defaultHideSecrets: boolean;
}> = ({ isOpen, onClose, monster, isFavorite, defaultHideSecrets }) => {
  const [format, setFormat] = useState<'complete' | 'card'>('complete');
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>('parchment');
  const [hideSecrets, setHideSecrets] = useState(defaultHideSecrets);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHideSecrets(defaultHideSecrets);
      setExportStatus(null);
    }
  }, [isOpen, defaultHideSecrets, monster.id]);

  const dialogRef = useDialogAccessibility(isOpen);
  useBackNavigation(isOpen, onClose);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);
    try {
      const result = await generatePdf([monster], format, {
        theme: pdfTheme,
        hideSecrets,
      });
      if (result.success) {
        setExportStatus({
          type: 'success',
          message: `PDF "${result.fileName}" gerado com sucesso (${result.pageCount} ${result.pageCount === 1 ? 'página' : 'páginas'})!`,
        });
      } else {
        setExportStatus({
          type: 'error',
          message: result.error || 'Falha ao gerar o arquivo PDF.',
        });
      }
    } catch (err: any) {
      setExportStatus({
        type: 'error',
        message: err?.message || 'Erro inesperado ao exportar PDF.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Exportar PDF" tabIndex={-1} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-stone-900 border border-amber-900/50 p-5 sm:p-6 rounded-xl shadow-2xl max-w-lg w-full max-h-[92dvh] overflow-y-auto text-stone-200 ring-1 ring-amber-500/20 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="font-cinzel text-lg sm:text-xl font-bold text-amber-300 truncate">
                Exportar Ficha em PDF
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-stone-200">{monster.name}</span>
              <span>•</span>
              <span>{monster.sourcebook}</span>
              {isFavorite && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-cinzel font-bold">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  Favorito
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            aria-label="Fechar janela de exportação PDF"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Miniature Visual Preview */}
        <div
          className="rounded-xl p-3.5 border transition-colors"
          style={
            pdfTheme === 'parchment'
              ? {
                  backgroundColor: '#f7f0e2',
                  borderColor: '#8c5828',
                  color: '#1f140c',
                }
              : {
                  backgroundColor: '#0c0a09',
                  borderColor: '#92400e',
                  color: '#f5f5f4',
                }
          }
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b" style={{ borderColor: pdfTheme === 'parchment' ? '#d3bc96' : '#332b24' }}>
            <div className="min-w-0">
              <div
                className="font-cinzel font-bold text-sm truncate"
                style={{ color: pdfTheme === 'parchment' ? '#6b1d12' : '#fde68a' }}
              >
                {monster.name}
              </div>
              <div
                className="font-crimson italic text-xs truncate"
                style={{ color: pdfTheme === 'parchment' ? '#664933' : '#a8a29e' }}
              >
                {monster.archetype} • {monster.race}
              </div>
            </div>
            <span
              className="font-cinzel text-[9px] font-bold px-2 py-0.5 rounded shrink-0"
              style={
                pdfTheme === 'parchment'
                  ? { backgroundColor: '#7f1d1d', color: '#fef3c7' }
                  : { backgroundColor: '#d97706', color: '#0c0a09' }
              }
            >
              {format === 'complete' ? 'A4 COMPLETO' : 'CARTA 70×120mm'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono-dice text-[11px]">
            <div className="rounded py-1" style={{ backgroundColor: pdfTheme === 'parchment' ? '#fffaf0' : '#141210' }}>
              Aparar: <strong>{monster.parry}</strong>
            </div>
            <div className="rounded py-1" style={{ backgroundColor: pdfTheme === 'parchment' ? '#fffaf0' : '#141210' }}>
              Resist.: <strong>{monster.toughness}</strong>
            </div>
            <div className="rounded py-1" style={{ backgroundColor: pdfTheme === 'parchment' ? '#fffaf0' : '#141210' }}>
              Mov.: <strong>{monster.movement}</strong>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-stone-400 block">
            1. Formato da Impressão
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setFormat('complete')}
              className={`min-h-[48px] text-left p-3 rounded-xl border transition-all ${
                format === 'complete'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between font-cinzel text-xs font-bold">
                <span>Ficha Completa (A4)</span>
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Perfil completo ilustrado para pasta do Mestre ou impressão A4.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormat('card')}
              className={`min-h-[48px] text-left p-3 rounded-xl border transition-all ${
                format === 'card'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between font-cinzel text-xs font-bold">
                <span>Carta de Mesa (Tarô)</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                2 páginas (70×120mm frente e verso) para recortar ou escudo.
              </p>
            </button>
          </div>
        </div>

        {/* Visual Style Selection */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-stone-400 block">
            2. Estilo Visual do Documento
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPdfTheme('parchment')}
              className={`min-h-[48px] text-left p-3 rounded-xl border transition-all ${
                pdfTheme === 'parchment'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="font-cinzel text-xs font-bold">Pergaminho Clássico</div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Fundo claro creme; ideal para impressora e leitura física.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPdfTheme('grimorio')}
              className={`min-h-[48px] text-left p-3 rounded-xl border transition-all ${
                pdfTheme === 'grimorio'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div className="font-cinzel text-xs font-bold">Grimório Sombrio</div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Obsidiana com detalhes dourados; ideal para uso digital.
              </p>
            </button>
          </div>
        </div>

        {/* Hide Secrets Toggle */}
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer min-h-[48px]">
          <div className="flex items-center gap-2 text-xs text-stone-300">
            <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ocultar História / Lenda (Versão para Jogadores)</span>
          </div>
          <input
            type="checkbox"
            checked={hideSecrets}
            onChange={(e) => setHideSecrets(e.target.checked)}
            className="w-4 h-4 rounded border-stone-700 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </label>

        {/* Feedback Banner */}
        {exportStatus && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
              exportStatus.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-red-950/60 border-red-700 text-red-300'
            }`}
          >
            {exportStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <span>{exportStatus.message}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-cinzel font-semibold border border-stone-700"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-cinzel font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar PDF Estilizado</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Detailed Monster Sheet with interactive dice and combat tracker
const MonsterDetail: React.FC<{
  monster: Monster;
  onBack: () => void;
  onEdit: (monster: Monster) => void;
  onDuplicate: (monster: Monster) => void;
  onDelete: (id: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onRoll: (title: string, formula: string, isWildCard: boolean) => void;
  isPlayerView?: boolean;
}> = ({ monster, onBack, onEdit, onDuplicate, onDelete, isFavorite, onToggleFavorite, onRoll, isPlayerView = false }) => {
  const [chosenAttack, setChosenAttack] = useState<{attack:ParsedAttack;damageOnly:boolean}|null>(null);
  const attacks = useMemo(() => getMonsterAttacks(monster), [monster]);
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);
  const [showDetailTools, setShowDetailTools] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  useBackNavigation(showDetailTools, () => setShowDetailTools(false));

  const [isShaken, setIsShaken] = useState(false);
  const [wounds, setWounds] = useState(0);
  const [fatigue, setFatigue] = useState(0);

  const handleCopyDiscord = async () => {
    try { await copyToClipboard(formatMonsterDiscordMarkdown(monster)); }
    catch { notify('Não foi possível copiar a ficha.'); return; }
    notify(`Ficha de ${monster.name} copiada.`);
  };

  // Handle skill click for roll
  const handleSkillClick = (skillStr: string) => {
    // Skills are usually formatted like "Lutar d8", "Intimidar d10+2"
    const parts = skillStr.trim().split(' ');
    const die = parts[parts.length - 1];
    const skillName = parts.slice(0, parts.length - 1).join(' ') || skillStr;
    onRoll(`${monster.name} - ${skillName}`, die, !!monster.isWildCard);
  };

  return (
    <div className="bg-stone-950 border border-stone-800 rounded-xl shadow-2xl overflow-hidden ring-1 ring-amber-900/30">
      
      {/* Top Bar with Navigation & Actions */}
      <div className="bg-stone-900/90 border-b border-stone-800 p-3 sm:px-6 flex flex-wrap justify-between items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-cinzel font-semibold text-sm transition-colors min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Compêndio
        </button>

        <div className="detail-actions flex flex-wrap gap-2">
          <button type="button" aria-pressed={isFavorite} title={isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'} onClick={() => onToggleFavorite(monster.id)} className="min-h-11 px-3 border border-stone-700 rounded-lg flex items-center gap-2"><Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />{isFavorite ? 'Favoritado' : 'Favoritar'}</button>
          <button type="button" title="Editar ficha deste monstro no armazenamento local" onClick={() => onEdit(monster)} className="min-h-11 px-3 border border-stone-700 rounded-lg flex items-center gap-2"><Edit className="w-4 h-4" />Editar</button>
          <button type="button" onClick={() => setShowExportPdfModal(true)} className="min-h-11 px-3 border border-stone-700 rounded-lg flex items-center gap-2"><Printer className="w-4 h-4" />PDF</button>
          <details className="relative" open={showDetailTools} onToggle={event => setShowDetailTools(event.currentTarget.open)}>
            <summary className="min-h-11 px-3 border border-stone-700 rounded-lg cursor-pointer flex items-center gap-2">Mais <ChevronDown className="w-4 h-4" /></summary>
            <div className="catalog-more-panel absolute right-0 top-full z-40 mt-2 w-56 rounded-xl bg-stone-900 border border-stone-700 p-2 shadow-xl grid">
              <button type="button" onClick={() => { setShowDetailTools(false); handleCopyDiscord(); }}><Copy className="w-4 h-4" />Copiar ficha</button>
              <button type="button" onClick={() => { setShowDetailTools(false); onDuplicate(monster); }}><Plus className="w-4 h-4" />Duplicar criatura</button>
              <button type="button" onClick={() => { setShowDetailTools(false); setShowDeleteConfirmation(true); }} className="text-red-400"><Trash2 className="w-4 h-4" />Excluir criatura</button>
            </div>
          </details>
        </div>
      </div>

      {/* Main Monster Sheet Body */}
      <div className="p-4 sm:p-8 space-y-8">
        
        {/* Header Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Portrait Image */}
          {monster.imageUrl !== '/book-creature.svg' && <div className="monster-portrait md:col-span-4 relative group">
            <div className="relative rounded-xl overflow-hidden border-2 border-amber-900/60 shadow-xl bg-stone-900">
              <img loading="lazy"
                src={monster.imageUrl}
                alt={monster.name}
                referrerPolicy="no-referrer"
                className="w-full h-64 sm:h-84 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_MONSTER_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Badge for Wild Card or Extra */}
              <div className="absolute top-3 left-3">
                {monster.referenceOnly ? (
                  <span className="text-xs text-amber-200">Referência</span>
                ) : monster.isWildCard ? (
                  <span className="bg-amber-500 text-stone-950 font-cinzel font-bold text-xs px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 border border-amber-300">
                    <Skull className="w-3.5 h-3.5" />
                    Carta Selvagem
                  </span>
                ) : (
                  <span className="bg-stone-800/90 text-stone-300 font-cinzel text-xs px-2.5 py-1 rounded-md shadow border border-stone-700">
                    Extra (Capanga)
                  </span>
                )}
              </div>

              {/* Sourcebook tag */}
              <div className="absolute bottom-3 left-3 text-[11px] text-stone-300 font-cinzel bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-stone-700">
                {monster.sourcebook}
              </div>
            </div>
          </div>}

          {/* Title & Core Details */}
          <div className={`${monster.imageUrl === '/book-creature.svg' ? 'md:col-span-12' : 'md:col-span-8'} space-y-4`}>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-cinzel text-2xl sm:text-5xl font-extrabold text-amber-200 tracking-wide">
                  {monster.name}
                </h1>
              </div>
              <p className="text-sm text-stone-400 mt-2 flex flex-wrap items-center gap-2"><BookOpen className="w-4 h-4" />{monster.sourcebook} · {monster.referenceOnly ? 'Referência / modelo' : monster.isWildCard ? 'Carta Selvagem' : 'Extra'}</p>
              <p className="text-stone-400 font-crimson text-base sm:text-lg italic mt-1">
                {monster.archetype !== 'Ficha do livro' ? monster.archetype : ''}{monster.race !== 'Não especificada' ? ` · ${monster.race}` : ''}
              </p>
            </div>

            {/* Quick Combat Vital Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-stone-900/90 p-3 sm:p-4 rounded-xl border border-stone-800">
              <div className="text-center bg-stone-950/60 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-stone-800/80 sm:border-0 sm:border-r sm:border-stone-800">
                <div className="text-[11px] uppercase tracking-wider text-stone-400 font-cinzel">Aparar (Parry)</div>
                <div className="font-cinzel text-2xl font-bold text-amber-300 font-mono-dice">{monster.parry}</div>
              </div>
              <div className="text-center bg-stone-950/60 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-stone-800/80 sm:border-0 sm:border-r sm:border-stone-800">
                <div className="text-[11px] uppercase tracking-wider text-stone-400 font-cinzel">Resistência</div>
                <div className="font-cinzel text-2xl font-bold text-amber-300 font-mono-dice">{monster.toughness}</div>
              </div>
              <div className="text-center bg-stone-950/60 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-stone-800/80 sm:border-0 sm:border-r sm:border-stone-800">
                <div className="text-[11px] uppercase tracking-wider text-stone-400 font-cinzel">Movimentação</div>
                <div className="font-cinzel text-2xl font-bold text-amber-300 font-mono-dice flex items-center justify-center gap-1">
                  <Footprints className="w-4 h-4 text-stone-400" />
                  {monster.movement}
                </div>
              </div>
              <div className="text-center bg-stone-950/60 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-stone-800/80 sm:border-0">
                <div className="text-[11px] uppercase tracking-wider text-stone-400 font-cinzel">Tamanho</div>
                <div className="font-cinzel text-2xl font-bold text-amber-300 font-mono-dice">
                  {monster.size !== undefined ? (monster.size > 0 ? `+${monster.size}` : monster.size) : '0'}
                </div>
              </div>
            </div>

            {/* In-Game Combat Tracker (Abalado e Ferimentos) */}
            <details className="bg-stone-900/60 p-4 rounded-xl border border-stone-800/80 space-y-3">
              <summary className="min-h-11 cursor-pointer text-sm font-semibold">Acompanhar combate · marcadores temporários</summary>
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-xs uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Marcadores desta ficha
                </span>
                <span className="text-[11px] text-stone-500 italic">Estado temporário durante a cena</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Shaken Toggle */}
                <button
                  onClick={() => setIsShaken(!isShaken)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-cinzel transition-all ${
                    isShaken
                      ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md shadow-amber-600/30 animate-pulse'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  {isShaken ? '⚡ ABALADO (Shaken)' : 'Normal (Não Abalado)'}
                </button>

                {/* Wounds Tracker for Wild Card or Extra */}
                {monster.referenceOnly ? (
                  <span className="text-xs text-amber-200">Referência</span>
                ) : monster.isWildCard ? (
                  <div className="flex items-center gap-1.5 bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
                    <span className="text-xs text-stone-400 font-cinzel mr-1">Ferimentos:</span>
                    {[0, 1, 2, 3, 4].map((w) => (
                      <button
                        key={w}
                        onClick={() => setWounds(w)}
                        className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                          wounds === w
                            ? w === 4
                              ? 'bg-red-700 text-white border border-red-500'
                              : 'bg-red-900 text-red-200 border border-red-700'
                            : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                        }`}
                        title={w === 4 ? 'Incapacitado' : `${w} Ferimento(s)`}
                      >
                        {w === 4 ? 'X' : w}
                      </button>
                    ))}
                    {wounds > 0 && wounds < 4 && (
                      <span className="text-[11px] text-red-400 ml-1 font-mono-dice">(-{wounds})</span>
                    )}
                    {wounds === 4 && (
                      <span className="text-[11px] text-red-500 font-bold ml-1 font-cinzel">Incapacitado</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span>(Extra: 1 Ferimento = Incapacitado)</span>
                  </div>
                )}
              </div>
            </details>

            {/* Backstory / Flavor lore */}
            {isPlayerView ? (
              <div className="bg-blue-950/30 p-4 rounded-xl border border-blue-900/50 text-xs text-blue-300/80 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-blue-400 shrink-0" />
                <span>[História Secreta e Fraquezas Ocultadas pelo Mestre no Modo Jogador]</span>
              </div>
            ) : (
              <details className="bg-stone-900/40 p-4 rounded-xl border border-stone-800/80 text-stone-300">
                <summary className="cursor-pointer text-sm font-semibold">História e descrição</summary>
                <p className="font-crimson text-lg leading-relaxed mt-3">{monster.history || 'Sem descrição adicional.'}</p>
              </details>
            )}
          </div>
        </div>

        {monster.sourceReference && (
          <section className="rounded-xl border border-stone-700 bg-stone-900/50 p-4 space-y-3">
            <p className="text-sm text-amber-200">
              Fonte: {monster.sourcebook} · linha {monster.sourceReference.line}
            </p>
            {monster.sourceWarnings?.map((warning) => (
              <p key={warning} className="text-sm text-amber-300">{warning}</p>
            ))}
            {!isPlayerView && monster.abilityVariants && (
              <details>
                <summary className="cursor-pointer text-sm text-amber-200">Habilidades variantes (opcionais)</summary>
                <p className="whitespace-pre-wrap text-sm text-stone-300 mt-3">{monster.abilityVariants}</p>
              </details>
            )}
            {!isPlayerView && monster.sourceText && (
              <details>
                <summary className="cursor-pointer text-sm text-amber-200">Consultar ficha no texto do livro</summary>
                <pre className="whitespace-pre-wrap break-words font-crimson text-base text-stone-300 mt-3 max-h-96 overflow-y-auto">{monster.sourceText}</pre>
              </details>
            )}
          </section>
        )}

        {/* SWADE Attributes & Interactive Dice Rolling */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-cinzel text-lg font-bold text-amber-300 flex items-center gap-2">
              <Dices className="w-5 h-5 text-amber-500" />
              Atributos de Traço (Clique no dado para Rolar!)
            </h3>
            <span className="text-xs text-stone-400 italic">Rola com Ases automáticos</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Agilidade', key: 'agility', value: monster.attributes.agility },
              { label: 'Astúcia', key: 'cunning', value: monster.attributes.cunning },
              { label: 'Espírito', key: 'spirit', value: monster.attributes.spirit },
              { label: 'Força', key: 'strength', value: monster.attributes.strength },
              { label: 'Vigor', key: 'vigor', value: monster.attributes.vigor },
            ].map((attr) => (
              <button
                key={attr.key}
                disabled={!/d\d+/i.test(attr.value)}
                title={!/d\d+/i.test(attr.value) ? "Este atributo não possui dado no livro" : undefined}
                onClick={() => onRoll(`${monster.name} - ${attr.label}`, attr.value, !!monster.isWildCard)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer group shadow-sm ${getDieBadgeClass(
                  attr.value
                )}`}
              >
                <span className="text-xs uppercase tracking-wider text-stone-300 group-hover:text-white font-cinzel">
                  {attr.label}
                </span>
                <span className="font-mono-dice text-2xl font-black mt-1 group-hover:scale-110 transition-transform">
                  {attr.value}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Skills Section (Interactive Chips) */}
        <div className="space-y-3">
          <h3 className="font-cinzel text-lg font-bold text-amber-300 flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-500" />
            Perícias (Clique para Rolar o Teste)
          </h3>
          <div className="flex flex-wrap gap-2">
            {(monster.skills || []).map((skill, index) => (
              <button
                key={index}
                onClick={() => handleSkillClick(skill)}
                className="px-3 py-1.5 bg-stone-900 hover:bg-amber-950/70 border border-stone-700 hover:border-amber-600 rounded-lg text-sm text-stone-200 transition-all flex items-center gap-2 group shadow-sm"
              >
                <span className="group-hover:text-amber-300 font-medium">{skill}</span>
                <Dices className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Weapons and Special Abilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Special Abilities */}
          <div className="bg-stone-900/60 p-5 rounded-xl border border-stone-800 space-y-3">
            <h4 className="font-cinzel text-base font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Habilidades Especiais
            </h4>
            <div className="space-y-3 text-sm">
              {(monster.abilities || []).length > 0 ? (
                monster.abilities.map((ability, index) => (
                  <div key={index} className="border-l-2 border-amber-700/60 pl-3">
                    <span className="font-cinzel font-bold text-stone-200">{ability.name}: </span>
                    <span className="text-stone-300 leading-relaxed">{ability.description}</span>
                  </div>
                ))
              ) : (
                <p className="text-stone-500 text-xs italic">Nenhuma habilidade especial extraordinária.</p>
              )}
            </div>
          </div>

          {/* Weapons, Edges, Hindrances */}
          <div className="space-y-4">
            
            {(monster.weapons || attacks.length > 0) && (
              <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800 space-y-3">
                <h4 className="font-cinzel text-sm font-bold text-amber-400 flex items-center gap-2"><Swords className="w-4 h-4"/>Armas e ataques</h4>
                {monster.weapons && <p className="text-sm text-stone-300">{monster.weapons}</p>}
                {attacks.map((attack,index)=><div key={index} className="attack-entry bg-stone-950 p-3 rounded-lg border border-stone-700 space-y-2">
                  <p className="font-semibold text-sm">{attack.name} <span className="text-stone-400">· {attack.formula}</span></p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={()=>setChosenAttack({attack,damageOnly:false})} className="combat-primary min-h-11 px-4 rounded-lg font-semibold" aria-label={`Atacar com ${attack.name}`}>Atacar</button>
                    <button type="button" onClick={()=>setChosenAttack({attack,damageOnly:true})} className="min-h-11 px-3 rounded-lg border border-stone-700" aria-label={`Dano direto de ${attack.name}`}>Dano direto</button>
                  </div>
                </div>)}
                {!attacks.length&&<p className="text-xs text-stone-400">Nenhuma fórmula de dano reconhecida. Edite a ficha para informar, por exemplo, Garras (For+d4).</p>}
              </div>
            )}

            {/* Powers */}
            {monster.powers && (
              <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800">
                <h4 className="font-cinzel text-sm font-bold text-purple-400 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Poderes Arcanos
                </h4>
                <p className="text-sm text-stone-300">{monster.powers}</p>
              </div>
            )}

            {/* Edges & Hindrances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                <span className="font-cinzel text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Vantagens (Edges)
                </span>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {(monster.advantages || []).length > 0 ? monster.advantages.join(', ') : 'Nenhuma'}
                </p>
              </div>

              <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                <span className="font-cinzel text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">
                  Complicações
                </span>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {(monster.complications || []).length > 0 ? monster.complications.join(', ') : 'Nenhuma'}
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Styled Single Monster PDF Export Modal */}
      <ConfirmDialog open={showDeleteConfirmation} title="Excluir criatura?" message={`Deseja excluir ${monster.name} deste aparelho? Exporte um backup se quiser guardar esta ficha.`} confirmLabel="Excluir criatura" onCancel={() => setShowDeleteConfirmation(false)} onConfirm={() => onDelete(monster.id)} />
      {chosenAttack && <AttackRollModal monster={monster} attack={chosenAttack.attack} damageOnly={chosenAttack.damageOnly} initialModifier={-Math.min(wounds,3)-fatigue} onClose={()=>setChosenAttack(null)} />}
      <SingleMonsterPdfModal
        isOpen={showExportPdfModal}
        onClose={() => setShowExportPdfModal(false)}
        monster={monster}
        isFavorite={isFavorite}
        defaultHideSecrets={isPlayerView}
      />
    </div>
  );
};

// Reusable Grid Card Item for Monsters
interface MonsterCardItemProps {
  monster: Monster;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onSelect: (monster: Monster) => void;
  onRoll: (title: string, formula: string, isWildCard: boolean) => void;
  onCopyDiscord: (monster: Monster) => void;
}

const MonsterCardItem: React.FC<MonsterCardItemProps> = ({
  monster,
  isFav,
  onToggleFav,
  onSelect,
  onRoll,
  onCopyDiscord
}) => {
  return (
    <div className="bg-stone-950 border border-stone-800 hover:border-amber-700/80 rounded-xl overflow-hidden shadow-xl hover:shadow-amber-900/30 transition-all duration-300 hover:-translate-y-1 flex flex-col group relative ring-1 ring-amber-900/10">
      {/* Card Image Banner */}
      <div
        role="article" aria-label={monster.name}
      onClick={() => onSelect(monster)}
        className="relative h-48 bg-stone-900 cursor-pointer overflow-hidden"
      >
        <img loading="lazy"
          src={monster.imageUrl}
          alt={monster.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_MONSTER_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Wild Card Skull Badge */}
        <div className="absolute top-2.5 left-2.5">
          {monster.referenceOnly ? (
                  <span className="text-xs text-amber-200">Referência</span>
                ) : monster.isWildCard ? (
            <span className="bg-amber-500 text-stone-950 font-cinzel font-bold text-[10px] px-2 py-0.5 rounded shadow-md flex items-center gap-1 border border-amber-300">
              <Skull className="w-3 h-3" />
              Carta Selvagem
            </span>
          ) : (
            <span className="bg-stone-900/90 text-stone-400 font-cinzel text-[10px] px-2 py-0.5 rounded border border-stone-800">
              Extra
            </span>
          )}
        </div>

        {/* Favorite Star Toggle Button on Card */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(monster.id);
          }}
          className={`absolute top-2 right-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            isFav
              ? 'bg-amber-950/90 text-amber-400 border border-amber-500 shadow-md shadow-amber-950/60 scale-105'
              : 'bg-stone-950/70 text-stone-400 hover:text-amber-300 hover:bg-stone-900 border border-stone-700/80 hover:border-amber-500/60'
          }`}
          title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          aria-label={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
        >
          <Star className={`w-4 h-4 transition-transform ${isFav ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
        </button>

        {/* Monster Name and Archetype overlay */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <h3 className="font-cinzel text-lg font-bold text-amber-200 truncate drop-shadow-md group-hover:text-amber-300">
            {monster.name}
          </h3>
          <p className="text-xs text-stone-300 font-crimson italic truncate">
            {monster.archetype} • {monster.race}
          </p>
        </div>
      </div>

      {/* Card Stats Footer */}
      <div className="p-3.5 bg-stone-900/90 flex-grow flex flex-col justify-between space-y-3">
        
        {/* Combat Mini Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-stone-950/80 p-1.5 rounded border border-stone-800">
            <span className="text-[10px] text-stone-400 block font-cinzel">Aparar</span>
            <span className="font-bold text-amber-400 font-mono-dice">{monster.parry}</span>
          </div>
          <div className="bg-stone-950/80 p-1.5 rounded border border-stone-800">
            <span className="text-[10px] text-stone-400 block font-cinzel">Resist.</span>
            <span className="font-bold text-amber-400 font-mono-dice">{monster.toughness}</span>
          </div>
          <div className="bg-stone-950/80 p-1.5 rounded border border-stone-800">
            <span className="text-[10px] text-stone-400 block font-cinzel">Mov.</span>
            <span className="font-bold text-amber-400 font-mono-dice">{monster.movement}</span>
          </div>
        </div>

        {/* Quick Dice Roll Badges (Agilidade & Força) */}
        <div className="flex items-center justify-between pt-1.5 border-t border-stone-800/80 text-xs gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              disabled={!/d\d+/i.test(monster.attributes.agility)}
              onClick={(e) => {
                e.stopPropagation();
                onRoll(`${monster.name} - Agilidade`, monster.attributes.agility, !!monster.isWildCard);
              }}
              className="text-[11px] px-2.5 py-1.5 min-h-[34px] bg-stone-950 hover:bg-amber-950 border border-stone-800 hover:border-amber-700 rounded-md text-stone-300 font-mono-dice transition-colors whitespace-nowrap"
              title="Rolar Agilidade"
            >
              Agil {monster.attributes.agility}
            </button>
            <button
              disabled={!/d\d+/i.test(monster.attributes.strength)}
              onClick={(e) => {
                e.stopPropagation();
                onRoll(`${monster.name} - Força`, monster.attributes.strength, !!monster.isWildCard);
              }}
              className="text-[11px] px-2.5 py-1.5 min-h-[34px] bg-stone-950 hover:bg-amber-950 border border-stone-800 hover:border-amber-700 rounded-md text-stone-300 font-mono-dice transition-colors whitespace-nowrap"
              title="Rolar Força"
            >
              For {monster.attributes.strength}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopyDiscord(monster);
              }}
              className="min-h-[34px] min-w-[34px] flex items-center justify-center text-stone-500 hover:text-amber-400 rounded-md hover:bg-stone-800 transition-colors"
              title="Copiar Ficha rápida (Discord / VTT)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              aria-label={`Abrir ficha de ${monster.name}`}
      onClick={() => onSelect(monster)}
              className="min-h-[34px] px-2 font-cinzel text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 whitespace-nowrap"
            >
              Ficha →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// Compact Table/List Row Item for fast scanning through hundreds of monsters
const MonsterRowItem: React.FC<MonsterCardItemProps> = ({
  monster,
  isFav,
  onToggleFav,
  onSelect,
  onRoll,
  onCopyDiscord
}) => {
  return (
    <div
      role="article" aria-label={monster.name}
      onClick={() => onSelect(monster)}
      className="catalog-row group flex items-center justify-between p-2.5 sm:px-4 bg-stone-950/80 hover:bg-stone-900 border border-stone-800/80 hover:border-amber-700/60 rounded-lg transition-all cursor-pointer gap-3"
    >
      {/* Left: Avatar & Identity */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {monster.imageUrl !== '/book-creature.svg' && <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-stone-800 bg-stone-900">
          <img loading="lazy"
            src={monster.imageUrl}
            alt={monster.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_MONSTER_IMAGE;
            }}
          />
          {monster.isWildCard && (
            <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 p-0.5 rounded-bl">
              <Skull className="w-2.5 h-2.5" />
            </div>
          )}
        </div>}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-stone-200 group-hover:text-amber-300 text-sm">
              {monster.name}
            </h4>
            {monster.referenceOnly ? (
                  <span className="text-xs text-amber-200">Referência</span>
                ) : monster.isWildCard ? (
              <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-950/80 border border-amber-600/60 text-amber-300 font-cinzel text-[9px] rounded font-semibold">
                Carta Selvagem
              </span>
            ) : (
              <span className="hidden md:inline-flex px-1.5 py-0.2 bg-stone-900 border border-stone-800 text-stone-400 font-cinzel text-[9px] rounded">
                Extra
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 truncate font-crimson italic">
            {monster.sourcebook}{monster.referenceOnly ? ' · Referência' : ''}
          </p>
        </div>
      </div>

      {/* Middle: Combat Stats Badges */}
      <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs">
        <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded border border-stone-800">
          <span className="text-[10px] text-stone-500 font-cinzel">Aparar:</span>
          <span className="font-mono-dice text-amber-300 font-bold">{monster.parry}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded border border-stone-800">
          <span className="text-[10px] text-stone-500 font-cinzel">Resist:</span>
          <span className="font-mono-dice text-amber-300 font-bold">{monster.toughness}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded border border-stone-800">
          <span className="text-[10px] text-stone-500 font-cinzel">Mov:</span>
          <span className="font-mono-dice text-amber-300 font-bold">{monster.movement}</span>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          disabled={!/d\d+/i.test(monster.attributes.agility)}
          onClick={() => onRoll(`${monster.name} - Agilidade`, monster.attributes.agility, !!monster.isWildCard)}
          className="hidden md:inline-block text-[10px] px-1.5 py-1 bg-stone-900 hover:bg-amber-950 border border-stone-800 hover:border-amber-700 rounded text-stone-300 font-mono-dice transition-colors"
          title="Rolar Agilidade"
        >
          Ag {monster.attributes.agility}
        </button>
        <button
          disabled={!/d\d+/i.test(monster.attributes.strength)}
          onClick={() => onRoll(`${monster.name} - Força`, monster.attributes.strength, !!monster.isWildCard)}
          className="hidden md:inline-block text-[10px] px-1.5 py-1 bg-stone-900 hover:bg-amber-950 border border-stone-800 hover:border-amber-700 rounded text-stone-300 font-mono-dice transition-colors"
          title="Rolar Força"
        >
          For {monster.attributes.strength}
        </button>

        <button
          onClick={() => onCopyDiscord(monster)}
          className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded transition-colors"
          title="Copiar Ficha (Discord / VTT)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onToggleFav(monster.id)}
          className={`p-1.5 rounded transition-colors ${
            isFav ? 'text-amber-400 bg-amber-950/60 border border-amber-600/50' : 'text-stone-400 hover:text-amber-300 hover:bg-stone-800'
          }`}
          title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          aria-label={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
        >
          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>

        <button
          aria-label={`Abrir ficha de ${monster.name}`}
      onClick={() => onSelect(monster)}
          className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded font-cinzel font-bold text-xs transition-colors ml-1"
        >
          <span className="hidden sm:inline">Ficha</span><ArrowRight className="w-4 h-4 sm:hidden" />
        </button>
      </div>
    </div>
  );
};

// Main Bestiary Component
const Bestiary: React.FC<{
  onEditMonster: (monster: Monster) => void;
  showCreator: () => void;
  isPlayerView?: boolean;
}> = ({ onEditMonster, showCreator, isPlayerView = false }) => {
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchDeep, setSearchDeep] = useState(false);
  const [homeSearch, setHomeSearch] = useState('');
  const [page, setPage] = useState(1);
  const listScroll = useRef(0);
  const previousMonster = useRef<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try { const ids = JSON.parse(localStorage.getItem('swade_recent_monsters') || '[]'); return Array.isArray(ids) ? ids.filter(id => typeof id === 'string').slice(0, 5) : []; }
    catch { return []; }
  });
  const [activeTab, setActiveTab] = useState<'books' | 'all' | 'favorites'>('books');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [monstersList, setMonstersList] = useState<Monster[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Local Storage and Offline Manager state
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [selectedSourcebookFilter, setSelectedSourcebookFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedRaceFilter, setSelectedRaceFilter] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    try { const mode = localStorage.getItem('swade_catalog_display'); if (mode && ['table', 'cards', 'alphabetical', 'by-race'].includes(mode)) return mode as DisplayMode; } catch { /* Keep browsing when storage is unavailable. */ }
    return 'table';
  });
  useEffect(() => { try { localStorage.setItem('swade_catalog_display', displayMode); } catch { /* Optional preference. */ } }, [displayMode]);
  const [collapsedLetters, setCollapsedLetters] = useState<Set<string>>(new Set());
  const [collapsedRaces, setCollapsedRaces] = useState<Set<string>>(new Set());
  const [toughnessFilter, setToughnessFilter] = useState<'all' | 'fragil' | 'medio' | 'resistente' | 'titanico'>('all');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'pequeno' | 'medio' | 'grande'>('all');
  const [wildCardFilter, setWildCardFilter] = useState<'all' | 'wildcard' | 'extra'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'name-desc' | 'toughness-desc' | 'toughness-asc' | 'parry' | 'size'>('name');

  // Encounter Builder Modal state
  const [showEncounterModal, setShowEncounterModal] = useState(false);

  // Monster Statistics & Distribution Modal (D3 Pie Chart)
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Dice Roller Modal state
  const [activeRoll, setActiveRoll] = useState<DiceRollResult | null>(null);

  useBackNavigation(Boolean(selectedMonster), () => setSelectedMonster(null), 20);
  useBackNavigation(Boolean(selectedBook) || activeTab !== 'books', () => {
    setSelectedBook(null);
    setActiveTab('books');
    setSearchTerm('');
    setSelectedLetter('all');
  }, 10);

  useLayoutEffect(() => {
    if (selectedMonster) window.scrollTo({ top: 0, behavior: 'instant' });
    else if (previousMonster.current) window.scrollTo({ top: listScroll.current, behavior: 'instant' });
    previousMonster.current = selectedMonster?.id ?? null;
  }, [selectedMonster?.id]);

  const openMonster = (monster: Monster) => {
    listScroll.current = window.scrollY;
    setSelectedMonster(monster);
    setRecentIds(previous => {
      const next = [monster.id, ...previous.filter(id => id !== monster.id)].slice(0, 5);
      try { localStorage.setItem('swade_recent_monsters', JSON.stringify(next)); } catch { /* Navigation still works with storage disabled. */ }
      return next;
    });
  };

  useBackNavigation(toolsExpanded && !selectedMonster, () => setToolsExpanded(false));

  // Hidden file input for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize full database from localStorage
    setMonstersList(getAllLocalMonsters());
    setFavoriteIds(getFavoriteMonsterIds());

    const handleMonstersUpdated = () => {
      const updated = getAllLocalMonsters();
      setMonstersList(updated);
      setSelectedMonster(current => current ? updated.find(m => m.id === current.id) ?? null : null);
      setFavoriteIds(getFavoriteMonsterIds());
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('swade_monsters_updated', handleMonstersUpdated);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('swade_monsters_updated', handleMonstersUpdated);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore cleanup error
        }
      }
    };
  }, []);

  // Web Speech API Voice Search Handler
  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      notify('Seu navegador não suporta busca por voz (Web Speech API). Recomendamos o uso do Google Chrome, Edge ou navegadores compatíveis.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn('Erro ao interromper reconhecimento de voz:', err);
        }
      }
      setIsListening(false);
      setSpeechFeedback(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechFeedback('Ouvindo... Diga o nome do monstro (ex: "Dragão", "Lobisomem", "Goblin")');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        // Clean trailing punctuation
        const cleaned = transcript.trim().replace(/[.,!?;:]$/, '');
        if (cleaned) {
          setSearchTerm(cleaned);
          setSpeechFeedback(`Buscando por: "${cleaned}"`);
          // If letter filter was active and restricted, reset to 'all' so monster appears
          setSelectedLetter('all');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Erro de reconhecimento de voz:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechFeedback('Permissão de microfone negada. Habilite o microfone no navegador.');
        } else if (event.error === 'no-speech') {
          setSpeechFeedback('Nenhuma voz detectada. Tente falar novamente.');
        } else {
          setSpeechFeedback(`Aviso de voz: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setSpeechFeedback(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setSpeechFeedback(null), 3000);
      };

      recognition.start();
    } catch (err) {
      console.error('Falha ao iniciar reconhecimento de voz:', err);
      setIsListening(false);
      setSpeechFeedback('Não foi possível iniciar o microfone.');
      setTimeout(() => setSpeechFeedback(null), 3000);
    }
  };

  const allMonsters = monstersList;
  const roleIndex = useMemo(() => new Map(allMonsters.map(m => [m.id, classifyMonster(m)])), [allMonsters]);
  const searchIndex = useMemo(() => new Map(allMonsters.map(m => [m.id, {
    name: normalizeSearch(m.name),
    details: normalizeSearch([m.name, m.race, m.archetype, ...(m.skills || []), ...(m.abilities || []).map(a => `${a.name} ${a.description}`), m.weapons, m.powers, m.history].filter(Boolean).join(' ')),
  }])), [allMonsters]);


  const alphabetLetters = useMemo(() => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
  }, []);

  // Extract all unique races for filtering
  const availableRaces = useMemo(() => {
    const races = new Set<string>();
    allMonsters.forEach(m => {
      if (m.race) races.add(m.race);
    });
    return Array.from(races).sort();
  }, [allMonsters]);

  const books = useMemo(() => {
    const bookMap = allMonsters.reduce((acc, monster) => {
      const book = monster.sourcebook || 'Outros Suplementos';
      if (!acc[book]) acc[book] = [];
      acc[book].push(monster);
      return acc;
    }, {} as Record<string, Monster[]>);
    return Object.entries(bookMap).sort(([a], [b]) => a.localeCompare(b));
  }, [allMonsters]);

  const handleDelete = (id: string) => {
    deleteMonsterFromStorage(id);
    setMonstersList(getAllLocalMonsters());
    setSelectedMonster(null);
  };

  const handleDuplicate = (monster: Monster) => {
    try {
      const cloned = duplicateMonster(monster.id);
      if (!cloned) return;
      setMonstersList(getAllLocalMonsters());
      setSelectedMonster(cloned);
      notify('Criatura duplicada neste aparelho.');
    } catch { notify('Não foi possível duplicar. Verifique o espaço de armazenamento.'); }
  };

  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavoriteMonster(id);
    setFavoriteIds(updated);
  };

  // Add encounter monsters directly to favorites
  const handleAddEncounterToSession = (monsterIds: string[]) => {
    monsterIds.forEach(id => {
      if (!favoriteIds.includes(id)) {
        toggleFavoriteMonster(id);
      }
    });
    setFavoriteIds(getFavoriteMonsterIds());
  };

  // Quick Discord Copy
  const handleCopyDiscordQuick = async (m: Monster) => {
    try { await copyToClipboard(formatMonsterDiscordMarkdown(m)); notify(`Ficha de ${m.name} copiada.`); }
    catch { notify('Não foi possível copiar. Verifique a permissão da área de transferência.'); }
  };

  // Accordion Toggle Helpers
  const toggleCollapseLetter = (letter: string) => {
    setCollapsedLetters(prev => {
      const next = new Set(prev);
      if (next.has(letter)) {
        next.delete(letter);
      } else {
        next.add(letter);
      }
      return next;
    });
  };

  const toggleCollapseRace = (race: string) => {
    setCollapsedRaces(prev => {
      const next = new Set(prev);
      if (next.has(race)) {
        next.delete(race);
      } else {
        next.add(race);
      }
      return next;
    });
  };

  const expandAllGroups = () => {
    setCollapsedLetters(new Set());
    setCollapsedRaces(new Set());
  };

  const collapseAllGroups = () => {
    const allL = new Set(monstersGroupedByLetter.map(g => g.letter));
    setCollapsedLetters(allL);
    const allR = new Set(monstersGroupedByRace.map(g => g.race));
    setCollapsedRaces(allR);
  };

  // Trigger SWADE Dice Roll from anywhere
  const handleTriggerRoll = (title: string, formula: string, isWildCard: boolean) => {
    const result = rollTrait(title, formula, isWildCard);
    setActiveRoll(result);
  };

  // Export JSON Backup of full local database
  const handleExportBackup = () => {
    const jsonStr = exportFullDatabaseAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bestiario_savage_worlds_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup into full local database
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importFullDatabaseFromJson(content, 'merge');
        notify(res.message);
        if (res.success) {
          setMonstersList(getAllLocalMonsters());
          setFavoriteIds(getFavoriteMonsterIds());
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 1. Base filtered monsters (respects search, sourcebook, race, toughness, size, wildCard)
  const baseFilteredMonsters = useMemo(() => {
    let list: Monster[] = [];

    if (activeTab === 'favorites') {
      list = allMonsters.filter(m => favoriteIds.includes(m.id));
    } else if (selectedBook) {
      list = books.find(([title]) => title === selectedBook)?.[1] || [];
    } else {
      list = allMonsters;
    }

    // Filter only favorites if toggled in any view
    if (onlyFavoritesFilter && activeTab !== 'favorites') {
      list = list.filter(m => favoriteIds.includes(m.id));
    }

    // Sourcebook filter (when in 'all' view)
    if (activeTab === 'all' && selectedSourcebookFilter !== 'all') {
      list = list.filter(m => m.sourcebook === selectedSourcebookFilter);
    }

    if (selectedRoleFilter !== 'all') {
      list = list.filter(m => selectedRoleFilter === 'unclassified' ? !m.referenceOnly && !roleIndex.get(m.id)?.length : roleIndex.get(m.id)?.some(role => role === selectedRoleFilter));
    }

    // Race filter
    if (selectedRaceFilter !== 'all') {
      list = list.filter(m => m.race.toLowerCase() === selectedRaceFilter.toLowerCase());
    }

    // Toughness filter
    if (toughnessFilter !== 'all') {
      list = list.filter(m => {
        const tVal = parseInt(m.toughness, 10) || 4;
        if (toughnessFilter === 'fragil') return tVal <= 5;
        if (toughnessFilter === 'medio') return tVal >= 6 && tVal <= 8;
        if (toughnessFilter === 'resistente') return tVal >= 9 && tVal <= 11;
        if (toughnessFilter === 'titanico') return tVal >= 12;
        return true;
      });
    }

    // Size filter
    if (sizeFilter !== 'all') {
      list = list.filter(m => {
        const sVal = m.size ?? 0;
        if (sizeFilter === 'pequeno') return sVal < 0;
        if (sizeFilter === 'medio') return sVal === 0;
        if (sizeFilter === 'grande') return sVal > 0;
        return true;
      });
    }

    // Wild Card filter
    if (wildCardFilter === 'wildcard') {
      list = list.filter(m => m.isWildCard);
    } else if (wildCardFilter === 'extra') {
      list = list.filter(m => !m.isWildCard);
    }

    // Enhanced Deep text search
    if (searchTerm.trim()) {
      const terms = normalizeSearch(searchTerm).split(/\s+/).filter(Boolean);
      list = list.filter(m => {
        const entry = searchIndex.get(m.id);
        const haystack = searchDeep ? entry?.details : entry?.name;
        return terms.every(term => haystack?.includes(term));
      });
    }

    return list;
  }, [allMonsters, activeTab, selectedBook, favoriteIds, onlyFavoritesFilter, selectedSourcebookFilter, selectedRaceFilter, toughnessFilter, sizeFilter, wildCardFilter, searchTerm, books, searchDeep, searchIndex, selectedRoleFilter, roleIndex]);

  // 2. Count of monsters for each initial letter
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    alphabetLetters.forEach(l => { counts[l] = 0; });
    baseFilteredMonsters.forEach(m => {
      const letter = getInitialLetter(m.name);
      counts[letter] = (counts[letter] || 0) + 1;
    });
    return counts;
  }, [baseFilteredMonsters, alphabetLetters]);

  // 3. Final displayed monsters (applying letter filter and sorting)
  const currentDisplayedMonsters = useMemo(() => {
    let list = baseFilteredMonsters;
    if (selectedLetter !== 'all') {
      list = list.filter(m => getInitialLetter(m.name) === selectedLetter);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'parry') return (Number(b.parry) || 0) - (Number(a.parry) || 0);
      if (sortBy === 'toughness-desc') return (parseInt(b.toughness, 10) || 0) - (parseInt(a.toughness, 10) || 0);
      if (sortBy === 'toughness-asc') return (parseInt(a.toughness, 10) || 0) - (parseInt(b.toughness, 10) || 0);
      if (sortBy === 'size') return (b.size ?? 0) - (a.size ?? 0);
      return 0;
    });
  }, [baseFilteredMonsters, selectedLetter, sortBy]);

  const pageSize = 40;
  const totalPages = Math.max(1, Math.ceil(currentDisplayedMonsters.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageMonsters = currentDisplayedMonsters.slice((safePage - 1) * pageSize, safePage * pageSize);
  useEffect(() => setPage(1), [searchTerm, searchDeep, selectedBook, activeTab, selectedLetter, selectedRaceFilter, selectedSourcebookFilter, wildCardFilter, toughnessFilter, sizeFilter, onlyFavoritesFilter, sortBy, selectedRoleFilter]);
  const changePage = (next: number) => {
    setPage(Math.max(1, Math.min(next, totalPages)));
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const activeFilterCount = [selectedRoleFilter !== 'all', selectedSourcebookFilter !== 'all', selectedRaceFilter !== 'all', selectedLetter !== 'all', wildCardFilter !== 'all', toughnessFilter !== 'all', sizeFilter !== 'all', onlyFavoritesFilter].filter(Boolean).length;
  const clearFilters = () => {
    setSelectedRoleFilter('all');
    setSearchTerm(''); setSelectedSourcebookFilter('all'); setSelectedRaceFilter('all');
    setSelectedLetter('all'); setWildCardFilter('all'); setToughnessFilter('all');
    setSizeFilter('all'); setOnlyFavoritesFilter(false);
  };

  // 4. Grouped by letter for alphabetical accordion mode
  const monstersGroupedByLetter = useMemo(() => {
    const map: Record<string, Monster[]> = {};
    alphabetLetters.forEach(l => { map[l] = []; });
    pageMonsters.forEach(m => {
      const l = getInitialLetter(m.name);
      if (!map[l]) map[l] = [];
      map[l].push(m);
    });
    return alphabetLetters
      .filter(letter => map[letter] && map[letter].length > 0)
      .map(letter => ({ letter, monsters: map[letter] }));
  }, [pageMonsters, alphabetLetters]);

  // 5. Grouped by race for category accordion mode
  const monstersGroupedByRace = useMemo(() => {
    const map: Record<string, Monster[]> = {};
    pageMonsters.forEach(m => {
      const race = m.race || 'Outros';
      if (!map[race]) map[race] = [];
      map[race].push(m);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([race, monsters]) => ({ race, monsters }));
  }, [pageMonsters]);

  // Print handler
  const handlePrintCollection = async (
    template: PdfTemplate,
    options: { theme: PdfTheme; onlyFavorites: boolean }
  ) => {
    const targetMonsters = options.onlyFavorites
      ? allMonsters.filter((m) => favoriteIds.includes(m.id))
      : currentDisplayedMonsters;

    if (targetMonsters.length === 0) {
      setShowPrintModal(false);
      return;
    }

    setIsPrinting(true);
    try {
      await generatePdf(targetMonsters, template, {
        theme: options.theme,
        hideSecrets: isPlayerView,
        fileName: options.onlyFavorites
          ? `bestiario-favoritos-${template}.pdf`
          : undefined,
      });
    } finally {
      setIsPrinting(false);
      setShowPrintModal(false);
    }
  };

  // If a monster detail is selected
  if (selectedMonster) {
    return (
      <>
        <MonsterDetail
          monster={selectedMonster}
          onBack={() => setSelectedMonster(null)}
          onEdit={onEditMonster}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          isFavorite={favoriteIds.includes(selectedMonster.id)}
          onToggleFavorite={handleToggleFavorite}
          onRoll={handleTriggerRoll}
          isPlayerView={isPlayerView}
        />
        <DiceRollerModal
          rollResult={activeRoll}
          onClose={() => setActiveRoll(null)}
          onReroll={(newRoll) => setActiveRoll(newRoll)}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Navigation Sub-Bar (Grimório / Compêndio / Mesa do Mestre) */}
      <div className="bg-stone-950/80 border border-stone-800/90 rounded-xl p-2 sm:p-3 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2.5 sm:gap-3 backdrop-blur-md max-w-full overflow-visible">
        
        {/* Tab Switcher */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
          <button aria-pressed={activeTab === 'books'}
            onClick={() => {
              setActiveTab('books');
              setSelectedBook(null);
            }}
            className={`px-2 sm:px-3 py-2 min-h-[42px] rounded-lg font-cinzel text-[11px] sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
              activeTab === 'books' && !selectedBook
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30'
                : 'bg-stone-900/60 sm:bg-transparent text-stone-300 hover:bg-stone-800 border border-stone-800/70 sm:border-0'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Por Tomos</span>
          </button>

          <button aria-pressed={activeTab === 'all'}
            onClick={() => {
              setActiveTab('all');
              setSelectedBook(null);
            }}
            className={`px-2 sm:px-3 py-2 min-h-[42px] rounded-lg font-cinzel text-[11px] sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30'
                : 'bg-stone-900/60 sm:bg-transparent text-stone-300 hover:bg-stone-800 border border-stone-800/70 sm:border-0'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Todos</span>
              <span className="hidden sm:inline">Compêndio Geral</span> ({allMonsters.length})
            </span>
          </button>

          <button aria-pressed={activeTab === 'favorites'}
            onClick={() => {
              setActiveTab('favorites');
              setSelectedBook(null);
            }}
            className={`px-2 sm:px-3 py-2 min-h-[42px] rounded-lg font-cinzel text-[11px] sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-md shadow-amber-500/30'
                : 'bg-stone-900/60 sm:bg-transparent text-stone-300 hover:bg-stone-800 border border-stone-800/70 sm:border-0'
            }`}
          >
            <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'favorites' ? 'fill-stone-950 text-stone-950' : 'fill-amber-400 text-amber-400'}`} />
            <span className="truncate">Favoritos ({favoriteIds.length})</span>
          </button>
        </div>

        <div className="catalog-actions flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportBackup} accept=".json" className="hidden" />
          <button type="button" onClick={showCreator} className="primary-action min-h-11 px-4 rounded-lg bg-amber-600 text-stone-950 font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Criar</button>
          <button type="button" onClick={() => setShowEncounterModal(true)} className="min-h-11 px-3 rounded-lg border border-stone-700 flex items-center justify-center gap-2"><Swords className="w-4 h-4" />Encontros</button>
          <details className="catalog-more relative" open={toolsExpanded} onToggle={event => setToolsExpanded(event.currentTarget.open)}>
            <summary className="min-h-11 px-3 rounded-lg border border-stone-700 cursor-pointer flex items-center justify-center gap-2">Mais <ChevronDown className="w-4 h-4" /></summary>
            <div className="catalog-more-panel absolute right-0 top-full mt-2 w-64 rounded-xl border border-stone-700 bg-stone-900 p-2 shadow-xl z-40 grid grid-cols-1 gap-1">
              <button type="button" onClick={() => { setToolsExpanded(false); setShowStorageModal(true); }}><Database className="w-4 h-4" />Backup e dados locais</button>
              <button type="button" onClick={() => { setToolsExpanded(false); setShowStatsModal(true); }}><PieChart className="w-4 h-4" />Estatísticas</button>
              <button type="button" onClick={() => { setToolsExpanded(false); setShowPrintModal(true); }}><Printer className="w-4 h-4" />Imprimir PDF</button>
              <button type="button" onClick={() => { setToolsExpanded(false); handleExportBackup(); }}><Download className="w-4 h-4" />Exportar backup JSON</button>
              <button type="button" onClick={() => { setToolsExpanded(false); fileInputRef.current?.click(); }}><Upload className="w-4 h-4" />Importar backup JSON</button>
            </div>
          </details>
        </div>
      </div>

      {/* Breadcrumb if inside a book */}
      {selectedBook && (
        <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-800">
          <button
            onClick={() => setSelectedBook(null)}
            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-cinzel text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Tomos da Biblioteca
          </button>
          <span className="font-cinzel text-amber-200 font-bold text-base">{selectedBook}</span>
        </div>
      )}

      {/* Search & Filter Controls (shown if in 'all', 'favorites', or inside a selected book) */}
      {(activeTab !== 'books' || selectedBook) && (
        <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80 space-y-3 max-w-full overflow-x-hidden">
          
          {/* Main Search and Core Selectors */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-12 gap-2">
            
            {/* Search Input with Web Speech API Voice Search */}
            <div className="sm:col-span-9 relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="search" enterKeyHint="search" autoComplete="off" spellCheck={false}
                style={{ paddingRight: searchTerm ? 88 : 48 }}
                placeholder="Buscar criatura..."
                aria-label="Buscar criatura"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-stone-900 border rounded-lg min-h-12 py-2 pl-9 pr-12 text-stone-200 text-base focus:ring-1 focus:ring-amber-500 transition-colors ${
                  isListening
                    ? 'border-red-500/80 shadow-sm shadow-red-900/30'
                    : 'border-stone-700 focus:border-amber-500'
                }`}
              />
              
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSpeechFeedback(null);
                    }}
                    className="min-w-10 min-h-11 flex items-center justify-center text-stone-500 hover:text-stone-300 transition-colors"
                    title="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Voice Search Button */}
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  className={`min-w-10 min-h-11 rounded-md transition-all flex items-center justify-center ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400 shadow-md shadow-red-600/50'
                      : 'text-stone-400 hover:text-amber-300 hover:bg-stone-800'
                  }`}
                  title={
                    isListening
                      ? 'Parar reconhecimento de voz'
                      : 'Buscar monstro por voz (diga o nome do monstro)'
                  }
                  aria-label="Buscar monstro por voz"
                >
                  {isListening ? (
                    <Mic className="w-4 h-4 animate-bounce" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button type="button" aria-expanded={filtersExpanded} aria-controls="advanced-filters"
              onClick={() => setFiltersExpanded(value => !value)} className="sm:col-span-3 min-h-11 px-4 rounded-lg border border-stone-700 text-sm font-semibold flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" /> Filtros {activeFilterCount > 0 && <span>({activeFilterCount})</span>}
            </button>
          </div>
          <div id="advanced-filters" hidden={!filtersExpanded}>
          <label className="block text-sm mb-3">Papel sugerido da criatura
            <select aria-label="Filtrar por papel sugerido" value={selectedRoleFilter} onChange={e=>setSelectedRoleFilter(e.target.value)} className="template-field">
              <option value="all">Todos os papéis</option>
              {CREATURE_FAMILIES.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              <option value="unclassified">Sem padrão seguro</option>
            </select>
          </label>
          <p className="text-xs text-stone-400 mb-3">Sugestão por habilidades e ataques; uma criatura pode ter vários papéis. As fichas originais permanecem intactas.</p>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Sourcebook Filter (if in All tab) */}
            {activeTab === 'all' && (
              <div className="sm:col-span-2">
                <select
                  aria-label="Filtrar por suplemento"
                  value={selectedSourcebookFilter}
                  onChange={(e) => setSelectedSourcebookFilter(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg py-2 px-3 text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="all">Todos Suplementos</option>
                  {books.map(([bookName]) => (
                    <option key={bookName} value={bookName}>
                      {bookName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Race Filter */}
            <div className={activeTab === 'all' ? 'sm:col-span-2' : 'sm:col-span-3'}>
              <select
                aria-label="Filtrar por raça"
                  value={selectedRaceFilter}
                onChange={(e) => setSelectedRaceFilter(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-2 px-3 text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">Todas as Raças</option>
                {availableRaces.map(race => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            </div>

            {/* Letter Filter (Dropdown) */}
            <div className={activeTab === 'all' ? 'sm:col-span-2' : 'sm:col-span-2'}>
              <select
                aria-label="Filtrar por letra"
                  value={selectedLetter}
                onChange={(e) => setSelectedLetter(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-2 px-3 text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">Letras (Todas A-Z)</option>
                {alphabetLetters.map(letter => {
                  const count = letterCounts[letter] || 0;
                  return (
                    <option key={letter} value={letter} disabled={count === 0}>
                      Letra {letter} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Wild Card vs Extra */}
            <div className={activeTab === 'all' ? 'sm:col-span-2' : 'sm:col-span-2'}>
              <select
                aria-label="Filtrar por tipo de criatura"
                  value={wildCardFilter}
                onChange={(e) => setWildCardFilter(e.target.value as any)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-2 px-3 text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">Todos os Tipos</option>
                <option value="wildcard">💀 Cartas Selvagens</option>
                <option value="extra">Extras (Capangas)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className={activeTab === 'all' ? 'sm:col-span-2' : 'sm:col-span-3'}>
              <select
                aria-label="Ordenar criaturas"
                  value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-2 px-3 text-stone-200 text-xs focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="name">Nome (A-Z)</option>
                <option value="name-desc">Nome (Z-A)</option>
                <option value="toughness-desc">Maior Resistência</option>
                <option value="toughness-asc">Menor Resistência</option>
                <option value="parry">Maior Aparar</option>
                <option value="size">Maior Tamanho</option>
              </select>
            </div>

          </div>

          {/* Speech Feedback Live Status Bar */}
          {speechFeedback && (
            <div
              className={`text-xs px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 border transition-all animate-fadeIn ${
                isListening
                  ? 'bg-amber-950/70 border-amber-600/70 text-amber-200'
                  : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {isListening ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{speechFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechFeedback(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Secondary Quick-Filter Controls & Chips Row */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 pt-2 border-t border-stone-800/80 text-xs">
            
            {/* Quick Chips (swipeable strip on mobile, wrapped on desktop) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap w-full sm:w-auto">
              <span className="text-[11px] text-stone-500 font-cinzel mr-1 shrink-0 hidden sm:inline">Filtros Rápidos:</span>

              {/* Only Favorites Filter Toggle */}
              {activeTab !== 'favorites' && (
                <button
                  onClick={() => setOnlyFavoritesFilter(f => !f)}
                  className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    onlyFavoritesFilter
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm shadow-amber-500/30 font-bold'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-amber-600/70 hover:text-amber-200'
                  }`}
                  title="Exibir apenas criaturas marcadas como favoritas"
                >
                  <Star className={`w-3 h-3 ${onlyFavoritesFilter ? 'fill-stone-950 text-stone-950' : 'fill-amber-400 text-amber-400'}`} />
                  <span>Favoritos ({favoriteIds.length})</span>
                </button>
              )}
              
              <button
                onClick={() => setWildCardFilter(f => f === 'wildcard' ? 'all' : 'wildcard')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  wildCardFilter === 'wildcard'
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                💀 Cartas Selvagens
              </button>

              <button
                onClick={() => setSelectedRaceFilter(r => r === 'Morto-Vivo' ? 'all' : 'Morto-Vivo')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedRaceFilter === 'Morto-Vivo'
                    ? 'bg-purple-950 text-purple-300 border-purple-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                🦇 Mortos-Vivos
              </button>

              <button
                onClick={() => setSelectedRaceFilter(r => r === 'Besta' ? 'all' : 'Besta')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedRaceFilter === 'Besta'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                🐺 Feras & Monstros
              </button>

              <button
                onClick={() => setSelectedSourcebookFilter(s => s === 'Lendas Brasileiras' ? 'all' : 'Lendas Brasileiras')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedSourcebookFilter === 'Lendas Brasileiras'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                🇧🇷 Folclore Brasileiro
              </button>

              <button
                onClick={() => setSelectedSourcebookFilter(s => s === 'Core Rules' ? 'all' : 'Core Rules')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedSourcebookFilter === 'Core Rules'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                📜 Básico SWADE
              </button>

              <button
                onClick={() => setSelectedSourcebookFilter(s => s === 'Compêndio de Fantasia' ? 'all' : 'Compêndio de Fantasia')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedSourcebookFilter === 'Compêndio de Fantasia'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                🏰 Fantasia
              </button>

              <button
                onClick={() => setSelectedSourcebookFilter(s => s === 'Compêndio de Horror' ? 'all' : 'Compêndio de Horror')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedSourcebookFilter === 'Compêndio de Horror'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                👁️ Horror
              </button>

              <button
                onClick={() => setSelectedSourcebookFilter(s => s === 'Deadlands: O Oeste Estranho' ? 'all' : 'Deadlands: O Oeste Estranho')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedSourcebookFilter === 'Deadlands: O Oeste Estranho'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                🤠 Deadlands
              </button>

              <button
                onClick={() => setSelectedSourcebookFilter(s => s === 'Pathfinder para Savage Worlds' ? 'all' : 'Pathfinder para Savage Worlds')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedSourcebookFilter === 'Pathfinder para Savage Worlds'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                🧙‍♂️ Pathfinder
              </button>

              <button
                onClick={() => setSelectedSourcebookFilter(s => s === 'Compêndio de Sci-Fi' ? 'all' : 'Compêndio de Sci-Fi')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedSourcebookFilter === 'Compêndio de Sci-Fi'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                🚀 Sci-Fi
              </button>

              <button
                onClick={() => setSelectedSourcebookFilter(s => s === 'Arte da Guerra (ADG)' ? 'all' : 'Arte da Guerra (ADG)')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  selectedSourcebookFilter === 'Arte da Guerra (ADG)'
                    ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                ⚔️ Arte da Guerra
              </button>

              <button
                onClick={() => setToughnessFilter(t => t === 'titanico' ? 'all' : 'titanico')}
                className={`px-3 py-1.5 min-h-[34px] rounded-full border text-[11px] transition-colors shrink-0 whitespace-nowrap ${
                  toughnessFilter === 'titanico'
                    ? 'bg-red-950 text-red-300 border-red-500'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                🛡️ Titânicos (12+)
              </button>
            </div>


          </div>

          <label className="flex items-center gap-3 py-3 text-sm">
            <input type="checkbox" checked={searchDeep} onChange={e => setSearchDeep(e.target.checked)} className="w-5 h-5" />
            Buscar também em perícias, habilidades e história
          </label>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm" role="status" aria-live="polite">
            <span>{currentDisplayedMonsters.length} {currentDisplayedMonsters.length === 1 ? 'criatura encontrada' : 'criaturas encontradas'}</span>
            {(activeFilterCount > 0 || searchTerm) && <button type="button" className="min-h-11 underline px-2" onClick={clearFilters}>Limpar filtros</button>}
          </div>
        </div>
      )}

      {/* ALPHABET RIBBON & DISPLAY MODE CONTROLS (shown when viewing monsters) */}
      {(activeTab !== 'books' || selectedBook) && (
        <div className="space-y-3">
          
          {/* Alphabet Ribbon (A-Z Fast Scroller) */}
          <details className="alphabet-disclosure">
            <summary className="min-h-11 cursor-pointer text-sm flex items-center gap-2"><ChevronDown className="w-4 h-4" />Navegar por letra {selectedLetter !== 'all' ? `· ${selectedLetter}` : '(A–Z)'}</summary>
          <div className="bg-stone-950/70 border border-stone-800/90 rounded-xl p-2.5 backdrop-blur-sm max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Navegação Alfabética Rápida (A-Z)
                </span>
                {selectedLetter !== 'all' && (
                  <span className="bg-amber-950 text-amber-300 border border-amber-600/50 text-[10px] px-2 py-0.5 rounded-full font-mono">
                    Filtro ativo: Letra {selectedLetter} ({currentDisplayedMonsters.length})
                  </span>
                )}
              </div>

              {selectedLetter !== 'all' && (
                <button
                  onClick={() => setSelectedLetter('all')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Ver Todas as Letras
                </button>
              )}
            </div>

            {/* Scrollable Ribbon */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-800 max-w-full min-w-0">
              <button
                onClick={() => setSelectedLetter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedLetter === 'all'
                    ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30'
                    : 'bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-amber-200 border border-stone-800'
                }`}
              >
                <span>Todas</span>
                <span className="text-[10px] opacity-80">({baseFilteredMonsters.length})</span>
              </button>

              <div className="w-px h-5 bg-stone-800 mx-1 shrink-0" />

              {alphabetLetters.map((letter) => {
                const count = letterCounts[letter] || 0;
                const isSelected = selectedLetter === letter;
                const hasMonsters = count > 0;

                return (
                  <button
                    key={letter}
                    disabled={!hasMonsters}
                    onClick={() => {
                      setSelectedLetter(letter);
                      // If collapsed, expand this letter automatically
                      if (collapsedLetters.has(letter)) {
                        toggleCollapseLetter(letter);
                      }
                    }}
                    title={hasMonsters ? `Letra ${letter}: ${count} monstro(s)` : `Nenhum monstro na letra ${letter}`}
                    className={`min-w-[34px] h-8 px-1.5 rounded-lg font-cinzel text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/40 ring-2 ring-amber-400 font-black'
                        : hasMonsters
                        ? 'bg-stone-900 text-stone-200 hover:bg-amber-950 hover:text-amber-300 border border-stone-800 hover:border-amber-700/60'
                        : 'bg-stone-950/40 text-stone-700 border border-stone-900/50 cursor-not-allowed opacity-40'
                    }`}
                  >
                    <span className="leading-none">{letter}</span>
                    {hasMonsters && (
                      <span className={`text-[8px] leading-none mt-0.5 ${isSelected ? 'text-stone-900 font-bold' : 'text-stone-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          </details>
          {/* View Mode Bar & Accordion Controls */}
          <div className="bg-stone-950/80 border border-stone-800/90 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5 max-w-full overflow-x-hidden">
            
            <label className="sm:hidden flex items-center justify-between gap-3 w-full text-sm">Exibição
              <select aria-label="Modo de exibição" value={displayMode} onChange={event => setDisplayMode(event.target.value as DisplayMode)} className="min-h-11 flex-1 min-w-0 rounded-lg border border-stone-700 bg-stone-900 px-3"><option value="table">Lista compacta</option><option value="cards">Cartões</option><option value="alphabetical">Índice A–Z</option><option value="by-race">Por raça</option></select>
            </label>
            {/* View Mode Buttons */}
            <div className="view-modes hidden sm:flex flex-wrap items-center gap-1.5 max-w-full w-full sm:w-auto">
              <span className="text-xs text-stone-500 font-cinzel mr-1 hidden sm:inline shrink-0">Exibição:</span>

              <button
                aria-pressed={displayMode === 'alphabetical'} onClick={() => setDisplayMode('alphabetical')}
                className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                  displayMode === 'alphabetical'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-sm'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
                title="Agrupado alfabeticamente em seções expansíveis (Sanfona)"
              >
                <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                <span>Índice A-Z</span>
              </button>

              <button
                aria-pressed={displayMode === 'cards'} onClick={() => setDisplayMode('cards')}
                className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                  displayMode === 'cards'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-sm'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
                title="Galeria visual de cartões com ilustrações"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                <span>Cartões</span>
              </button>

              <button
                aria-pressed={displayMode === 'table'} onClick={() => setDisplayMode('table')}
                className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                  displayMode === 'table'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-sm'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
                title="Lista compacta tática para leitura rápida de atributos e combate"
              >
                <Table className="w-3.5 h-3.5 text-amber-400" />
                <span>Lista Compacta</span>
              </button>

              <button
                aria-pressed={displayMode === 'by-race'} onClick={() => setDisplayMode('by-race')}
                className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                  displayMode === 'by-race'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-sm'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
                title="Agrupado por Raça/Categoria (Morto-Vivo, Fera, Humanoide, etc)"
              >
                <List className="w-3.5 h-3.5 text-amber-400" />
                <span>Por Raça</span>
              </button>
            </div>

            {/* Accordion Expand/Collapse All (only visible in grouped modes) */}
            {(displayMode === 'alphabetical' || displayMode === 'by-race') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAllGroups}
                  className="px-2.5 py-1.5 min-h-[36px] bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-300 border border-stone-800 rounded-lg text-xs font-cinzel transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span>Expandir Todos</span>
                </button>
                <button
                  onClick={collapseAllGroups}
                  className="px-2.5 py-1.5 min-h-[36px] bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-amber-300 border border-stone-800 rounded-lg text-xs font-cinzel transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span>Recolher Todos</span>
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {activeTab === 'books' && !selectedBook && (
        <section className="home-search rounded-2xl border border-stone-700 p-5 sm:p-7 space-y-4" aria-label="Busca rápida">
          <div><p className="text-xs tracking-widest uppercase text-stone-400">Pronto para a próxima sessão</p>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-amber-200 mt-2">Encontre sua próxima criatura</h2>
            <p className="text-sm text-stone-400 mt-2">{allMonsters.length.toLocaleString('pt-BR')} fichas e referências · {books.length} tomos · favoritos e criações neste aparelho.</p>
          </div>
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); clearFilters(); setSearchTerm(homeSearch); setActiveTab('all'); window.scrollTo({ top: 0, behavior: 'instant' }); }}>
            <input type="search" enterKeyHint="search" aria-label="Buscar em todos os livros" placeholder="Nome da criatura, sem precisar de acentos" value={homeSearch} onChange={e => setHomeSearch(e.target.value)} className="min-w-0 flex-1 min-h-12 rounded-lg border border-stone-700 bg-stone-900 px-3 text-base" />
            <button type="submit" aria-label="Buscar criaturas" className="min-h-12 px-4 rounded-lg bg-amber-600 text-stone-950 font-semibold flex items-center gap-2"><Search className="w-4 h-4" /><span className="hidden sm:inline">Buscar</span></button>
          </form>
          {recentIds.some(id => allMonsters.some(m => m.id === id)) && <div>
            <h3 className="text-xs font-semibold text-stone-400 mb-2">Consultados recentemente</h3>
            <div className="flex flex-wrap gap-2">{recentIds.map(id => allMonsters.find(m => m.id === id)).filter((m): m is Monster => Boolean(m)).map(m => <button type="button" key={m.id} onClick={() => openMonster(m)} className="min-h-11 text-sm px-3 py-2 border border-stone-700 rounded-lg">{m.name}</button>)}</div>
          </div>}
        </section>
      )}

      {/* VIEW 1: Library of Books View (Grimório por Tomos) */}
      {activeTab === 'books' && !selectedBook && (
        <div className="space-y-5 sm:space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5 sm:space-y-2 px-1">
            <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-amber-200 tracking-wide">
              Biblioteca de Tomos & Cenários
            </h2>
            <p className="text-stone-400 font-crimson text-sm sm:text-base italic">
              Escolha um tomo para desvendar as monstruosidades e lendas catalogadas para Savage Worlds.
            </p>
          </div>

          <div className="book-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {books.map(([title, monstersInThisBook]) => (
              <button
                type="button"
                key={title}
                onClick={() => { setSelectedBook(title); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className="book-tile text-left bg-stone-900 border border-stone-800 hover:border-amber-600/80 rounded-xl p-6 shadow-xl flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-amber-900/20 ring-1 ring-amber-500/10 relative overflow-hidden"
              >
                {/* Book spine decorative accent */}
                <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-amber-800/80 border-r border-amber-900/60" />

                <div className="pl-3">
                  <div className="p-3 bg-stone-800 w-fit rounded-lg text-amber-400 group-hover:text-amber-300 transition-colors border border-stone-700">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-amber-200 group-hover:text-amber-300 mt-4 leading-snug">
                    {title}
                  </h3>
                  <p className="text-xs text-stone-400 mt-2 font-crimson italic">
                    Suplemento com {monstersInThisBook.length} criatura{monstersInThisBook.length === 1 ? '' : 's'}.
                  </p>
                </div>

                <div className="pl-3 mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                  <span className="font-mono-dice text-amber-400 font-bold">{monstersInThisBook.length} {monstersInThisBook.length === 1 ? 'criatura' : 'criaturas'}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-amber-500 font-bold">Abrir →</span>
                </div>
              </button>
            ))}

            {/* Create Monster Quick Card */}
            <button type="button"
              onClick={showCreator}
              className="border-2 border-dashed border-stone-800 hover:border-amber-600/80 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-all hover:bg-stone-800/50"
            >
              <div className="p-4 bg-stone-900 rounded-full text-stone-500 group-hover:text-amber-400 border border-stone-800 group-hover:border-amber-600 transition-colors">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="font-cinzel text-lg font-bold text-stone-300 group-hover:text-amber-300 mt-4">
                Criar Nova Lenda
              </h3>
              <p className="text-xs text-stone-500 mt-1">Forje seu monstro personalizado com suporte a IA</p>
            </button>
          </div>
        </div>
      )}

      {(activeTab !== 'books' || selectedBook) && currentDisplayedMonsters.length > 0 && (
        <div ref={resultsRef} className="catalog-pagebar flex flex-wrap items-center justify-between gap-3 scroll-mt-24">
          <p className="text-sm text-stone-400">Mostrando {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, currentDisplayedMonsters.length)} de {currentDisplayedMonsters.length}</p>
          <div className="flex items-center gap-2"><button type="button" disabled={safePage === 1} onClick={() => changePage(safePage - 1)} className="min-h-11 px-3 rounded-lg border border-stone-700">Anterior</button><span className="text-xs">{safePage} / {totalPages}</span><button type="button" disabled={safePage === totalPages} onClick={() => changePage(safePage + 1)} className="min-h-11 px-3 rounded-lg border border-stone-700">Próxima</button></div>
        </div>
      )}

      {/* VIEW 2 & 3: Monster Browsing (Alphabetical Accordion, Grid Cards, Tactical Table, or By-Race) */}
      {(activeTab !== 'books' || selectedBook) && (
        <div>
          {currentDisplayedMonsters.length > 0 ? (
            <div>
              {/* MODE 1: Alphabetical Accordions (Índice A-Z) */}
              {displayMode === 'alphabetical' && (
                <div className="space-y-4">
                  {monstersGroupedByLetter.map(({ letter, monsters: groupMonsters }) => {
                    const isCollapsed = collapsedLetters.has(letter);

                    return (
                      <div key={letter} className="space-y-3">
                        {/* Alphabet Group Header Accordion Trigger */}
                        <div
                          role="button" tabIndex={0} aria-expanded={!isCollapsed}
                          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleCollapseLetter(letter); } }}
                          onClick={() => toggleCollapseLetter(letter)}
                          className="flex items-center justify-between bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-amber-700/60 rounded-xl p-3 sm:px-4 cursor-pointer shadow-md transition-all group select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-600/60 flex items-center justify-center font-cinzel font-black text-xl text-amber-300 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                              {letter}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-cinzel text-base font-bold text-amber-200 group-hover:text-amber-300">
                                  Letra {letter}
                                </h3>
                                <span className="text-[11px] font-mono-dice bg-stone-950 text-amber-400 px-2 py-0.5 rounded-full border border-stone-800">
                                  {groupMonsters.length} {groupMonsters.length === 1 ? 'criatura' : 'criaturas'}
                                </span>
                              </div>
                              <p className="text-xs text-stone-400 italic truncate max-w-sm sm:max-w-xl font-crimson">
                                {groupMonsters.map(m => m.name).slice(0, 6).join(', ')}{groupMonsters.length > 6 ? '...' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-amber-300 shrink-0">
                            <span className="text-xs hidden sm:inline font-cinzel">{isCollapsed ? 'Expandir' : 'Recolher'}</span>
                            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>

                        {/* Monsters under this letter */}
                        {!isCollapsed && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-1 pl-2 sm:pl-3 border-l-2 border-amber-900/30 ml-2">
                            {groupMonsters.map((monster) => (
                              <MonsterCardItem
                                key={monster.id}
                                monster={monster}
                                isFav={favoriteIds.includes(monster.id)}
                                onToggleFav={handleToggleFavorite}
                                onSelect={openMonster}
                                onRoll={handleTriggerRoll}
                                onCopyDiscord={handleCopyDiscordQuick}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODE 2: Visual Grid Cards */}
              {displayMode === 'cards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {pageMonsters.map((monster) => (
                    <MonsterCardItem
                      key={monster.id}
                      monster={monster}
                      isFav={favoriteIds.includes(monster.id)}
                      onToggleFav={handleToggleFavorite}
                      onSelect={openMonster}
                      onRoll={handleTriggerRoll}
                      onCopyDiscord={handleCopyDiscordQuick}
                    />
                  ))}
                </div>
              )}

              {/* MODE 3: Compact Tactical Table (Great for scanning hundreds of monsters!) */}
              {displayMode === 'table' && (
                <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xl">
                  <p className="text-sm text-stone-400 border-b border-stone-800 px-4 py-3">Toque na criatura para abrir a ficha. A estrela guarda seus favoritos.</p>
                  <div className="divide-y divide-stone-800/80">
                    {pageMonsters.map((monster) => (
                      <MonsterRowItem
                        key={monster.id}
                        monster={monster}
                        isFav={favoriteIds.includes(monster.id)}
                        onToggleFav={handleToggleFavorite}
                        onSelect={openMonster}
                        onRoll={handleTriggerRoll}
                        onCopyDiscord={handleCopyDiscordQuick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* MODE 4: Grouped by Race / Category (Sanfona por Raça) */}
              {displayMode === 'by-race' && (
                <div className="space-y-4">
                  {monstersGroupedByRace.map(({ race, monsters: groupMonsters }) => {
                    const isCollapsed = collapsedRaces.has(race);

                    return (
                      <div key={race} className="space-y-3">
                        {/* Race Group Header Accordion Trigger */}
                        <div
                          role="button" tabIndex={0} aria-expanded={!isCollapsed}
                          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleCollapseRace(race); } }}
                          onClick={() => toggleCollapseRace(race)}
                          className="flex items-center justify-between bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-amber-700/60 rounded-xl p-3 sm:px-4 cursor-pointer shadow-md transition-all group select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-stone-950 border border-amber-800/50 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                              <FolderTree className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-cinzel text-base font-bold text-amber-200 group-hover:text-amber-300">
                                  {race}
                                </h3>
                                <span className="text-[11px] font-mono-dice bg-stone-950 text-amber-400 px-2 py-0.5 rounded-full border border-stone-800">
                                  {groupMonsters.length} {groupMonsters.length === 1 ? 'criatura' : 'criaturas'}
                                </span>
                              </div>
                              <p className="text-xs text-stone-400 italic truncate max-w-sm sm:max-w-xl font-crimson">
                                {groupMonsters.map(m => m.name).slice(0, 6).join(', ')}{groupMonsters.length > 6 ? '...' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-amber-300 shrink-0">
                            <span className="text-xs hidden sm:inline font-cinzel">{isCollapsed ? 'Expandir' : 'Recolher'}</span>
                            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>

                        {/* Monsters under this race */}
                        {!isCollapsed && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-1 pl-2 sm:pl-3 border-l-2 border-amber-900/30 ml-2">
                            {groupMonsters.map((monster) => (
                              <MonsterCardItem
                                key={monster.id}
                                monster={monster}
                                isFav={favoriteIds.includes(monster.id)}
                                onToggleFav={handleToggleFavorite}
                                onSelect={openMonster}
                                onRoll={handleTriggerRoll}
                                onCopyDiscord={handleCopyDiscordQuick}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-20 bg-stone-950/40 rounded-xl border border-stone-800 p-8">
              {activeTab === 'favorites' && favoriteIds.length === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-600/40 flex items-center justify-center mx-auto mb-3 text-amber-400">
                    <Star className="w-8 h-8 fill-amber-400/20 text-amber-400" />
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-amber-200">Nenhuma Criatura Favoritada</h3>
                  <p className="text-stone-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                    Você ainda não favoritou nenhum monstro. Clique na estrela (⭐) presente em qualquer cartão ou ficha para fixá-lo aqui e acessá-lo instantaneamente durante a sessão!
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('all');
                      setSelectedBook(null);
                    }}
                    className="mt-5 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 text-xs font-cinzel font-bold rounded-xl transition-all shadow-md"
                  >
                    Explorar Compêndio Geral
                  </button>
                </>
              ) : (
                <>
                  <BookOpen className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <h3 className="font-cinzel text-xl font-bold text-stone-400">Nenhum Monstro Encontrado</h3>
                  <p className="text-stone-500 text-sm mt-1 max-w-sm mx-auto">
                    {onlyFavoritesFilter 
                      ? 'Nenhuma criatura favorita coincide com os filtros atuais.'
                      : 'Tente ajustar seus termos de busca, a letra selecionada ou os filtros de suplemento e Carta Selvagem.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSourcebookFilter('all');
                      setSelectedRaceFilter('all');
                      setSelectedLetter('all');
                      setWildCardFilter('all');
                      setToughnessFilter('all');
                      setSizeFilter('all');
                      setOnlyFavoritesFilter(false);
                    }}
                    className="mt-4 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-cinzel rounded-lg transition-colors"
                  >
                    Limpar Todos os Filtros
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Print PDF Modal */}
      {(activeTab !== 'books' || selectedBook) && totalPages > 1 && <nav aria-label="Paginação do catálogo" className="flex justify-center gap-3 py-4"><button type="button" disabled={safePage === 1} onClick={() => changePage(safePage - 1)} className="min-h-12 px-5 border border-stone-700 rounded-lg">Página anterior</button><button type="button" disabled={safePage === totalPages} onClick={() => changePage(safePage + 1)} className="min-h-12 px-5 border border-stone-700 rounded-lg">Próxima página</button></nav>}

      <PrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onPrint={handlePrintCollection}
        isPrinting={isPrinting}
        totalMonsters={currentDisplayedMonsters.length}
        favoriteCount={favoriteIds.length}
      />

      {/* SWADE Encounter Builder Modal */}
      <EncounterBuilderModal
        isOpen={showEncounterModal}
        onClose={() => setShowEncounterModal(false)}
        allMonsters={allMonsters}
        onSelectMonster={(monster) => {
          openMonster(monster);
          setShowEncounterModal(false);
        }}
        onAddToFavorites={(ids) => {
          handleAddEncounterToSession(ids);
          notify(`${ids.length} criaturas adicionadas aos seus Favoritos!`);
        }}
      />

      {/* D3 Monster Distribution Stats Modal */}
      <MonsterStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        monsters={allMonsters}
        onApplyRaceFilter={(race) => {
          setActiveTab('all');
          setSelectedBook(null);
          setSelectedRaceFilter(race);
        }}
      />

      {/* Local Storage & Offline Database Manager Modal */}
      <LocalStorageManagerModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        onDatabaseChanged={(updatedMonsters) => {
          setMonstersList(updatedMonsters);
          setFavoriteIds(getFavoriteMonsterIds());
        }}
      />

      {/* Global Interactive Dice Roller Modal */}
      <DiceRollerModal
        rollResult={activeRoll}
        onClose={() => setActiveRoll(null)}
        onReroll={(newRoll) => setActiveRoll(newRoll)}
      />

    </div>
  );
};

export default Bestiary;
