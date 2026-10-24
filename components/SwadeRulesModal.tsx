import React from 'react';
import { X, BookOpen, Skull, Zap, Shield, HeartPulse, Dices } from 'lucide-react';

interface SwadeRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwadeRulesModal: React.FC<SwadeRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-stone-950 border border-amber-900/60 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-stone-200 ring-1 ring-amber-500/20 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-700/50">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel text-xl font-bold text-amber-200">
                Guia Rápido de Regras • Savage Worlds
              </h3>
              <p className="text-xs text-stone-400">Edição Aventura (SWADE) — Resumo de Combate e Traços</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-sm font-crimson">
          
          {/* O Número Alvo e Ases */}
          <div className="bg-stone-900/70 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <h4 className="font-cinzel font-bold text-amber-300 flex items-center gap-2 text-base">
              <Dices className="w-4 h-4 text-amber-500" />
              1. Número Alvo (NA 4) & Ases (Dados Explodindo)
            </h4>
            <p className="text-stone-300 leading-relaxed text-sm">
              Na maioria dos testes de Perícia ou Atributo, o <strong>Número Alvo é 4</strong>.
            </p>
            <p className="text-stone-300 leading-relaxed text-sm">
              <strong>Ases (Explosão):</strong> Sempre que você rola o valor máximo da face de qualquer dado (um 6 num d6, um 8 num d8, etc.), você <em>rola o dado novamente e soma o novo valor ao total</em>! Isso pode ocorrer indefinidamente.
            </p>
            <p className="text-stone-300 leading-relaxed text-sm">
              <strong>Ampliações:</strong> A cada <strong>4 pontos acima do Número Alvo</strong> (ex: total 8, 12, 16), você obtém uma <em>Ampliação (Raise)</em>, que adiciona efeitos extras poderosos ou +1d6 no dano de ataques.
            </p>
          </div>

          {/* Cartas Selvagens vs Extras */}
          <div className="bg-stone-900/70 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <h4 className="font-cinzel font-bold text-amber-300 flex items-center gap-2 text-base">
              <Skull className="w-4 h-4 text-amber-500" />
              2. Cartas Selvagens (Wild Cards) vs Extras
            </h4>
            <p className="text-stone-300 leading-relaxed text-sm">
              <strong>Extras (Capangas):</strong> Rolam apenas o seu dado de traço. São Incapacitados com apenas 1 Ferimento.
            </p>
            <p className="text-stone-300 leading-relaxed text-sm">
              <strong>Cartas Selvagens (Heróis e Vilões Épicos):</strong> Sempre rolam o <strong>Dado Selvagem (d6)</strong> junto com o seu dado de característica e escolhem o maior resultado! Além disso, suportam até <strong>3 Ferimentos</strong> antes de serem Incapacitados (-1 em todas as rolagens por cada ferimento).
            </p>
            <p className="text-stone-300 leading-relaxed text-sm">
              <strong>Olhos de Cobra (Falha Crítica):</strong> Ocorre se tanto o dado de traço quanto o dado selvagem rolarem <strong>1 no primeiro lance</strong>. Algo desastroso acontece e não pode ser evitado por Benesses!
            </p>
          </div>

          {/* Dano, Abalado e Ferimentos */}
          <div className="bg-stone-900/70 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <h4 className="font-cinzel font-bold text-amber-300 flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-amber-500" />
              3. Combate: Abalado & Ferimentos
            </h4>
            <p className="text-stone-300 leading-relaxed text-sm">
              Ao acertar um ataque contra o <strong>Aparar</strong> do defensor, rola-se o dano contra a <strong>Resistência</strong> da vítima:
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-300 pl-2 text-sm">
              <li><strong>Dano &lt; Resistência:</strong> Sem efeito.</li>
              <li><strong>Dano &gt;= Resistência:</strong> O alvo fica <strong>Abalado (Shaken)</strong>. Se já estava Abalado, sofre 1 Ferimento!</li>
              <li><strong>Cada Ampliação (+4 de dano além da Resistência):</strong> Causa +1 Ferimento direto!</li>
            </ul>
          </div>

          {/* Benesses */}
          <div className="bg-stone-900/70 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <h4 className="font-cinzel font-bold text-amber-300 flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-amber-500" />
              4. Benesses (Bennies)
            </h4>
            <p className="text-stone-300 leading-relaxed text-sm">
              Fichas de destino do Mestre e jogadores. Gastar uma Benesse permite rolar novamente qualquer teste de traço (mantendo o melhor resultado) ou tentar Absorver Ferimentos com um teste de Vigor.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-cinzel text-xs py-2 px-5 rounded-lg transition-colors"
          >
            Entendido, Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
