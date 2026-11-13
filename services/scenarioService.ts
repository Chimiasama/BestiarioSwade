import { normalizeSearch } from './catalogSearch';
import type { Monster } from '../types';

/** UI grouping only: never discard the actual book, page or source reference. */
export function sourcebookLabel(source?: string): string {
 const name=(source||'Outros Suplementos').trim();
 return ['core rules','swade basico','livro basico'].includes(normalizeSearch(name))?'Livro Básico':name;
}
export function scenarioName(source?: string): string {
 const name=sourcebookLabel(source),key=normalizeSearch(name).replace(/[&_]/g,' ');
 if(/cidade.*sol.*vapor|cidade sol vapor/.test(key))return 'Cidade do Sol a Vapor';
 if(/arte da guerra|diario do kui/.test(key))return 'Arte da Guerra';
 if(/deadlands/.test(key))return 'Deadlands: O Oeste Estranho';
 if(/crystal heart/.test(key))return 'Crystal Heart';
 if(/pathfinder/.test(key))return 'Pathfinder para Savage Worlds';
 if(/havenwood/.test(key))return 'Havenwood';
 if(/fantasia/.test(key))return 'Fantasia';
 if(/horror/.test(key))return 'Horror';
 if(/sci.?fi|ficcao cientifica/.test(key))return 'Ficção Científica';
 if(/superpoder|^super$/.test(key))return 'Superpoderes';
 if(/wiseguys/.test(key))return 'Wiseguys';
 return name;
}
export function groupByScenario(monsters: Monster[]): [string,Monster[]][] {
 const groups=new Map<string,Monster[]>();
 for(const m of monsters){const name=scenarioName(m.sourcebook);const group=groups.get(name);if(group)group.push(m);else groups.set(name,[m]);}
 return [...groups].sort(([a],[b])=>a.localeCompare(b,'pt-BR'));
}
export const RULE_BOOK_LABELS: Record<string,string> = {
 BASICO:'Livro Básico', FANTASIA:'Fantasia', HORROR:'Horror', SCI_FI:'Ficção Científica', SUPER:'Superpoderes',
 ARTE_DA_GUERRA:'Arte da Guerra', CIDADE_SOL_VAPOR:'Cidade do Sol a Vapor', DEADLANDS:'Deadlands: O Oeste Estranho',
 CRYSTAL_HEART:'Crystal Heart', PATHFINDER:'Pathfinder para Savage Worlds', HAVENWOOD:'Havenwood', WISEGUYS:'Wiseguys', BESTIARIO:'Resumo do Bestiário',
};
export function scenarioRuleCode(source?:string):string|undefined {
 const scenario=scenarioName(source);
 return Object.entries(RULE_BOOK_LABELS).find(([,label])=>label===scenario)?.[0];
}
