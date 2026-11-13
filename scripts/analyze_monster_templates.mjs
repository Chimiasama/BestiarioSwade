// Reproducible scan of every built-in creature. No changes to source stat blocks.
import { build } from 'esbuild';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const tmp=await mkdtemp(join(tmpdir(),'bestiary-analysis-'));
try {
 const entry=`import {monsters} from './services/monsterData'; import {CREATURE_FAMILIES,classifyMonster} from './services/monsterTaxonomy'; export {monsters,CREATURE_FAMILIES,classifyMonster};`;
 const output=join(tmp,'corpus.mjs');
 await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:output,logLevel:'silent'});
 const {monsters,CREATURE_FAMILIES,classifyMonster}=await import(output);
 const complete=monsters.filter(m=>!m.referenceOnly);
 const numeric=value=>{ const m=String(value).match(/^\s*(-?\d+)/);return m?Number(m[1]):null; };
 const distribution=values=>{ const v=values.filter(n=>n!==null).sort((a,b)=>a-b);const at=p=>v.length?v[Math.floor((v.length-1)*p)]:null;return {count:v.length,min:at(0),p25:at(.25),median:at(.5),p75:at(.75),max:at(1)}; };
 const entries=monsters.map(m=>({id:m.id,name:m.name,sourcebook:m.sourcebook,referenceOnly:!!m.referenceOnly,families:classifyMonster(m)}));
 const counts=key=>Object.entries(complete.flatMap(m=>key(m)).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([name,count])=>({name,count}));
 const report={version:1,method:'Sugestão por identidade, perícias e nomes de habilidades; múltiplos papéis possíveis. Sem inferência pelo histórico. Referências sem ficha excluídas das estatísticas. Não é taxonomia oficial nem cálculo de dificuldade.',total:monsters.length,complete:complete.length,references:monsters.length-complete.length,unclassified:entries.filter(m=>!m.referenceOnly&&!m.families.length).length,
 distributions:{toughness:distribution(complete.map(m=>numeric(m.toughness))),parry:distribution(complete.map(m=>numeric(m.parry))),size:distribution(complete.map(m=>m.size??null))},
 abilities:counts(m=>m.abilities.map(a=>a.name)),attributes:Object.fromEntries(['agility','cunning','spirit','strength','vigor'].map(k=>[k,counts(m=>[m.attributes[k]])])),
 families:CREATURE_FAMILIES.map(f=>{const members=complete.filter(m=>classifyMonster(m).includes(f.id));return {id:f.id,name:f.name,group:f.group,count:members.length,toughness:distribution(members.map(m=>numeric(m.toughness))),examples:members.slice(0,5).map(m=>({id:m.id,name:m.name,sourcebook:m.sourcebook}))};}),entries};
 const {entries: auditEntries,...summary}=report;
 await writeFile('data/templateFamilySummary.json',JSON.stringify(summary,null,2)+'\n');
 await writeFile('data/templateCatalogAnalysis.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({total:report.total,complete:report.complete,references:report.references,unclassified:report.unclassified,distributions:report.distributions,families:report.families.map(({id,count,toughness})=>({id,count,medianToughness:toughness.median}))},null,2));
} finally {await rm(tmp,{recursive:true,force:true});}
