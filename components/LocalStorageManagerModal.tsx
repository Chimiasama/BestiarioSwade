import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  X, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Star,
  FileCode
} from 'lucide-react';
import { 
  getStorageMetrics, 
  exportFullDatabaseAsJson, 
  importFullDatabaseFromJson, 
  resetDatabaseToDefaults,
  StorageMetrics 
} from '../services/customMonsterService';
import { Monster } from '../types';

interface LocalStorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatabaseChanged: (newMonsters: Monster[]) => void;
}

export const LocalStorageManagerModal: React.FC<LocalStorageManagerModalProps> = ({
  isOpen,
  onClose,
  onDatabaseChanged,
}) => {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [keepCustomOnReset, setKeepCustomOnReset] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshMetrics = () => {
    setMetrics(getStorageMetrics());
  };

  useEffect(() => {
    if (isOpen) {
      refreshMetrics();
      setImportNotice(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportFullDatabaseAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bestiario-swade-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setImportNotice({
      type: 'success',
      text: 'Backup completo do banco de dados local exportado com sucesso!'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importFullDatabaseFromJson(content, 'merge');
      if (res.success) {
        setImportNotice({ type: 'success', text: res.message });
        refreshMetrics();
        // Notify parent of updated database
        const updated = resetDatabaseToDefaults(true);
        onDatabaseChanged(updated);
      } else {
        setImportNotice({ type: 'error', text: res.message });
      }
    };
    reader.onerror = () => {
      setImportNotice({ type: 'error', text: 'Falha ao ler o arquivo JSON selecionado.' });
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleReset = () => {
    const confirmMsg = keepCustomOnReset
      ? "Deseja restaurar as fichas originais padrão do compêndio? Suas criações próprias serão MANTIDAS."
      : "ATENÇÃO: Deseja redefinir todo o banco de dados para os valores de fábrica? TODAS as alterações e criações serão substituídas.";

    if (window.confirm(confirmMsg)) {
      const freshList = resetDatabaseToDefaults(keepCustomOnReset);
      onDatabaseChanged(freshList);
      refreshMetrics();
      setIsResetting(false);
      setImportNotice({
        type: 'success',
        text: keepCustomOnReset
          ? 'Banco de dados restaurado com sucesso (suas criações foram preservadas)!'
          : 'Banco de dados restaurado aos padrões originais de fábrica!'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-stone-950 border border-amber-600/50 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl shadow-amber-950/50 relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/80 border border-amber-600/60 rounded-xl text-amber-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-amber-200">
                  Gerenciador de Banco Local (Offline)
                </h2>
              </div>
              <p className="text-xs text-stone-400 font-crimson">
                Armazenamento 100% persistente no navegador via localStorage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Real-time Status Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Storage Status */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-600/50 text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-cinzel text-stone-400 uppercase tracking-wider block">
                  Persistência Local
                </span>
                <span className="font-cinzel font-bold text-sm text-emerald-300 block">
                  Ativa e Operacional
                </span>
                <span className="text-xs text-stone-400 leading-tight block mt-0.5">
                  Tudo é salvo no <code>localStorage</code> do seu navegador.
                </span>
              </div>
            </div>

            {/* Network Offline/Online Status */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                isOnline
                  ? 'bg-blue-950/70 border-blue-600/50 text-blue-400'
                  : 'bg-amber-950/70 border-amber-600/50 text-amber-400'
              }`}>
                {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[11px] font-cinzel text-stone-400 uppercase tracking-wider block">
                  Conexão com a Internet
                </span>
                <span className="font-cinzel font-bold text-sm text-stone-200 block">
                  {isOnline ? 'Online (Conectado)' : 'Modo Offline (Sem Internet)'}
                </span>
                <span className="text-xs text-stone-400 leading-tight block mt-0.5">
                  {isOnline 
                    ? 'O app funciona sem conexão e continuará disponível se a rede cair.'
                    : 'Você pode consultar, criar e gerenciar criaturas normalmente!'}
                </span>
              </div>
            </div>
          </div>

          {/* Database Metrics Grid */}
          {metrics && (
            <div className="bg-stone-900/60 border border-stone-800/90 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Métricas do Banco no Dispositivo
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  Última gravação: {metrics.lastUpdated}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 text-center">
                  <div className="text-[10px] font-cinzel text-stone-400 uppercase">Total de Monstros</div>
                  <div className="font-cinzel font-bold text-lg text-amber-300">{metrics.totalCount}</div>
                </div>

                <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 text-center">
                  <div className="text-[10px] font-cinzel text-stone-400 uppercase">Criações Próprias</div>
                  <div className="font-cinzel font-bold text-lg text-emerald-300">{metrics.customCount}</div>
                </div>

                <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 text-center">
                  <div className="text-[10px] font-cinzel text-stone-400 uppercase">Favoritos Marcados</div>
                  <div className="font-cinzel font-bold text-lg text-amber-400">{metrics.favoritesCount}</div>
                </div>

                <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 text-center">
                  <div className="text-[10px] font-cinzel text-stone-400 uppercase">Espaço Ocupado</div>
                  <div className="font-cinzel font-bold text-lg text-stone-300">{metrics.formattedSize}</div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Notice */}
          {importNotice && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              importNotice.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-200'
                : 'bg-red-950/60 border-red-600/50 text-red-200'
            }`}>
              {importNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{importNotice.text}</span>
            </div>
          )}

          {/* Backup and Sync Actions */}
          <div className="space-y-2">
            <span className="text-xs font-cinzel font-bold text-stone-300 block">
              Ações de Backup & Sincronização Local
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Export Full Backup */}
              <button
                onClick={handleExport}
                className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/60 rounded-xl text-left transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-600/40 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-cinzel font-bold text-xs text-stone-200 group-hover:text-amber-300 transition-colors block">
                    Exportar Backup Completo
                  </span>
                  <span className="text-[11px] text-stone-400 leading-tight block mt-0.5">
                    Gera um arquivo <code>.json</code> com todas as fichas e favoritos para salvar ou levar a outro aparelho.
                  </span>
                </div>
              </button>

              {/* Import Full Backup */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-600/60 rounded-xl text-left transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-cinzel font-bold text-xs text-stone-200 group-hover:text-emerald-300 transition-colors block">
                    Importar / Mesclar Backup
                  </span>
                  <span className="text-[11px] text-stone-400 leading-tight block mt-0.5">
                    Importa fichas de arquivo JSON adicionando ou atualizando no banco local sem perder dados.
                  </span>
                </div>
              </button>
            </div>

            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Reset or Repair Database */}
          <div className="bg-stone-900/40 border border-stone-800/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-cinzel font-bold text-stone-300 block">
                  Restaurar Banco de Dados
                </span>
                <span className="text-[11px] text-stone-400 block">
                  Restaura todas as criaturas oficiais da biblioteca SWADE caso tenha editado ou excluído.
                </span>
              </div>
              <button
                onClick={() => setIsResetting(!isResetting)}
                className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-cinzel transition-colors"
              >
                Opções
              </button>
            </div>

            {isResetting && (
              <div className="pt-2 border-t border-stone-800 space-y-2.5 animate-fadeIn">
                <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepCustomOnReset}
                    onChange={(e) => setKeepCustomOnReset(e.target.checked)}
                    className="rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Preservar minhas criaturas criadas pelo usuário (Recomendado)</span>
                </label>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleReset}
                    className="px-4 py-1.5 bg-red-900/80 hover:bg-red-800 border border-red-700 text-red-100 rounded-lg text-xs font-cinzel font-bold transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Confirmar Restauração
                  </button>
                  <button
                    onClick={() => setIsResetting(false)}
                    className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500 font-crimson hidden sm:inline">
            Pronto para uso offline em qualquer sessão de jogo
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-cinzel font-bold text-xs rounded-xl shadow-md transition-all ml-auto"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
