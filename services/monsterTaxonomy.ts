import type { Monster } from '../types';
import { normalizeSearch } from './catalogSearch';

export const CREATURE_FAMILIES = [
  { id: 'soldier', name: 'Soldados e comandantes', group: 'Combatentes', description: 'Linha de frente, disciplina, proteção e liderança.', pattern: /soldad|guard(?:a|iao)|cavaleir|guerreir|capita|comandante|legionario|samurai|mercenario/ },
  { id: 'ranged', name: 'Atiradores', group: 'Combatentes', description: 'Pressão à distância e posições de tiro.', pattern: /atirador|arqueir|pistoleir|franco.atirador|mosqueteir|sniper/ },
  { id: 'assassin', name: 'Ladinos e assassinos', group: 'Combatentes', description: 'Infiltração, emboscadas e retirada.', pattern: /assassin|ladino|ninja|infiltrador|espiao|emboscada/ },
  { id: 'brute', name: 'Brutos e gigantes', group: 'Feras e colossos', description: 'Força, tamanho e impacto corpo a corpo.', pattern: /gigante|ogro|troll|colosso|brutamont|tit[aã]|esmagar/ },
  { id: 'predator', name: 'Feras e ataques naturais', group: 'Feras e colossos', description: 'Caça, mobilidade, mordidas e garras.', pattern: /predador|besta|animal|lobo|leao|tigre|urso|felino|mordida|garras|coice|chifres|presas|javali|mula|rinobisao|qilin/ },
  { id: 'swarm', name: 'Enxames', group: 'Feras e colossos', description: 'Ameaças coletivas combatidas com ataques de área.', pattern: /enxame|ameba|massa de insetos/ },
  { id: 'aquatic', name: 'Criaturas aquáticas', group: 'Feras e colossos', description: 'Combate submerso, natação e emboscadas na água.', pattern: /aquatic|anfibi|tubarao|polvo|kraken|sereia|crocodilo|marinho/ },
  { id: 'winged', name: 'Voadores e alados', group: 'Feras e colossos', description: 'Mobilidade aérea e ataques de mergulho.', pattern: /voo|voar|alado|harpia|aguia|morcego|grif[oã]|roc\b/ },
  { id: 'undead', name: 'Mortos-vivos', group: 'Sobrenaturais', description: 'Corpos reanimados, sentinelas e senhores das tumbas.', pattern: /morto.vivo|zumbi|esqueleto|vampiro|mumia|liche|lich\b|cadaver/ },
  { id: 'spirit', name: 'Espíritos e aparições', group: 'Sobrenaturais', description: 'Intangibilidade, medo e fraquezas sobrenaturais.', pattern: /etere|fantasma|espectro|aparicao|incorpore|assombracao|espirito/ },
  { id: 'demon', name: 'Demônios e horrores', group: 'Sobrenaturais', description: 'Terror, corrupção e ameaças extraplanares.', pattern: /demon|diabo|infernal|abissal|horror|aberracao/ },
  { id: 'construct', name: 'Constructos e máquinas', group: 'Naturezas especiais', description: 'Autômatos, sentinelas, robôs e golens.', pattern: /construct|construt|golem|robo|androide|mecaniz|automato|mecha/ },
  { id: 'elemental', name: 'Elementais', group: 'Naturezas especiais', description: 'Corpos elementais e domínio de uma energia.', pattern: /elemental|corpo de fogo|corpo de agua|forma elemental/ },
  { id: 'plant', name: 'Plantas e fungos', group: 'Naturezas especiais', description: 'Controle de terreno, vinhas e proteção de território.', pattern: /planta|fungo|vegetal|arvore|trepadeira|vinha|\bente\b/ },
  { id: 'dragon', name: 'Dragões', group: 'Naturezas especiais', description: 'Escamas, voo e sopro, da cria ao ancestral.', pattern: /dragao|dragoes|wyvern/ },
  { id: 'mage', name: 'Magos e arcanistas', group: 'Conjuradores', description: 'Magia ofensiva, proteção e controle arcano.', pattern: /mago|magia|feiticeir|brux|conjurar|conjuracao|arcan|necromante/ },
  { id: 'priest', name: 'Sacerdotes e xamãs', group: 'Conjuradores', description: 'Cura, bênçãos, proteção e apoio ao grupo.', pattern: /sacerdot|clerig|xama|druida|milagre|curandeir|fe\s+d\d|paladino/ },
  { id: 'psion', name: 'Psiônicos', group: 'Conjuradores', description: 'Percepção mental, telecinese e influência.', pattern: /psion|telepat|telecines|telecinet|mentalista|domina.*mental/ },
] as const;
export type CreatureFamilyId = typeof CREATURE_FAMILIES[number]['id'];

/** Suggested roles, not canonical creature types or official encounter ratings.
 * Identity and named mechanics carry more weight than prose. Never infer from lore.
 */
export function classifyMonster(monster: Monster): CreatureFamilyId[] {
  if (monster.referenceOnly) return [];
  const skills = monster.skills || [];
  const abilities = monster.abilities || [];
  const identity = normalizeSearch(`${monster.name} ${monster.race} ${monster.archetype}`);
  const mechanics = normalizeSearch([...skills, ...abilities.map(a => a.name), monster.powers || '', monster.weapons || ''].join(' '));
  const namedAbilities = abilities.map(a => normalizeSearch(a.name));
  const scored = CREATURE_FAMILIES.map(f => {
    let mechanicMatch = f.pattern.test(mechanics);
    // Summoning a swarm or controlling plants does not change the caster's body.
    if (f.id === 'swarm') mechanicMatch = namedAbilities.some(n => /^(enxame|corpo coletivo)(\b|$)/.test(n));
    if (f.id === 'plant') mechanicMatch = namedAbilities.some(n => /^(planta|vegetal|corpo vegetal|camuflagem vegetal)(\b|$)/.test(n));
    if (f.id === 'dragon') mechanicMatch = false;
    if (f.id === 'mage') mechanicMatch = skills.some(s => /conjurar|conjuracao|feiticaria/.test(normalizeSearch(s))) || namedAbilities.some(n => /^(magia|poderes arcanos)$/.test(n));
    return {id:f.id,score:(f.pattern.test(identity)?4:0)+(mechanicMatch?2:0)};
  }).filter(f => f.score > 0);
  const presetFamily = CREATURE_FAMILIES.find(f => monster.templateId?.startsWith(`${f.id}-`));
  if (presetFamily && !scored.some(f => f.id === presetFamily.id)) scored.push({id:presetFamily.id,score:5});
  if (!scored.length) {
    // Fallback based on actual skill dice, never on an absent race or narrative.
    const value = (pattern: RegExp) => Math.max(0, ...skills.filter(s => pattern.test(normalizeSearch(s))).map(s => Number(s.match(/d(\d+)/i)?.[1] || 0)));
    const shooting = value(/atirar|arremessar/), fighting = value(/lutar/);
    if (shooting && shooting > fighting) return ['ranged'];
    if (fighting) return ['soldier'];
    return [];
  }
  const origin = CREATURE_FAMILIES.find(f => monster.templateId?.startsWith(`${f.id}-`));
  return [...new Set([...(origin ? [origin.id] : []), ...scored.sort((a,b) => b.score - a.score).map(f => f.id)])];
}
