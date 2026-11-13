import { DiceRollResult, DamageRollResult } from '../types';
import { soundService } from './soundService';

/**
 * Rolls a single exploding die (Acing in Savage Worlds).
 * If the die rolls its maximum face, it rolls again and adds to the total.
 */
export const rollExplodingDie = (sides: number): { rolls: number[]; total: number } => {
  if (sides <= 1) return { rolls: [1], total: 1 };
  const rolls: number[] = [];
  let total = 0;
  let currentRoll = 0;

  do {
    currentRoll = Math.floor(Math.random() * sides) + 1;
    rolls.push(currentRoll);
    total += currentRoll;
  } while (currentRoll === sides);

  return { rolls, total };
};

/**
 * Parses a Savage Worlds dice formula such as:
 * "d8", "d10+2", "d6-1", "d12+4", "d4"
 */
export const parseTraitFormula = (rawFormula: string): { sides: number; modifier: number } => {
  const cleaned = rawFormula.trim().toLowerCase();
  const match = cleaned.match(/d(\d+)(?:([+-])(\d+))?/);
  if (!match) {
    return { sides: 6, modifier: 0 };
  }
  const sides = parseInt(match[1], 10) || 6;
  let modifier = 0;
  if (match[2] && match[3]) {
    const sign = match[2] === '-' ? -1 : 1;
    modifier = sign * parseInt(match[3], 10);
  }
  return { sides, modifier };
};

/**
 * Executes a standard Savage Worlds Trait Roll (Attribute or Skill).
 * Supports Wild Cards (Dado Selvagem d6) and Extra (single die).
 * Checks for Success (>= Target Number), Raises (+4 over TN), and Critical Failure (Snake Eyes).
 */
export const rollTrait = (
  title: string,
  traitFormula: string,
  isWildCard: boolean = false,
  targetNumber: number = 4,
  situationalModifier: number = 0
): DiceRollResult => {
  const { sides, modifier: baseModifier } = parseTraitFormula(traitFormula);
  const modifier = baseModifier + situationalModifier;

  const traitResult = rollExplodingDie(sides);
  let wildResult: { rolls: number[]; total: number } | undefined = undefined;
  let isCriticalFailure = !isWildCard && traitResult.rolls[0] === 1;
  let finalTotal = traitResult.total + modifier;

  if (isWildCard) {
    wildResult = rollExplodingDie(6);

    // Critical failure occurs ONLY if the FIRST roll of both dice is a 1
    if (traitResult.rolls[0] === 1 && wildResult.rolls[0] === 1) {
      isCriticalFailure = true;
    }

    const traitWithMod = traitResult.total + modifier;
    const wildWithMod = wildResult.total + modifier;
    finalTotal = Math.max(traitWithMod, wildWithMod);
  }

  const isSuccess = !isCriticalFailure && finalTotal >= targetNumber;
  const raises = isSuccess ? Math.floor((finalTotal - targetNumber) / 4) : 0;

  // Trigger audio feedback
  try {
    soundService.playDiceRoll();
    if (isCriticalFailure) {
      setTimeout(() => soundService.playCriticalFailure(), 250);
    } else if (traitResult.rolls.length > 1 || (wildResult && wildResult.rolls.length > 1)) {
      setTimeout(() => soundService.playAceExplosion(), 280);
    }
  } catch {}

  return {
    title,
    formula: `d${sides}${modifier ? `${modifier > 0 ? '+' : ''}${modifier}` : ''}${isWildCard ? ' (+Dado Selvagem d6)' : ''}`,
    isWildCard,
    traitDiceSides: sides,
    traitRolls: traitResult.rolls,
    traitTotal: traitResult.total,
    wildRolls: wildResult?.rolls,
    wildTotal: wildResult?.total,
    finalTotal,
    modifier,
    targetNumber,
    isSuccess,
    raises,
    isCriticalFailure,
    timestamp: new Date(),
  };
};

const SESSION_HISTORY_KEY = 'swade_dice_session_history';
const MAX_SESSION_HISTORY = 5;

// In-memory fallback
let memorySessionHistory: DiceRollResult[] = [];

/**
 * Retrieves the last 5 dice rolls stored for the current session.
 */
export const getDiceSessionHistory = (): DiceRollResult[] => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(SESSION_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
        }
      }
    }
  } catch {}
  return [...memorySessionHistory];
};

/**
 * Saves a dice roll result into the current session history, capping at 5.
 */
export const saveDiceRollToSessionHistory = (roll: DiceRollResult): DiceRollResult[] => {
  const current = getDiceSessionHistory();
  // Prevent adding identical consecutive rolls on re-render
  if (current.length > 0) {
    const latest = current[0];
    const isSameTime = Math.abs(new Date(latest.timestamp).getTime() - new Date(roll.timestamp).getTime()) < 100;
    if (isSameTime && latest.title === roll.title && latest.finalTotal === roll.finalTotal) {
      return current;
    }
  }

  const updated = [roll, ...current].slice(0, MAX_SESSION_HISTORY);
  memorySessionHistory = updated;

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(updated));
    }
  } catch {}

  return updated;
};

