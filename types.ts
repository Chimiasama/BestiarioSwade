export interface MonsterAbility {
  name: string;
  description: string;
}

export interface MonsterAttributes {
  agility: string;
  cunning: string; // Esperteza (Smarts in SWADE)
  spirit: string;  // Espírito
  strength: string; // Força
  vigor: string;   // Vigor
}

export type MonsterRank = 'Novato' | 'Experiente' | 'Veterano' | 'Heroico' | 'Lendário';

export interface Monster {
  id: string;
  name: string;
  race: string;
  archetype: string;
  imageUrl: string;
  isWildCard?: boolean;
  rank?: MonsterRank;
  attributes: MonsterAttributes;
  skills: string[];
  movement: string; // Movimentação (Pace)
  parry: number;   // Aparar
  toughness: string; // Resistência (Toughness) - ex: "8 (2)"
  size?: number;   // Tamanho
  abilities: MonsterAbility[];
  advantages?: string[]; // Vantagens (Edges)
  complications?: string[]; // Complicações (Hindrances)
  powers?: string; // Poderes Arcanos
  weapons?: string; // Armas / Ataques
  equipment?: string; // Equipamentos
  history: string;
  sourcebook: string;
}

export type MonsterArchetype = 'Soldier' | 'Brute' | 'Sharpshooter' | 'Shadow Mage' | 'Beast' | 'Elemental' | 'Undead';

export interface MonsterTemplate {
  id?: string;
  name: string;
  race: string;
  archetype: string;
  isWildCard?: boolean;
  attributes: MonsterAttributes;
  skills: string; 
  movement: string;
  parry: number;
  toughness: string;
  abilities: MonsterAbility[];
  advantages: string;
  complications: string;
  weapons: string;
  history: string;
  size: number;
  imageUrl?: string;
  sourcebook?: string;
}

export interface DamageRollResult {
  isDamage: true;
  title: string;
  formula: string;
  rolls: { sides: number; rolls: number[]; total: number }[];
  modifier: number;
  finalTotal: number;
  timestamp: Date;
}

export interface TraitRollResult {
  isDamage?: false;
  title: string;
  formula: string;
  isWildCard: boolean;
  traitDiceSides: number;
  traitRolls: number[]; // All rolls including explosions (Aces)
  traitTotal: number;
  wildRolls?: number[]; // For Wild Cards (d6 with explosions)
  wildTotal?: number;
  finalTotal: number;
  modifier: number;
  targetNumber: number;
  isSuccess: boolean;
  raises: number; // Ampliações (+4 over target)
  isCriticalFailure: boolean; // Olhos de Cobra (Snake Eyes: 1 on both trait & wild die)
  timestamp: Date;
}

export type DiceRollResult = TraitRollResult | DamageRollResult;

export interface ParsedAttack {
  name: string;
  formula: string;
  originalText: string;
}
