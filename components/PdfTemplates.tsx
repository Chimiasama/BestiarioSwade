import React from 'react';
import { Monster } from '../types';

const StatBlock: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className = '',
}) => (
  <div className={`mb-3 ${className}`}>
    <h4 className="font-cinzel text-sm font-bold text-amber-500 mb-1 tracking-wider uppercase border-b border-amber-900/40 pb-0.5">
      {title}
    </h4>
    <div className="text-stone-300 text-xs leading-normal">{children}</div>
  </div>
);

export const SimpleListItem: React.FC<{ monster: Monster }> = ({ monster }) => (
  <div className="p-3 mb-2 break-inside-avoid bg-stone-900 border border-stone-800 rounded-lg">
    <div className="flex items-center justify-between mb-1">
      <h3 className="font-cinzel font-bold text-amber-400 text-sm">{monster.name}</h3>
      <span className="text-[10px] text-stone-400 font-cinzel">
        {monster.isWildCard ? '💀 Carta Selvagem' : 'Extra'}
      </span>
    </div>
    <p className="text-xs text-stone-300 font-mono-dice">
      <strong>Aparar:</strong> {monster.parry} | <strong>Resistência:</strong> {monster.toughness} | <strong>Mov.:</strong> {monster.movement}
    </p>
    <p className="text-xs text-stone-400 mt-1">
      <strong>Perícias:</strong> {(monster.skills || []).slice(0, 5).join(', ')}
    </p>
  </div>
);

export const CompleteSheet: React.FC<{ monster: Monster }> = ({ monster }) => (
  <div
    className="bg-stone-950 text-stone-200 p-8 border border-amber-950"
    style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
  >
    {/* Header */}
    <div className="flex justify-between items-start border-b-2 border-amber-800 pb-4 mb-6">
      <div>
        <h2 className="font-cinzel text-4xl font-extrabold text-amber-300 tracking-wide">
          {monster.name}
        </h2>
        <p className="text-stone-400 font-crimson text-lg italic mt-1">
          {monster.archetype} • {monster.race}
        </p>
      </div>
      <div className="text-right font-cinzel">
        <span className="inline-block px-3 py-1 rounded bg-amber-950 text-amber-300 border border-amber-700 text-xs font-bold">
          {monster.isWildCard ? '💀 CARTA SELVAGEM' : 'EXTRA'}
        </span>
        <div className="text-[11px] text-stone-500 mt-1">{monster.sourcebook}</div>
      </div>
    </div>

    {/* Portrait & Quick Combat Bar */}
    <div className="grid grid-cols-3 gap-6 mb-6">
      <div className="col-span-1">
        <img
          src={monster.imageUrl}
          alt={monster.name}
          className="w-full h-56 object-cover rounded-lg border border-amber-900/60 shadow-md"
          crossOrigin="anonymous"
        />
      </div>
      <div className="col-span-2 flex flex-col justify-between">
        {/* Vitals */}
        <div className="grid grid-cols-4 gap-2 bg-stone-900 p-3 rounded-lg border border-stone-800 text-center font-cinzel">
          <div>
            <div className="text-[10px] text-stone-400">Aparar</div>
            <div className="text-xl font-bold text-amber-400 font-mono-dice">{monster.parry}</div>
          </div>
          <div>
            <div className="text-[10px] text-stone-400">Resistência</div>
            <div className="text-xl font-bold text-amber-400 font-mono-dice">{monster.toughness}</div>
          </div>
          <div>
            <div className="text-[10px] text-stone-400">Movimentação</div>
            <div className="text-xl font-bold text-amber-400 font-mono-dice">{monster.movement}</div>
          </div>
          <div>
            <div className="text-[10px] text-stone-400">Tamanho</div>
            <div className="text-xl font-bold text-amber-400 font-mono-dice">{monster.size ?? 0}</div>
          </div>
        </div>

        {/* History Box */}
        <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800/80 mt-3 flex-grow font-crimson text-sm italic text-stone-300 leading-relaxed">
          "{monster.history}"
        </div>
      </div>
    </div>

    {/* Attributes, Skills and Abilities Grid */}
    <div className="grid grid-cols-2 gap-6">
      <div>
        <StatBlock title="Atributos SWADE">
          <ul className="space-y-1 font-mono-dice text-xs">
            <li><strong className="text-stone-400">Agilidade:</strong> <span className="text-amber-300 font-bold">{monster.attributes.agility}</span></li>
            <li><strong className="text-stone-400">Esperteza:</strong> <span className="text-amber-300 font-bold">{monster.attributes.cunning}</span></li>
            <li><strong className="text-stone-400">Espírito:</strong> <span className="text-amber-300 font-bold">{monster.attributes.spirit}</span></li>
            <li><strong className="text-stone-400">Força:</strong> <span className="text-amber-300 font-bold">{monster.attributes.strength}</span></li>
            <li><strong className="text-stone-400">Vigor:</strong> <span className="text-amber-300 font-bold">{monster.attributes.vigor}</span></li>
          </ul>
        </StatBlock>

        <StatBlock title="Perícias">
          <p className="text-xs leading-relaxed text-stone-300 font-mono-dice">
            {(monster.skills || []).join(', ')}
          </p>
        </StatBlock>

        {monster.weapons && (
          <StatBlock title="Armas & Ataques">
            <p className="text-xs text-stone-300">{monster.weapons}</p>
          </StatBlock>
        )}
      </div>

      <div>
        <StatBlock title="Habilidades Especiais">
          <ul className="space-y-2 text-xs">
            {(monster.abilities || []).map((ability) => (
              <li key={ability.name} className="border-l-2 border-amber-700/60 pl-2">
                <strong className="text-amber-300 font-cinzel">{ability.name}: </strong>
                <span className="text-stone-300">{ability.description}</span>
              </li>
            ))}
          </ul>
        </StatBlock>

        {monster.advantages && monster.advantages.length > 0 && (
          <StatBlock title="Vantagens">
            <p className="text-xs text-stone-300">{monster.advantages.join(', ')}</p>
          </StatBlock>
        )}

        {monster.complications && monster.complications.length > 0 && (
          <StatBlock title="Complicações">
            <p className="text-xs text-stone-300">{monster.complications.join(', ')}</p>
          </StatBlock>
        )}

        {monster.powers && (
          <StatBlock title="Poderes Arcanos">
            <p className="text-xs text-stone-300">{monster.powers}</p>
          </StatBlock>
        )}
      </div>
    </div>

    {/* Footer watermark */}
    <div className="mt-8 pt-4 border-t border-stone-800 text-center text-[10px] text-stone-500 font-cinzel">
      Bestiário de Lendas • Compêndio Savage Worlds (SWADE)
    </div>
  </div>
);

