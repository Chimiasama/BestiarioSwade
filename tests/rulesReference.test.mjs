import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {mkdtemp,rm,readFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const tmp=await mkdtemp(join(tmpdir(),'reference-tests-'));let lib;
try{const outfile=join(tmp,'reference.mjs');await build({stdin:{contents:"export * from './services/rulesReference';export * from './services/scenarioService';export {monsters} from './services/monsterData';export {getAllLocalMonsters} from './services/customMonsterService';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile,logLevel:'silent'});lib=await import(outfile);}finally{await rm(tmp,{recursive:true,force:true});}
const {RULE_INDEX,RULE_KINDS,findReferenceMatches,searchReferences,loadReferenceKind,splitReferenceTerms,groupByScenario,scenarioName,sourcebookLabel,monsters,getAllLocalMonsters}=lib;

test('one tile per scenario preserves every creature and its specific source',()=>{
 const groups=groupByScenario(monsters);assert.equal(new Set(groups.map(([n])=>n)).size,groups.length);
 assert.equal(groups.flatMap(([,m])=>m).length,monsters.length);
 const city=groups.find(([n])=>n==='Cidade do Sol a Vapor')[1];
 assert.ok(city.length>=45);assert.ok(new Set(city.map(m=>m.sourcebook)).size>=3);
 assert.ok(city.some(m=>/Criador/.test(m.sourcebook)));assert.ok(city.some(m=>/Mortais/.test(m.sourcebook)));
 assert.equal(scenarioName('Arte da Guerra — Diário do Kui'),scenarioName('Arte da Guerra (ADG)'));
 assert.equal(scenarioName('Deadlands — Compêndio'),scenarioName('Deadlands: O Oeste Estranho'));
 assert.equal(sourcebookLabel('Core Rules'),'Livro Básico');assert.equal(scenarioName('Core Rules'),'Livro Básico');
 assert.equal(scenarioName('Meu cenário personalizado'),'Meu cenário personalizado');
});
test('old local databases display Livro Básico without overwriting stored work',()=>{
 const old=globalThis.localStorage;const stored=JSON.stringify([{...monsters[0],id:'custom-local',name:'Meu trabalho',sourcebook:'Core Rules',history:'Preservar'}]);
 globalThis.localStorage={getItem:()=>stored,setItem:()=>assert.fail('reading must not rewrite local work')};
 try{const result=getAllLocalMonsters();assert.equal(result[0].name,'Meu trabalho');assert.equal(result[0].history,'Preservar');assert.equal(result[0].sourcebook,'Livro Básico');assert.match(stored,/Core Rules/);}finally{globalThis.localStorage=old;}
});
test('every source record has a complete local definition and a traceable origin',async()=>{
 const audit=JSON.parse(await readFile('data/rulesImportAudit.json','utf8'));
 const entries=(await Promise.all(Object.keys(RULE_KINDS).map(loadReferenceKind))).flat();
 assert.equal(entries.length,RULE_INDEX.length);assert.equal(entries.length,audit.uniqueEntries);assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
 const origins=new Set();for(const entry of entries){assert.ok(entry.description.trim());assert.ok(entry.name&&entry.books.length);assert.ok(RULE_INDEX.some(i=>i.id===entry.id));for(const origin of entry.origins)if(origin.index!==null)origins.add(`${origin.file}:${origin.index}`);}
 assert.equal(origins.size,audit.inputRecords);
 for(const source of audit.sources){assert.equal(source.sha256.length,64);for(let i=0;i<source.records;i++)assert.ok(origins.has(`${source.file}:${i}`));}
});
test('touch lookup ignores accents and dice, keeps rule categories separate and prefers the creature setting',()=>{
 const mighty=findReferenceMatches('Golpe Poderoso','advantage','Cidade do Sol & Vapor — Livro do Criador');assert.ok(mighty.length);assert.ok(mighty[0].books.includes('CIDADE_SOL_VAPOR'));
 const skill=findReferenceMatches('Lutar d8','skill','Crystal Heart');assert.ok(skill.length);assert.ok(skill[0].books.includes('CRYSTAL_HEART'));
 assert.equal(findReferenceMatches('Esperteza d6','attribute')[0].name,'Astúcia');
 assert.ok(findReferenceMatches('Curar','skill').every(e=>e.kind==='skill'));assert.ok(findReferenceMatches('Curar','power').every(e=>e.kind==='power'));
 assert.deepEqual(findReferenceMatches('Vantagem inventada sem definição','advantage'),[]);
 assert.ok(searchReferences('golpe poderoso','advantage').length>0);
});
test('severity qualifiers and multiple setting versions are not collapsed into an arbitrary definition',async()=>{
 const candidates=findReferenceMatches('Arrogante (Maior)','hindrance');assert.ok(candidates.length);assert.ok(candidates[0].severity.includes('maior'));
 const matching=findReferenceMatches('Lutar','skill');assert.ok(matching.length>1);
 const entries=await loadReferenceKind('skill');assert.ok(new Set(matching.map(m=>entries.find(e=>e.id===m.id).description)).size>1);
});
test('power lists and nested qualifiers stay intact without treating Power Points as a power',()=>{
 assert.deepEqual(splitReferenceTerms('Projétil (2d6, alcance 12/24/48), Proteção; 10 Pontos de Poder.'),['Projétil (2d6, alcance 12/24/48)','Proteção']);
 assert.ok(findReferenceMatches('Antecedente Arcano (Magia)','advantage').length);
});

test('abbreviated skills and named variants resolve without conflating arcane powers and superpowers',()=>{
 assert.equal(findReferenceMatches('Conhec. Geral d8','skill')[0].name,'Conhecimento Geral');
 const jutsu=findReferenceMatches('Jutsu (natural) d6','skill','Arte da Guerra — Diário do Kui');assert.ok(jutsu.length);assert.ok(jutsu.every(e=>e.books.includes('ARTE_DA_GUERRA')));
 assert.ok(searchReferences('Jutsu','skill').length);
 assert.ok(findReferenceMatches('Nervos de Aço Aprimorado','advantage').some(e=>e.name==='NERVOS DE AÇO APRIMORADOS'));
 assert.ok(findReferenceMatches('detectar arcano','power').length);
 assert.equal(lib.powerReferenceKind('banir','Compêndio de Superpoderes'),'power');
 assert.equal(lib.powerReferenceKind('Telecinese','Compêndio de Superpoderes'),'superpower');
 assert.equal(lib.powerReferenceTerm('Projétil 2d6'),'Projétil');
 assert.equal(lib.powerReferenceTerm('Projétil (2d6, alcance 12/24/48)'),'Projétil (2d6, alcance 12/24/48)');
});

test('numeric racial variants are not substituted for different damage or armor values',()=>{
 assert.ok(findReferenceMatches('Garras (For+d4)','ability').length);
 assert.deepEqual(findReferenceMatches('Garras (For+d12)','ability'),[]);
 assert.deepEqual(findReferenceMatches('Armadura +9','ability'),[]);
});
