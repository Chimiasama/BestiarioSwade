import type { Monster, ParsedAttack } from '../types';
import { extractDamageFormula, parseWeaponAttacks } from './diceService';
import { normalizeSearch } from './catalogSearch';

export function getMonsterAttacks(monster: Monster): ParsedAttack[] {
  const attacks=parseWeaponAttacks(monster.weapons);
  for(const ability of monster.abilities||[]){
    const name=normalizeSearch(ability.name);
    if(!/mordida|garras|chifre|presas|pancada|soco|coice|tentaculo|sopro|ferrao|espinho|cauda|lamina|ataque|toque|infestacao|proj[eé]til/.test(name))continue;
    const formula=extractDamageFormula(ability.description);
    if(formula) attacks.push({name:ability.name,formula,originalText:`${ability.name}: ${ability.description}`});
  }
  const seen=new Set<string>();
  return attacks.filter(a=>{const key=normalizeSearch(a.name).replace(/[^a-z0-9]/g,'')+'|'+normalizeSearch(a.formula);if(seen.has(key))return false;seen.add(key);return true;});
}
export function suggestedAttackSkill(attack: ParsedAttack): string {
 const text=normalizeSearch(attack.name);
 if(/arremess|granada|pedrada/.test(text))return 'Atletismo';
 if(/arco|besta|pistola|rifle|revolver|espingarda|metralha|laser|canhao|tiro|disparo/.test(text)||/alcance\s*\d+\/\d+/i.test(attack.originalText))return 'Atirar';
 return 'Lutar';
}
