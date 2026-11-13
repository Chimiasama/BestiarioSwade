import rawIndex from '../data/rules/index.json';
import { normalizeSearch } from './catalogSearch';
import { scenarioRuleCode } from './scenarioService';
export type RuleKind='advantage'|'hindrance'|'power'|'superpower'|'skill'|'attribute'|'ability'|'rule';
export interface RuleIndexEntry {id:string;name:string;kind:RuleKind;books:string[];aliases:string[];severity:string;}
export interface RuleEntry extends Omit<RuleIndexEntry,'severity'> {description:string;summary:string;details:{label:string;value:string}[];modifiers:{name:string;cost?:string;description:string}[];origins:{file:string;index:number|null;sourceId:string}[];}
export const RULE_KINDS: Record<RuleKind,string>={advantage:'Vantagem',hindrance:'Complicação',power:'Poder',superpower:'Superpoder',skill:'Perícia',attribute:'Atributo',ability:'Habilidade racial',rule:'Regra'};
export const RULE_INDEX=rawIndex as RuleIndexEntry[];
const key=(value:string)=>normalizeSearch(value).replace(/[^a-z0-9]+/g,' ').trim();
const aliases:Record<string,string>={esperteza:'astucia',inteligencia:'astucia',batalha:'conhecimento de batalha',ciencias:'ciencia',conjuracao:'conjurar',psionico:'psionicos','conhecimento batalha':'conhecimento de batalha'};
export function referenceKey(value:string):string {
 const clean=key(value.replace(/\s+d\d+(?:\s*[+-]\s*\d+)?(?:\s*\([^)]*\))?\s*$/i,''));
 return aliases[clean]||clean;
}
const indexed=RULE_INDEX.map(entry=>({entry,key:referenceKey(entry.name),base:referenceKey(entry.name.replace(/\([^)]*\)/g,'')),aliases:entry.aliases.map(referenceKey)}));
const relevant=(entry:RuleIndexEntry,source?:string)=>entry.books.includes(scenarioRuleCode(source)||'')?20:entry.books.includes('BASICO')?10:0;
const kindAliases:Partial<Record<RuleKind,Record<string,string>>>={
 skill:{'conhec geral':'conhecimento geral','conhecimento comum':'conhecimento geral','conhec academico':'conhecimento academico','conhecimentos academicos':'conhecimento academico','conhec batalha':'conhecimento de batalha',idioma:'idiomas',cura:'curar',jutsu:'lutar'},
 advantage:{'nervos de aco aprimorado':'nervos de aco aprimorados','mantenha a formacao':'mantenham a formacao',ambidestria:'ambidestro','bloqueio aprimorado':'bloquear aprimorado','reflexos em combate':'reflexos de combate'},
 power:{velocidade:'morosidade velocidade',morosidade:'morosidade velocidade',lentidao:'lentidao velocidade','aumentar diminuir caracteristica':'aumentar reduzir caracteristica','detectar arcano':'detectar ocultar arcano','ocultar arcano':'detectar ocultar arcano'},
};
export function findReferenceMatches(term:string,kind?:RuleKind,source?:string):RuleIndexEntry[]{
 const raw=referenceKey(term),base=referenceKey(term.replace(/\([^)]*\)/g,''));
 const severity=normalizeSearch(term).match(/\((menor|maior)\)/)?.[1];
 const candidates=indexed.flatMap(x=>{
  if(kind&&x.entry.kind!==kind)return [];
  const map=kindAliases[x.entry.kind]||{},exact=map[raw]||raw,simple=map[base]||base;
  if(x.entry.kind==='skill'&&base==='jutsu'&&!x.entry.books.includes('ARTE_DA_GUERRA'))return [];
  if(x.entry.kind==='ability'&&/\d/.test(term)&&x.key!==exact&&!x.aliases.includes(exact))return [];
  if(x.key!==exact&&!x.aliases.includes(exact)&&x.base!==simple)return [];
  return [{entry:x.entry,score:(x.key===exact?100:0)+relevant(x.entry,source)+(severity&&x.entry.severity.includes(severity)?5:0)}];
 });
 return candidates.sort((a,b)=>b.score-a.score||a.entry.name.localeCompare(b.entry.name,'pt-BR')).map(x=>x.entry);
}
export function powerReferenceTerm(term:string):string {
 return term.replace(/\s+\d*d\d+(?:\s*[+-]\s*\d+)?\.?$/i,'').replace(/\.$/,'');
}
export function powerReferenceKind(term:string,source?:string):RuleKind {
 return scenarioRuleCode(source)==='SUPER'&&findReferenceMatches(term,'superpower',source).length?'superpower':'power';
}
export function searchReferences(term:string,kind?:RuleKind,source?:string):RuleIndexEntry[]{
 const tokens=key(term).split(' ').filter(Boolean);
 const exactIds=new Set(findReferenceMatches(term,kind,source).map(e=>e.id));
 return indexed.filter(x=>(!kind||x.entry.kind===kind)&&(exactIds.has(x.entry.id)||tokens.every(t=>`${x.key} ${x.aliases.join(' ')}`.includes(t))))
 .sort((a,b)=>Number(exactIds.has(b.entry.id))-Number(exactIds.has(a.entry.id))||relevant(b.entry,source)-relevant(a.entry,source)||a.entry.name.localeCompare(b.entry.name,'pt-BR')||a.entry.id.localeCompare(b.entry.id)).map(x=>x.entry);
}
const cache=new Map<RuleKind,Promise<RuleEntry[]>>();
export function loadReferenceKind(kind:RuleKind):Promise<RuleEntry[]> {
 if(!cache.has(kind)){
  const loaders={advantage:()=>import('../data/rules/advantage.json'),hindrance:()=>import('../data/rules/hindrance.json'),power:()=>import('../data/rules/power.json'),superpower:()=>import('../data/rules/superpower.json'),skill:()=>import('../data/rules/skill.json'),attribute:()=>import('../data/rules/attribute.json'),ability:()=>import('../data/rules/ability.json'),rule:()=>import('../data/rules/rule.json')};
  cache.set(kind,loaders[kind]().then(m=>m.default as unknown as RuleEntry[]).catch(e=>{cache.delete(kind);throw e;}));
 }
 return cache.get(kind)!;
}
export interface ReferenceRequest {term:string;kind?:RuleKind;sourcebook?:string;localText?:string;}
export function openRulesReference(request:ReferenceRequest={term:''}) {window.dispatchEvent(new CustomEvent('swade:reference',{detail:request}));}
/** Keep qualifiers and combined names intact; commas inside parentheses are not separators. */
export function splitReferenceTerms(value:string):string[]{
 const result:string[]=[];let part='',depth=0;
 for(const c of value){if(c==='(')depth++;if(c===')')depth=Math.max(0,depth-1);if(/[,;\n]/.test(c)&&!depth){if(part.trim())result.push(part.trim());part='';}else part+=c;}
 if(part.trim())result.push(part.trim());
 return result.filter(t=>!/^(?:\d+\s*(?:pontos de poder|pps?)|pontos de poder)/i.test(t));
}