/**
 * Clears the session history of dice rolls.
 */
export const clearDiceSessionHistory = (): void => {
  memorySessionHistory = [];
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(SESSION_HISTORY_KEY);
    }
  } catch {}
};


/** Damage expressions only. No default damage is invented for equipment or notes. */
const DAMAGE_EXPRESSION = /\b(?:(?:força|forca|for|espírito|espirito|esp|agilidade|agi|ag)(?:\s*[+−-]\s*(?:\d*d(?:4|6|8|10|12|20)|\d+))*|\d*d(?:4|6|8|10|12|20)(?:\s*[+−-]\s*(?:\d*d(?:4|6|8|10|12|20)|\d+))*)\b/gi;
export function extractDamageFormula(text: string): string | null {
  const candidates = [...text.matchAll(DAMAGE_EXPRESSION)];
  // Attribute damage is less ambiguous than dice in a range, skill or saving throw.
  const chosen = candidates.find(m => {
    if (!/^(for|esp|ag)/i.test(m[0])) return false;
    return /[+−-]/.test(m[0]) || /^\s*(?:[).,;]|(?:de )?dano\b|$)/i.test(text.slice(m.index+m[0].length));
  }) || candidates.find(m => {
    if (/^(for|esp|ag)/i.test(m[0])) return false;
    const before = text.slice(Math.max(0,m.index-25),m.index);
    return !/(?:lutar|atirar|vigor|espírito|espirito|força|forca|atletismo|teste de|perceber)\s*$/i.test(before);
  });
  return chosen ? chosen[0].replace(/\s/g,'').replace(/−/g,'-') : null;
}
export const parseWeaponAttacks = (weaponsText?: string): { name: string; formula: string; originalText: string }[] => {
  if (!weaponsText?.trim()) return [];
  const parts: string[] = []; let depth=0, current='';
  for(const ch of weaponsText){
    if(ch==='(')depth++;
    if(ch===')')depth=Math.max(0,depth-1);
    if((/[,;\n•]/.test(ch)&&depth===0)||ch==='\n'){if(current.trim())parts.push(current.trim());current='';}
    else current+=ch;
  }
  if(current.trim())parts.push(current.trim());
  return parts.flatMap(part=>{
    const formula=extractDamageFormula(part);
    if(!formula)return [];
    const name=part.split(/[(:]/)[0].replace(DAMAGE_EXPRESSION,'').trim()||'Ataque';
    return [{name,formula,originalText:part}];
  });
};

export interface DamageOptions { modifier?: number; raise?: boolean; spiritDie?: string; agilityDie?: string; }
export const rollDamage = (title: string, formula: string, strengthDie='d6', options: DamageOptions = {}): DamageRollResult => {
  let resolved=formula.toLowerCase().replace(/\s+/g,'').replace(/−/g,'-')
    .replace(/força|forca|for/g,strengthDie).replace(/espírito|espirito|esp/g,options.spiritDie||'d6')
    .replace(/agilidade|agi|ag/g,options.agilityDie||'d6');
  if(options.raise) resolved+='+d6';
  if(options.modifier) resolved+=`${options.modifier>0?'+':''}${options.modifier}`;
  if(!/^(?:\d*d(?:4|6|8|10|12|20)|\d+)(?:[+-](?:\d*d(?:4|6|8|10|12|20)|\d+))*$/.test(resolved)) throw new Error('Use uma fórmula como For+d4, 2d6 ou 3d6-2.');
  const diceResults: DamageRollResult['rolls']=[]; let modifier=0;
  for(const token of resolved.matchAll(/([+-]?)(\d*d(?:4|6|8|10|12|20)|\d+)/g)){
    const sign=token[1]==='-'?-1:1; const die=token[2].match(/^(\d*)d(\d+)$/);
    if(die){
      const count=Number(die[1]||1),sides=Number(die[2]);
      if(sign<0||count<1||count>30||diceResults.length+count>60) throw new Error('Use até 30 dados por termo, sem subtrair dados.');
      for(let i=0;i<count;i++) diceResults.push({sides,...rollExplodingDie(sides)});
    }else modifier+=sign*Number(token[2]);
  }
  if(!diceResults.length)throw new Error('Informe pelo menos um dado de dano.');
  try{soundService.playDiceRoll();if(diceResults.some(d=>d.rolls.length>1))setTimeout(()=>soundService.playAceExplosion(),280);}catch{}
  return {isDamage:true,title,formula:`${formula}${options.raise?' + d6 (ampliação)':''}${options.modifier?` (${options.modifier>0?'+':''}${options.modifier})`:''}`,resolvedFormula:resolved,rolls:diceResults,modifier,finalTotal:diceResults.reduce((sum,r)=>sum+r.total,0)+modifier,timestamp:new Date()};
};
