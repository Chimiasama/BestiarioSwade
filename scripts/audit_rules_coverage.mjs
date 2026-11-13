import {build} from 'esbuild';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const tmp=await mkdtemp(join(tmpdir(),'rule-coverage-'));
try{
 const outfile=join(tmp,'audit.mjs');await build({stdin:{contents:"export {monsters} from './services/monsterData';export {findReferenceMatches,splitReferenceTerms,powerReferenceTerm,powerReferenceKind} from './services/rulesReference';export {scenarioName} from './services/scenarioService';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile,logLevel:'silent'});
 const {monsters,findReferenceMatches,splitReferenceTerms,powerReferenceTerm,powerReferenceKind,scenarioName}=await import(outfile);
 const totals={},missing=new Map();
 for(const m of monsters){
  const terms=[...['Agilidade','Astúcia','Espírito','Força','Vigor'].map(term=>({kind:'attribute',term})),...m.skills.map(term=>({kind:'skill',term})),...(m.advantages||[]).flatMap(splitReferenceTerms).map(term=>({kind:'advantage',term})),...(m.complications||[]).flatMap(splitReferenceTerms).map(term=>({kind:'hindrance',term})),...splitReferenceTerms(m.powers||'').map(term=>({kind:powerReferenceKind(powerReferenceTerm(term),m.sourcebook),term:powerReferenceTerm(term)}))];
  for(const {kind,term} of terms){totals[kind]??={total:0,matched:0};totals[kind].total++;if(findReferenceMatches(term,kind,m.sourcebook).length)totals[kind].matched++;else {const key=`${kind}|${term}`;const row=missing.get(key)||{kind,term,count:0};row.count++;missing.set(key,row);}}
 }
 const report={monsters:monsters.length,totals,unmatched:[...missing.values()].sort((a,b)=>b.count-a.count||a.term.localeCompare(b.term))};
 await writeFile('data/rulesCoverageAudit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({totals,unmatched:report.unmatched.slice(0,35)},null,2));
}finally{await rm(tmp,{recursive:true,force:true});}
