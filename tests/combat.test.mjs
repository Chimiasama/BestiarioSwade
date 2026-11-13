import {test} from 'node:test';import assert from 'node:assert/strict';
import {build} from 'esbuild';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const temp=await mkdtemp(join(tmpdir(),'combat-tests-'));let lib;
try{const outfile=join(temp,'combat.mjs');await build({stdin:{contents:"export * from './services/diceService'; export * from './services/monsterAttacks'; export { monsters } from './services/monsterData';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile,logLevel:'silent'});lib=await import(outfile);}finally{await rm(temp,{recursive:true,force:true});}
const {rollTrait,rollDamage,parseWeaponAttacks,getMonsterAttacks,extractDamageFormula,monsters}=lib;
function randomSequence(values,callback){const original=Math.random;let index=0;Math.random=()=>{assert.ok(index<values.length,'rolled an unexpected extra die');return values[index++];};try{const r=callback();assert.equal(index,values.length);return r;}finally{Math.random=original;}}

test('damage adds every ace and both Strength and weapon dice, without rolling a Wild Die',()=>{
 const r=randomSequence([.99,.99,.2,.99,.3],()=>rollDamage('Garras','Força + d4','d8+2'));
 assert.equal(r.isDamage,true);assert.equal(r.rolls.length,2);
 assert.deepEqual(r.rolls[0].rolls,[8,8,2]);assert.deepEqual(r.rolls[1].rolls,[4,2]);
 assert.equal(r.modifier,2);assert.equal(r.finalTotal,26);assert.equal(r.resolvedFormula,'d8+2+d4');
});
test('negative damage modifiers and exactly one exploding raise d6 work',()=>{
 const r=randomSequence([.5,.3,.99,.2],()=>rollDamage('Espada','For+d4-2','d8',{raise:true,modifier:-1}));
 assert.equal(r.rolls.length,3);assert.deepEqual(r.rolls[2].rolls,[6,2]);assert.equal(r.modifier,-3);assert.equal(r.finalTotal,12);
});
test('attack combines built-in and situational modifiers once, compares target, and counts raises',()=>{
 const r=randomSequence([.6,.3],()=>rollTrait('Ataque','d8+2',true,4,-1));
 assert.equal(r.traitTotal,5);assert.equal(r.wildTotal,2);assert.equal(r.modifier,1);assert.equal(r.finalTotal,6);assert.equal(r.formula,'d8+1 (+Dado Selvagem d6)');assert.equal(r.isSuccess,true);assert.equal(r.raises,0);
 const raised=randomSequence([.99,.8],()=>rollTrait('Ataque','d8',false,4));
 assert.equal(raised.finalTotal,15);assert.equal(raised.raises,2);
});
test('critical failures cannot be overridden by a large bonus',()=>{
 const wild=randomSequence([0,0],()=>rollTrait('Ataque','d8',true,4,100));assert.equal(wild.isSuccess,false);assert.equal(wild.isCriticalFailure,true);
 const extra=randomSequence([0],()=>rollTrait('Ataque','d8',false,4,100));assert.equal(extra.isSuccess,false);assert.equal(extra.isCriticalFailure,true);
});
test('weapon parser keeps commas within parentheses and invents no equipment damage',()=>{
 const entries=parseWeaponAttacks('Espada (For+d6), Arco (2d6, Alcance 12/24/48); Armadura (+2); Mochila');
 assert.equal(entries.length,2);assert.equal(entries[0].name,'Espada');assert.equal(entries[1].name,'Arco');assert.equal(entries[1].formula,'2d6');assert.match(entries[1].originalText,/12\/24\/48/);
 assert.equal(extractDamageFormula('Teste de Vigor d6'),null);assert.equal(extractDamageFormula('Força para agarrar'),null);
});
test('natural attacks are recognized from abilities, without converting unrelated abilities into damage',()=>{
 const m={...monsters[0],weapons:'Armadura (+2)',abilities:[{name:'Garras',description:'Causam For+d4 de dano.'},{name:'Visão no escuro',description:'Perceber d8'},{name:'Veneno',description:'Teste de Vigor d6.'}]};
 assert.deepEqual(getMonsterAttacks(m).map(a=>[a.name,a.formula]),[['Garras','For+d4']]);
});
test('invalid damage is rejected instead of silently rolling a different expression',()=>{
 for(const formula of ['qualquer coisa','For+banana','3d6 dano','99d6','d6-d4','2d7']) assert.throws(()=>rollDamage('Inválido',formula));
});
test('all catalog entries can be scanned for attacks',()=>{
 let withAttacks=0,naturalOnly=0;
 for(const m of monsters){const a=getMonsterAttacks(m);if(a.length){withAttacks++;if(!m.weapons)naturalOnly++;}}
 assert.ok(withAttacks>500);assert.ok(naturalOnly>100);
 console.log(`Coverage: ${withAttacks} creatures with recognized damage; ${naturalOnly} have no weapons field.`);
});

test('explosions are not silently truncated after twenty maximum faces',()=>{
 const r=randomSequence([...Array(22).fill(.99),.1],()=>rollDamage('Explosões','d8'));
 assert.equal(r.rolls[0].rolls.length,23);assert.equal(r.finalTotal,177);
});