export const MonsterCardFront: React.FC<{ monster: Monster }> = ({ monster }) => (
  <div className="card-front bg-stone-950 text-white flex flex-col overflow-hidden border border-amber-900/60 rounded-md">
    <img
      src={monster.imageUrl}
      alt={monster.name}
      className="w-full h-3/5 object-cover"
      crossOrigin="anonymous"
    />
    <div className="p-3 flex-grow flex flex-col justify-between bg-stone-900">
      <div>
        <h2 className="font-cinzel font-bold text-base text-amber-300 tracking-wide text-center">
          {monster.name}
        </h2>
        <p className="text-stone-400 text-[11px] text-center font-crimson italic">
          {monster.archetype} • {monster.race}
        </p>
      </div>
      <p className="text-stone-300 text-[10px] leading-tight font-crimson italic mt-1 line-clamp-4">
        {monster.history}
      </p>
      <div className="text-[9px] font-cinzel text-amber-500 text-center pt-1 border-t border-stone-800">
        {monster.isWildCard ? '💀 CARTA SELVAGEM' : 'EXTRA'}
      </div>
    </div>
  </div>
);

export const MonsterCardBack: React.FC<{ monster: Monster }> = ({ monster }) => (
  <div className="card-back bg-stone-900 text-stone-200 p-3 flex flex-col border border-stone-700 rounded-md text-xs">
    <div className="flex justify-between items-center border-b border-stone-800 pb-1 mb-2">
      <h2 className="font-cinzel font-bold text-amber-300 text-sm truncate">{monster.name}</h2>
      <span className="text-[10px] font-mono-dice text-amber-400">
        Aparar {monster.parry} | Resist {monster.toughness}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-1 mb-2 font-mono-dice text-[11px] bg-stone-950 p-1.5 rounded">
      <div>Agi: {monster.attributes.agility}</div>
      <div>Esp: {monster.attributes.cunning}</div>
      <div>Espír: {monster.attributes.spirit}</div>
      <div>For: {monster.attributes.strength}</div>
      <div>Vig: {monster.attributes.vigor}</div>
      <div>Mov: {monster.movement}</div>
    </div>

    <div className="flex-grow overflow-hidden space-y-1">
      <div className="text-[10px] text-stone-300 font-mono-dice truncate">
        <strong>Perícias:</strong> {(monster.skills || []).slice(0, 4).join(', ')}
      </div>

      <div className="space-y-1 text-[10px] pt-1 border-t border-stone-800">
        {(monster.abilities || []).slice(0, 3).map((ability) => (
          <div key={ability.name} className="line-clamp-2">
            <strong className="text-amber-400 font-cinzel">{ability.name}: </strong>
            <span className="text-stone-400">{ability.description}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
