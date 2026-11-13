import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const tmp=await mkdtemp(join(tmpdir(),'template-tests-'));
let lib;
try {
 const outfile=join(tmp,'library.mjs');
 await build({stdin:{contents:"export * from './services/monsterTemplates'; export * from './services/monsterTaxonomy'; export { monsters } from './services/monsterData';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile,logLevel:'silent'});
 lib=await import(outfile);
} finally { await rm(tmp,{recursive:true,force:true}); }
const { MONSTER_PRESETS, CREATURE_FAMILIES, createTemplateDraft, classifyMonster, monsters }=lib;
const fresh=MONSTER_PRESETS.filter(p=>p.familyId!=='classic');

test('each family has four distinct progressing models and the seven classics remain available',()=>{
 assert.equal(MONSTER_PRESETS.length,79);
 assert.equal(new Set(MONSTER_PRESETS.map(p=>p.id)).size,79);
 for(const family of CREATURE_FAMILIES){
  const line=fresh.filter(p=>p.familyId===family.id);
  assert.deepEqual(line.map(p=>p.tier),[1,2,3,4]);
  assert.equal(new Set(line.map(p=>p.name)).size,4);
  for(let i=1;i<4;i++){
   assert.ok(Number.parseInt(line[i].template.toughness)>=Number.parseInt(line[i-1].template.toughness));
   assert.ok(line[i].template.abilities.length>line[i-1].template.abilities.length);
  }
 }
 assert.equal(fresh.filter(p=>p.template.isWildCard).length,36);
});
test('new stat blocks derive parry from Fighting and include armor, size and nature once',()=>{
 for(const p of fresh){
  const t=p.template, fighting=t.skills.match(/(?:^|, )Lutar d(\d+)/);
  assert.equal(t.parry,2+(fighting?Number(fighting[1])/2:0),p.id);
  const vigor=t.attributes.vigor.match(/d(\d+)(?:\+(\d+))?/);
  const armor=Number(t.toughness.match(/\((\d+)\)/)?.[1]||0);
  const nature=['undead','construct'].includes(p.familyId)?2:0;
  assert.equal(Number.parseInt(t.toughness),2+Math.floor((Number(vigor[1])+Number(vigor[2]||0))/2)+t.size+armor+nature,p.id);
  assert.ok(t.abilities.length&&t.complications&&t.weapons);
  const skills=t.skills.split(', ').map(s=>s.replace(/ d\d+.*$/,''));
  assert.equal(new Set(skills).size,skills.length,p.id);
 }
});
test('applying a template preserves identity but replaces mechanics and does not share mutable data',()=>{
 const current={...createTemplateDraft(MONSTER_PRESETS[0]),id:'custom-existing',name:'Meu guardião',history:'História própria',imageUrl:'/custom.png',isWildCard:false};
 const archmage=MONSTER_PRESETS.find(p=>p.id==='mage-4');
 const draft=createTemplateDraft(archmage,current);
 assert.equal(draft.id,current.id);assert.equal(draft.name,current.name);assert.equal(draft.history,current.history);assert.equal(draft.imageUrl,current.imageUrl);
 assert.equal(draft.isWildCard,true);assert.match(draft.powers,/30 Pontos/);assert.equal(draft.templateId,'mage-4');
 draft.attributes.cunning='d4';draft.abilities[0].name='Alterado';
 assert.equal(archmage.template.attributes.cunning,'d12');assert.notEqual(archmage.template.abilities[0].name,'Alterado');
});
test('classification excludes references and does not mistake common stealth or summoned plants for a creature nature',()=>{
 const base={...monsters[0],templateId:undefined,name:'Pessoa',race:'Não especificada',archetype:'Pessoa',skills:['Furtividade d6'],abilities:[],powers:'',weapons:''};
 assert.deepEqual(classifyMonster(base),[]);
 assert.ok(!classifyMonster({...base,abilities:[{name:'Controlar plantas',description:''}]}).includes('plant'));
 assert.ok(!classifyMonster({...base,abilities:[{name:'Invocar enxame',description:''}]}).includes('swarm'));
 assert.ok(classifyMonster({...base,templateId:'assassin-4'}).includes('assassin'));
 assert.deepEqual(classifyMonster({...base,referenceOnly:true,templateId:'mage-4'}),[]);
});
test('saved analysis accounts for every creature and matches the current classifier',async()=>{
 const audit=JSON.parse(await readFile('data/templateCatalogAnalysis.json','utf8'));
 assert.equal(audit.total,monsters.length);assert.equal(audit.entries.length,monsters.length);
 assert.equal(audit.complete+audit.references,audit.total);
 for(const m of monsters){const entry=audit.entries.find(e=>e.id===m.id);assert.ok(entry,m.id);assert.deepEqual(entry.families,classifyMonster(m),m.name);}
});

test('skills mentioned by unlocked abilities agree with the displayed stat block',()=>{
 const skill=(id)=>MONSTER_PRESETS.find(p=>p.id===id).template.skills;
 assert.match(skill('soldier-4'),/Batalha d12/);
 assert.match(skill('assassin-3'),/Ladinagem d10/);
 assert.match(skill('mage-4'),/Ocultismo d12/);
 assert.match(skill('priest-2'),/Persuadir d8/);
 assert.match(skill('elemental-3'),/Atirar d10/);
});
