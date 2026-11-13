import React, { useState, useRef, useEffect } from 'react';
import type { Monster, ParsedAttack, TraitRollResult, DamageRollResult } from '../types';
import { rollTrait, rollDamage, saveDiceRollToSessionHistory } from '../services/diceService';
import { suggestedAttackSkill } from '../services/monsterAttacks';
import { normalizeSearch } from '../services/catalogSearch';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { useBackNavigation } from '../hooks/useBackNavigation';

export function AttackRollModal({monster,attack,damageOnly=false,initialModifier=0,onClose}:{monster:Monster;attack:ParsedAttack;damageOnly?:boolean;initialModifier?:number;onClose:()=>void}){
 const ref=useDialogAccessibility(true);useBackNavigation(true,onClose,110);
 const skills=(monster.skills||[]).flatMap(s=>{const m=s.match(/^(.*?)\s+(d\d+(?:\s*[+-]\s*\d+)?)/i);return m?[{name:m[1],formula:m[2].replace(/\s/g,'')}]:[];});
 const suggested=suggestedAttackSkill(attack);
 const options=[...skills,{name:'Sem treino',formula:'d4-2'}];
 const [skill,setSkill]=useState(()=>String(options.findIndex(s=>normalizeSearch(s.name)===normalizeSearch(suggested))>=0?options.findIndex(s=>normalizeSearch(s.name)===normalizeSearch(suggested)):options.length-1));
 const [target,setTarget]=useState('4');const [modifier,setModifier]=useState(String(initialModifier));
 const [formula,setFormula]=useState(attack.formula);const [damageModifier,setDamageModifier]=useState('0');
 const [manualRaise,setManualRaise]=useState(false);
 const [autoDamage,setAutoDamage]=useState(true);
 const [hit,setHit]=useState<TraitRollResult|null>(null);const [damage,setDamage]=useState<DamageRollResult|null>(null);const [error,setError]=useState('');
 const resultRef=useRef<HTMLElement>(null);
 useEffect(()=>{if(hit||damage)resultRef.current?.scrollIntoView({block:'nearest',behavior:'instant'});},[hit,damage]);
 const reset=()=>{setHit(null);setDamage(null);setError('');};
 const validInteger=(text:string)=>text.trim()!==''&&Number.isSafeInteger(Number(text))&&Math.abs(Number(text))<=1000;
 const attackValid=validInteger(target)&&Number(target)>=2&&validInteger(modifier);
 const doAttack=()=>{
  if(!attackValid)return;
  const result=rollTrait(`${monster.name} — ${attack.name}`,options[Number(skill)].formula,!!monster.isWildCard,Number(target),Number(modifier)) as TraitRollResult;
  setHit(result);setDamage(null);setError('');saveDiceRollToSessionHistory(result);
  if(result.isSuccess&&autoDamage)doDamage(result);
 };
 const doDamage=(attackResult:TraitRollResult|null=hit)=>{
  if(!validInteger(damageModifier))return;
  try{
   const result=rollDamage(`${monster.name} — ${attack.name}`,formula,monster.attributes.strength,{modifier:Number(damageModifier),raise:damageOnly?manualRaise:!!attackResult&&attackResult.raises>0,spiritDie:monster.attributes.spirit,agilityDie:monster.attributes.agility});
   setDamage(result);setError('');saveDiceRollToSessionHistory(result);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível rolar o dano.');}
 };
 return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="attack-title" className="fixed inset-0 z-[115] flex items-center justify-center p-3" style={{background:'var(--modal-backdrop)'}}>
  <section className="combat-dialog max-w-xl w-full max-h-[90dvh] overflow-y-auto rounded-xl border border-stone-700 bg-stone-950 p-4 space-y-4">
   <header className="sticky top-0 z-10 bg-stone-950 py-2 flex items-start justify-between gap-3"><div><h2 id="attack-title" className="font-cinzel font-bold text-xl text-amber-200">{damageOnly?'Dano':'Atacar'}: {attack.name}</h2><p className="text-sm text-stone-400">{monster.name} · {monster.isWildCard?'Carta Selvagem':'Extra'}</p></div><button type="button" onClick={onClose} aria-label="Fechar ataque" className="min-h-11 min-w-11 rounded-lg border border-stone-700">✕</button></header>
   <details><summary className="min-h-11 py-2 cursor-pointer text-sm">Descrição do ataque</summary><p className="text-sm text-stone-300">{attack.originalText}</p></details>
   {!damageOnly&&<>
    <div className="grid grid-cols-2 gap-3">
     <label className="col-span-2 text-sm">Perícia de ataque<select className="template-field" value={skill} onChange={e=>{setSkill(e.target.value);reset();}}>{options.map((s,i)=><option key={i} value={i}>{s.name} {s.formula}</option>)}</select></label>
     <label className="text-sm">Dificuldade<input className="template-field" type="number" min="2" max="1000" step="1" value={target} onChange={e=>{setTarget(e.target.value);reset();}}/></label>
     <label className="text-sm">Modificador do ataque<input className="template-field" type="number" min="-1000" max="1000" step="1" value={modifier} onChange={e=>{setModifier(e.target.value);reset();}}/></label>
    </div>
    <p className="text-xs text-stone-400">Corpo a corpo: informe Aparar do alvo. À distância: normalmente 4; ajuste cobertura, alcance e outras condições no modificador. Confira a perícia para ataques especiais.</p>
    {!!initialModifier&&<p className="text-xs text-stone-400">O modificador começou em {initialModifier} pelos marcadores de ferimentos/fadiga da ficha. Você pode ajustar o total acima.</p>}
    <p className="text-xs text-stone-400">{monster.isWildCard?'Rola a perícia e d6 Selvagem, usando o maior resultado.':'Rola somente a perícia, sem Dado Selvagem.'} Dados máximos explodem.</p>
    <label className="flex items-center gap-2 min-h-11 text-sm"><input type="checkbox" checked={autoDamage} onChange={e=>setAutoDamage(e.target.checked)}/>Rolar dano automaticamente ao acertar</label>
    <button type="button" className="combat-primary w-full min-h-12 rounded-lg font-bold" disabled={!attackValid||(autoDamage&&!validInteger(damageModifier))} onClick={doAttack}>{hit?'Atacar novamente':'Rolar ataque'}</button>
    {hit&&<section ref={resultRef} role="status" aria-label="Resultado do ataque" className="rounded-lg border border-stone-700 p-3 space-y-1">
     <p className="font-bold text-lg">{hit.isCriticalFailure?'Falha crítica':hit.isSuccess?hit.raises>0?'Acertou com ampliação':'Acertou':'Errou'} · {hit.finalTotal} contra {hit.targetNumber}</p>
     <p className="text-sm">Perícia: {hit.traitRolls.join(' + ')}{hit.wildRolls?` · Selvagem: ${hit.wildRolls.join(' + ')}`:''} · Modificador total: {hit.modifier>=0?'+':''}{hit.modifier}</p>
     {damage&&<p className="font-bold">Dano causado: {damage.finalTotal} · sem Dado Selvagem</p>}
     {hit.raises>0&&<p className="text-sm">{hit.raises} ampliação(ões): +1d6 no dano, independentemente da quantidade.</p>}
    </section>}
   </>}
   <div className="border-t border-stone-700 pt-4 space-y-3">
    <div className="grid grid-cols-2 gap-3"><label className="text-sm">Fórmula de dano<input className="template-field" value={formula} onChange={e=>{setFormula(e.target.value);setDamage(null);setError('');}}/></label><label className="text-sm">Modificador do dano<input className="template-field" type="number" step="1" min="-1000" max="1000" value={damageModifier} onChange={e=>{setDamageModifier(e.target.value);setDamage(null);}}/></label></div>
    <p className="text-xs text-stone-400">Força {monster.attributes.strength}. O dano soma todos os dados e suas explosões, sem Dado Selvagem. Bônus de ampliação: um d6 adicional, também explosivo.</p>
    {damageOnly&&<label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" checked={manualRaise} onChange={e=>{setManualRaise(e.target.checked);setDamage(null);}}/>Adicionar d6 de ampliação</label>}
    <button type="button" disabled={!validInteger(damageModifier)||(!damageOnly&&!hit?.isSuccess)} onClick={()=>doDamage()} className="combat-primary w-full min-h-12 rounded-lg font-bold">{damage?'Rolar dano novamente':'Rolar dano'}{!damageOnly&&!!hit?.raises?' (+d6)':''}</button>
    {!damageOnly&&!hit?.isSuccess&&<p className="text-xs text-stone-400">O dano fica disponível depois de um ataque bem-sucedido. Para dano automático, use “Dano direto” na ficha.</p>}
    {error&&<p role="alert" className="text-red-400 text-sm">{error}</p>}
    {damage&&<section ref={damageOnly?resultRef:undefined} role="status" aria-label="Resultado do dano" className="border border-stone-700 rounded-lg p-3 space-y-1"><h3 className="font-bold text-xl">Dano total: {damage.finalTotal}</h3><p className="text-sm">{damage.resolvedFormula} · Sem Dado Selvagem</p>{damage.rolls.map((d,i)=><p key={i} className="text-sm">d{d.sides}: {d.rolls.join(' + ')} = {d.total}{d.rolls.length>1?' · Explodiu':''}</p>)}<p className="text-sm">Modificador: {damage.modifier>=0?'+':''}{damage.modifier}</p><p className="text-xs text-stone-400">Compare com Resistência e armadura do alvo; ferimentos não são aplicados automaticamente.</p></section>}
   </div>
  </section>
 </div>;
}
