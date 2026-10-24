import { DiceRollResult } from '../types';
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
  let safetyLimit = 20; // Prevent infinite loop in bizarre edge-cases

  do {
    currentRoll = Math.floor(Math.random() * sides) + 1;
    rolls.push(currentRoll);
    total += currentRoll;
    safetyLimit--;
  } while (currentRoll === sides && safetyLimit > 0);

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
  targetNumber: number = 4
): DiceRollResult => {
  const { sides, modifier } = parseTraitFormula(traitFormula);

  const traitResult = rollExplodingDie(sides);
  let wildResult: { rolls: number[]; total: number } | undefined = undefined;
  let isCriticalFailure = false;
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
    formula: `${traitFormula}${modifier > 0 ? `+${modifier}` : ''}${isWildCard ? ' (+Dado Selvagem d6)' : ''}`,
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


/**
 * Rolls damage formula like "For+d8", "2d6", "3d6+2"
 */
export const rollDamage = (
  title: string,
  formula: string,
  strengthDie: string = 'd6'
): { title: string; rolls: { sides: number; rolls: number[]; total: number }[]; modifier: number; total: number } => {
  let processed = formula.replace(/for/gi, strengthDie);
  const parts = processed.split('+').map(p => p.trim());
  const diceResults: { sides: number; rolls: number[]; total: number }[] = [];
  let modifier = 0;

  for (const part of parts) {
    if (part.includes('d')) {
      const match = part.match(/(\d*)d(\d+)/i);
      if (match) {
        const count = parseInt(match[1], 10) || 1;
        const sides = parseInt(match[2], 10);
        for (let i = 0; i < count; i++) {
          const res = rollExplodingDie(sides);
          diceResults.push({ sides, rolls: res.rolls, total: res.total });
        }
      }
    } else {
      const val = parseInt(part, 10);
      if (!isNaN(val)) {
        modifier += val;
      }
    }
  }

  const sumDice = diceResults.reduce((acc, r) => acc + r.total, 0);
  const total = sumDice + modifier;

  try {
    soundService.playDiceRoll();
    const hasAced = diceResults.some(d => d.rolls.length > 1);
    if (hasAced) {
      setTimeout(() => soundService.playAceExplosion(), 280);
    }
  } catch {}

  return {
    title,
    rolls: diceResults,
    modifier,
    total,
  };
};
