import type { MonsterArchetype, MonsterTemplate } from '../types';

export const LEGACY_TEMPLATES: Record<MonsterArchetype, Omit<MonsterTemplate, 'name' | 'history'>> = {
  Soldier: {
    race: 'Humano',
    archetype: 'Soldado Assombrado',
    isWildCard: false,
    size: 0,
    attributes: { agility: 'd8', cunning: 'd6', spirit: 'd6', strength: 'd8', vigor: 'd8' },
    skills: 'Lutar d8, Intimidar d6, Atirar d8, Perceber d6, Atletismo d6',
    movement: '6',
    parry: 6,
    toughness: '8 (2)',
    abilities: [
      { name: 'Destemido', description: 'Imune a testes de Medo e Intimidação.' },
      { name: 'Formação de Batalha', description: 'Recebe +1 em Aparar quando estiver adjacente a pelo menos um aliado.' }
    ],
    weapons: 'Espada Longa (For+d8), Armadura de Malha (+2)',
    advantages: 'Reflexos em Combate',
    complications: 'Leal (Maior)',
    sourcebook: 'Criações Próprias',
  },
  Brute: {
    race: 'Monstruosidade',
    archetype: 'Besta Brutal',
    isWildCard: true,
    size: 2,
    attributes: { agility: 'd6', cunning: 'd4', spirit: 'd6', strength: 'd12', vigor: 'd10' },
    skills: 'Lutar d10, Intimidar d10, Perceber d6, Atletismo d8',
    movement: '7',
    parry: 7,
    toughness: '11 (2)',
    abilities: [
      { name: 'Couraça Espessa', description: 'Armadura natural +2.' },
      { name: 'Frenesi Selvagem', description: 'Pode realizar um ataque adicional de Lutar por turno com -2 na rolagem.' },
      { name: 'Tamanho +2', description: 'Criatura volumosa; recebe +2 em Resistência.' }
    ],
    weapons: 'Garras Devastadoras (For+d8)',
    advantages: 'Brutamontes, Varredura',
    complications: 'Sanguinário (Maior)',
    sourcebook: 'Criações Próprias',
  },
  Sharpshooter: {
    race: 'Elfo Espectral',
    archetype: 'Atirador Furtivo',
    isWildCard: false,
    size: 0,
    attributes: { agility: 'd10', cunning: 'd8', spirit: 'd6', strength: 'd6', vigor: 'd6' },
    skills: 'Atirar d10, Furtividade d10, Perceber d8, Sobrevivência d6',
    movement: '6',
    parry: 5,
    toughness: '5',
    abilities: [
      { name: 'Visão Noturna', description: 'Ignora penalidades por Penumbra e Escuridão parcial.' },
      { name: 'Disparo Silencioso', description: 'Se atacar furtivo e acertar com ampliação, adiciona +4 de dano.' }
    ],
    weapons: 'Arco Fantasmagórico (2d6, Alcance 12/24/48)',
    advantages: 'Atirador, Olhos de Águia',
    complications: 'Cauteloso (Maior)',
    sourcebook: 'Criações Próprias',
  },
  'Shadow Mage': {
    race: 'Espectro',
    archetype: 'Conjurador das Trevas',
    isWildCard: true,
    size: 0,
    attributes: { agility: 'd6', cunning: 'd8', spirit: 'd10', strength: 'd4', vigor: 'd6' },
    skills: 'Conjurar d10, Ocultismo d10, Intimidar d8, Perceber d8',
    movement: '6',
    parry: 4,
    toughness: '5',
    abilities: [
      { name: 'Etéreo', description: 'Pode atravessar paredes e só é ferido por ataques mágicos ou energia pura.' },
      { name: 'Dreno Sinistro', description: 'Ataque de toque força o alvo a testar Vigor ou sofrer 1 nível de Fadiga.' }
    ],
    weapons: 'Feitiços Arcanos (Projétil 2d6, Pavor, Escuridão)',
    advantages: 'Antecedente Arcano (Magia)',
    complications: 'Vulnerabilidade a Luz Solar (Maior)',
    sourcebook: 'Criações Próprias',
  },
  Beast: {
    race: 'Besta Mítica',
    archetype: 'Predador Alfa',
    isWildCard: false,
    size: 1,
    attributes: { agility: 'd8', cunning: 'd6', spirit: 'd6', strength: 'd8', vigor: 'd8' },
    skills: 'Lutar d8, Perceber d8, Furtividade d8, Atletismo d8, Rastrear d8',
    movement: '8',
    parry: 6,
    toughness: '7 (1)',
    abilities: [
      { name: 'Sentidos Apurados', description: '+2 em testes de Perceber baseados em olfato ou audição.' },
      { name: 'Bote Furioso', description: 'Se mover pelo menos 3 quadros antes de atacar com Lutar, ganha +2 de dano.' }
    ],
    weapons: 'Mordida & Garras (For+d6)',
    advantages: 'Prontidão',
    complications: 'Sem Fala',
    sourcebook: 'Criações Próprias',
  },
  Elemental: {
    race: 'Elemental',
    archetype: 'Manifestação Primitiva',
    isWildCard: false,
    size: 0,
    attributes: { agility: 'd8', cunning: 'd6', spirit: 'd8', strength: 'd8', vigor: 'd8' },
    skills: 'Lutar d8, Atirar d8, Intimidar d8, Atletismo d6',
    movement: '6',
    parry: 6,
    toughness: '6',
    abilities: [
      { name: 'Natureza Elemental', description: 'Não respira, imune a venenos, doenças e sono. Ignora penalidades de ferimento.' },
      { name: 'Aura Danosa', description: 'Inimigos adjacentes sofrem 2d4 de dano no final do seu turno.' }
    ],
    weapons: 'Pancada Elemental (For+d6)',
    advantages: '',
    complications: 'Vulnerabilidade a Elemento Oposto (Maior)',
    sourcebook: 'Criações Próprias',
  },
  Undead: {
    race: 'Morto-Vivo',
    archetype: 'Cavaleiro Macabro',
    isWildCard: false,
    size: 0,
    attributes: { agility: 'd6', cunning: 'd4', spirit: 'd6', strength: 'd8', vigor: 'd8' },
    skills: 'Lutar d8, Intimidar d8, Perceber d4',
    movement: '5',
    parry: 6,
    toughness: '8 (2)',
    abilities: [
      { name: 'Morto-Vivo', description: '+2 Resistência; +2 para recuperar de Abalado; ignora 1 ponto de penalidade de Ferimento; Imune a doenças e venenos.' },
      { name: 'Destemido', description: 'Imune a testes de Medo e Intimidação.' }
    ],
    weapons: 'Machado Enferrujado (For+d8)',
    advantages: '',
    complications: '',
    sourcebook: 'Criações Próprias',
  }
};

