import React, { useState, useMemo, useEffect } from 'react';
import { Monster, MonsterRank } from '../types';
import {
  Swords,
  X,
  Users,
  Shield,
  Skull,
  Sparkles,
  RefreshCw,
  Plus,
  Star,
  CheckCircle2,
  Dice5,
  Flame,
  Save,
  Bookmark,
  Trash2,
  FolderPlus
} from 'lucide-react';

interface EncounterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMonsters: Monster[];
  onAddEncounterToSession: (monsterIds: string[]) => void;
  onSelectMonster: (monster: Monster) => void;
}

type EncounterDifficulty = 'escaramuca' | 'padrao' | 'desafiador' | 'chefe' | 'horda';

export interface SavedEncounter {
  id: string;
  name: string;
  date: string;
  monsters: { monsterId: string; count: number; role: string }[];
  notes?: string;
}

const SAVED_ENCOUNTERS_KEY = 'swade_saved_campaign_encounters';

export const EncounterBuilderModal: React.FC<EncounterBuilderModalProps> = ({
  isOpen,
  onClose,
  allMonsters,
  onAddEncounterToSession,
  onSelectMonster,
}) => {
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [partyRank, setPartyRank] = useState<MonsterRank>('Novato');
  const [difficulty, setDifficulty] = useState<EncounterDifficulty>('padrao');
  const [environmentTheme, setEnvironmentTheme] = useState<string>('todos');
  const [seed, setSeed] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);

  // Saved Campaign Encounters State
  const [savedEncounters, setSavedEncounters] = useState<SavedEncounter[]>([]);
  const [activeTab, setActiveTab] = useState<'generator' | 'saved'>('generator');
  const [newEncounterName, setNewEncounterName] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_ENCOUNTERS_KEY);
      if (stored) {
        setSavedEncounters(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveEncountersToStorage = (updated: SavedEncounter[]) => {
    setSavedEncounters(updated);
    try {
      localStorage.setItem(SAVED_ENCOUNTERS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Filter pool by environment theme if specified
  const eligibleMonsters = useMemo(() => {
    let pool = allMonsters;
    if (environmentTheme === 'lendas') {
      pool = pool.filter(m => m.sourcebook === 'Lendas Brasileiras');
    } else if (environmentTheme === 'mortos') {
      pool = pool.filter(m => m.race === 'Morto-Vivo' || m.archetype.toLowerCase().includes('fantasma') || m.archetype.toLowerCase().includes('espírito'));
    } else if (environmentTheme === 'feras') {
      pool = pool.filter(m => m.race === 'Besta' || m.race === 'Criptídeo' || m.archetype.toLowerCase().includes('lobo') || m.archetype.toLowerCase().includes('aranha'));
    } else if (environmentTheme === 'humanoides') {
      pool = pool.filter(m => m.race === 'Humano' || m.race === 'Goblinóide' || m.race === 'Humanoide');
    }
    return pool.length > 0 ? pool : allMonsters;
  }, [allMonsters, environmentTheme]);

  // Generate encounter composition based on SWADE math
  const generatedEncounter = useMemo(() => {
    // Seed dependence for rerolls
    const random = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const extrasPool = eligibleMonsters.filter(m => !m.isWildCard);
    const wildCardPool = eligibleMonsters.filter(m => m.isWildCard);

    // Fallback if pools are somehow empty
    const safeExtras = extrasPool.length > 0 ? extrasPool : eligibleMonsters;
    const safeWildCards = wildCardPool.length > 0 ? wildCardPool : eligibleMonsters;

    interface EncounterEntry {
      monster: Monster;
      count: number;
      role: 'Chefe' | 'Tenente' | 'Capangas' | 'Tropa de Choque' | 'Batedores';
    }

    const entries: EncounterEntry[] = [];

    // SWADE Encounter logic
    if (difficulty === 'escaramuca') {
      // 1 Extra per player, or 1 weak Wild Card
      const extra = safeExtras[Math.floor(random(1) * safeExtras.length)];
      const count = Math.max(1, playerCount - 1);
      entries.push({ monster: extra, count, role: 'Batedores' });
    } else if (difficulty === 'padrao') {
      // 1 to 2 Extras per player
      const extra1 = safeExtras[Math.floor(random(2) * safeExtras.length)];
      entries.push({ monster: extra1, count: playerCount, role: 'Capangas' });
      if (playerCount >= 4 && safeExtras.length > 1) {
        const extra2 = safeExtras.find(m => m.id !== extra1.id) || extra1;
        entries.push({ monster: extra2, count: 2, role: 'Tropa de Choque' });
      }
    } else if (difficulty === 'desafiador') {
      // 1 Wild Card Lieutenant + Extras equal to players
      const lieutenant = safeWildCards[Math.floor(random(3) * safeWildCards.length)];
      const minions = safeExtras[Math.floor(random(4) * safeExtras.length)];
      entries.push({ monster: lieutenant, count: 1, role: 'Tenente' });
      entries.push({ monster: minions, count: playerCount, role: 'Capangas' });
    } else if (difficulty === 'chefe') {
      // 1 Major Wild Card Boss + Minions/Bodyguards
      const boss = safeWildCards[Math.floor(random(5) * safeWildCards.length)];
      const bodyguards = safeExtras[Math.floor(random(6) * safeExtras.length)];
      entries.push({ monster: boss, count: 1, role: 'Chefe' });
      entries.push({ monster: bodyguards, count: Math.max(2, playerCount - 1), role: 'Capangas' });
    } else if (difficulty === 'horda') {
      // Swarm of weak extras (2 to 3 per player)
      const swarmMonster = safeExtras.find(m => m.id === 'sw-2' || m.id === 'ext-1' || m.id === 'sw-3') || safeExtras[Math.floor(random(7) * safeExtras.length)];
      entries.push({ monster: swarmMonster, count: playerCount * 2, role: 'Capangas' });
    }

    return entries;
  }, [eligibleMonsters, difficulty, playerCount, partyRank, seed]);

  if (!isOpen) return null;

  const handleAddToSession = () => {
    const idsToAdd: string[] = [];
    generatedEncounter.forEach(entry => {
      idsToAdd.push(entry.monster.id);
    });
    onAddEncounterToSession(idsToAdd);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-950 border border-amber-900/60 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-amber-500/20">
        
        {/* Modal Header */}
        <div className="bg-stone-900/90 border-b border-stone-800 p-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-950/80 border border-red-800/80 rounded-lg text-red-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-xl font-bold text-amber-200">Gerador & Banco de Encontros SWADE</h2>
              <p className="text-xs text-stone-400">Balanceamento e preparação de batalhas para a campanha</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all ${
                activeTab === 'generator'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 border border-stone-800'
              }`}
            >
              Gerar Encontro
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 border border-stone-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Salvos ({savedEncounters.length})</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Configuration & Results */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-stone-200">
          
          {/* Controls Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-stone-900/60 p-4 rounded-xl border border-stone-800/80">
            
            {/* Player Count */}
            <div>
              <label className="block text-xs font-cinzel uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                Jogadores ({playerCount})
              </label>
              <div className="flex items-center gap-1">
                {[2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    onClick={() => setPlayerCount(num)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded border transition-colors ${
                      playerCount === num
                        ? 'bg-amber-600 text-stone-950 border-amber-500'
                        : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Party Rank */}
            <div>
              <label className="block text-xs font-cinzel uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                Ranque do Grupo
              </label>
              <select
                value={partyRank}
                onChange={(e) => setPartyRank(e.target.value as MonsterRank)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-1.5 px-2.5 text-xs text-stone-200 focus:ring-1 focus:ring-amber-500"
              >
                <option value="Novato">Novato (0-19 XP)</option>
                <option value="Experiente">Experiente (20-39 XP)</option>
                <option value="Veterano">Veterano (40-59 XP)</option>
                <option value="Heroico">Heroico (60-79 XP)</option>
                <option value="Lendário">Lendário (80+ XP)</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-cinzel uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Tipo de Encontro
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as EncounterDifficulty)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-1.5 px-2.5 text-xs text-stone-200 focus:ring-1 focus:ring-amber-500"
              >
                <option value="escaramuca">Escaramuça (Leve)</option>
                <option value="padrao">Confronto Padrão</option>
                <option value="desafiador">Emboscada / Tenente</option>
                <option value="chefe">Batalha de Chefe (Boss)</option>
                <option value="horda">Horda Esmagadora (Enxame)</option>
              </select>
            </div>

            {/* Environment Theme */}
            <div>
              <label className="block text-xs font-cinzel uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Tema / Ambiente
              </label>
              <select
                value={environmentTheme}
                onChange={(e) => setEnvironmentTheme(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-1.5 px-2.5 text-xs text-stone-200 focus:ring-1 focus:ring-amber-500"
              >
                <option value="todos">Todos os Monstros</option>
                <option value="lendas">Folclore & Lendas</option>
                <option value="mortos">Cripta & Mortos-Vivos</option>
                <option value="feras">Ermos, Feras & Ninhos</option>
                <option value="humanoides">Bandos Humanoides & Saqueadores</option>
              </select>
            </div>

          </div>

          {/* Quick Reroll Button */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-stone-400">
              Sugestão calculada com base na regra de ouro de SWADE (Extras 1:1 e Cartas Selvagens com Bennies).
            </div>
            <button
              onClick={() => setSeed(s => s + 1)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1.5 border border-stone-700 transition-colors shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sortear Outra Combinação
            </button>
          </div>

          {/* Generated Encounter Cards */}
          <div className="space-y-3">
            <h3 className="font-cinzel text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span>Forças Oponentes no Campo de Batalha:</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generatedEncounter.map((entry, idx) => {
                const { monster, count, role } = entry;
                return (
                  <div
                    key={`${monster.id}-${idx}`}
                    onClick={() => onSelectMonster(monster)}
                    className="bg-stone-900/90 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-700/60 rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-amber-900/60 shrink-0 bg-stone-950">
                      <img
                        src={monster.imageUrl}
                        alt={monster.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {monster.isWildCard && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 p-0.5 rounded-bl">
                          <Skull className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-cinzel font-bold text-sm text-amber-200 group-hover:text-amber-300 truncate">
                          {monster.name}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-xs font-mono font-bold shrink-0">
                          x{count}
                        </span>
                      </div>

                      <div className="text-xs text-stone-400 font-crimson italic truncate mt-0.5">
                        {monster.archetype} • {monster.race}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-400 font-mono">
                        <span>Aparar: <b className="text-amber-400">{monster.parry}</b></span>
                        <span>Resist: <b className="text-amber-400">{monster.toughness}</b></span>
                        <span className="text-stone-500">• {role}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tactical Advice for the Master */}
          <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-xl text-xs space-y-1.5 text-amber-200/90">
            <div className="font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
              <Dice5 className="w-4 h-4 text-amber-400" />
              Dica Tática SWADE para esta Batalha:
            </div>
            <p className="text-stone-300 leading-relaxed">
              {difficulty === 'chefe' && 'O Chefe possui 3 Bennies (Fichas) e 3 Ferimentos antes de cair. Use Manobras de Teste para desestabilizar os heróis e guarde Bennies para absorver dano pesado!'}
              {difficulty === 'horda' && 'Lembre-se da regra de Bando: cada atacante extra no mesmo alvo adiciona até +4 no ataque e dano corpo-a-corpo. Mantenha os capangas agrupados!'}
              {difficulty === 'desafiador' && 'O Tenente coordena os capangas. Faça com que os capangas usem Suporte ou Distraiam os heróis com Truques antes do golpe principal do Tenente.'}
              {difficulty === 'padrao' && 'Confronto equilibrado. Permita aos heróis usarem o terreno a seu favor e divida a atenção do grupo entre múltiplos flancos.'}
              {difficulty === 'escaramuca' && 'Encontro rápido de reconhecimento. Se 2 ou mais capangas caírem, os restantes podem realizar um teste de Moral para recuar.'}
            </p>
          </div>

        </div>

        {activeTab === 'generator' ? (
          <>
            {/* Save Custom Encounter Form Bar */}
            <div className="px-4 sm:px-6 pt-3 flex items-center gap-2 border-t border-stone-800 bg-stone-950">
              <input
                type="text"
                placeholder="Nome do Encontro da Campanha (ex: Emboscada na Caatinga - Sessão 3)..."
                value={newEncounterName}
                onChange={(e) => setNewEncounterName(e.target.value)}
                className="flex-1 bg-stone-900 border border-stone-700 rounded-lg py-1.5 px-3 text-xs text-stone-200 focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={() => {
                  if (!newEncounterName.trim()) return;
                  const newEntry: SavedEncounter = {
                    id: `enc-${Date.now()}`,
                    name: newEncounterName.trim(),
                    date: new Date().toLocaleDateString('pt-BR'),
                    monsters: generatedEncounter.map(e => ({
                      monsterId: e.monster.id,
                      count: e.count,
                      role: e.role,
                    }))
                  };
                  saveEncountersToStorage([newEntry, ...savedEncounters]);
                  setNewEncounterName('');
                  setSaveSuccessMsg(`Encontro "${newEntry.name}" salvo na campanha!`);
                  setTimeout(() => setSaveSuccessMsg(null), 3500);
                }}
                disabled={!newEncounterName.trim()}
                className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/60 font-cinzel font-bold text-xs rounded-lg flex items-center gap-1 transition-all disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                Salvar Encontro
              </button>
            </div>
            {saveSuccessMsg && (
              <div className="px-6 py-1 text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-stone-950">
                <CheckCircle2 className="w-3.5 h-3.5" /> {saveSuccessMsg}
              </div>
            )}

            {/* Modal Footer with Actions */}
            <div className="bg-stone-900/90 border-t border-stone-800 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-stone-400">
                {addedNotice ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Monstros adicionados aos Favoritos!
                  </span>
                ) : (
                  <span>Clique no monstro para ver sua ficha detalhada.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg font-cinzel text-xs transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleAddToSession}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-cinzel font-bold text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <Star className="w-4 h-4 fill-stone-950 text-stone-950" />
                  Fixar Encontro nos Favoritos
                </button>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: SAVED ENCOUNTERS LIST */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <h3 className="font-cinzel text-base font-bold text-amber-300 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              Encontros Salvos da Campanha ({savedEncounters.length})
            </h3>

            {savedEncounters.length === 0 ? (
              <div className="text-center py-12 bg-stone-900/40 rounded-xl border border-stone-800 p-6">
                <FolderPlus className="w-10 h-10 text-stone-600 mx-auto mb-2" />
                <p className="font-cinzel text-stone-400 text-sm font-bold">Nenhum Encontro Salvo</p>
                <p className="text-stone-500 text-xs mt-1">
                  Gere um encontro na aba "Gerar Encontro", dê um nome e clique em Salvar para preparar combates da sua sessão!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedEncounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="bg-stone-900 border border-stone-800 hover:border-amber-700/60 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <h4 className="font-cinzel font-bold text-amber-200 text-sm">{enc.name}</h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">Criado em: {enc.date}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {enc.monsters.map((item, i) => {
                          const m = allMonsters.find(x => x.id === item.monsterId);
                          return (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-stone-950 border border-stone-800 rounded text-[11px] text-stone-300 font-mono-dice"
                            >
                              {m ? m.name : 'Monstro'} x{item.count} ({item.role})
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          const ids = enc.monsters.map(m => m.monsterId);
                          onAddEncounterToSession(ids);
                          alert(`Encontro "${enc.name}" ativado na sua lista de Favoritos!`);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-xs rounded-lg shadow transition-all"
                      >
                        Carregar na Mesa
                      </button>
                      <button
                        onClick={() => {
                          const updated = savedEncounters.filter(x => x.id !== enc.id);
                          saveEncountersToStorage(updated);
                        }}
                        className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded transition-colors"
                        title="Excluir encontro salvo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
