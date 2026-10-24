import React, { useState, useMemo } from 'react';
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
  Flame
} from 'lucide-react';

interface EncounterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMonsters: Monster[];
  onAddEncounterToSession: (monsterIds: string[]) => void;
  onSelectMonster: (monster: Monster) => void;
}

type EncounterDifficulty = 'escaramuca' | 'padrao' | 'desafiador' | 'chefe' | 'horda';

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
              <h2 className="font-cinzel text-xl font-bold text-amber-200">Gerador de Encontros SWADE</h2>
              <p className="text-xs text-stone-400">Balanceamento tático para Savage Worlds Adventure Edition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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

      </div>
    </div>
  );
};
