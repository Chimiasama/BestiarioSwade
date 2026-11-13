import React, { useMemo, useState, useRef } from 'react';
import { X, BookOpen } from 'lucide-react';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { normalizeSearch } from '../services/catalogSearch';
import { CREATURE_FAMILIES } from '../services/monsterTaxonomy';
import { MONSTER_PRESETS, POWER_TIERS } from '../services/monsterTemplates';
import analysis from '../data/templateFamilySummary.json';

export function TemplatePicker({open,onClose,onSelect}:{open:boolean;onClose:()=>void;onSelect:(id:string)=>void}) {
 const ref=useDialogAccessibility(open);
 const previewRef=useRef<HTMLElement>(null);
 useBackNavigation(open,onClose,100);
 const [family,setFamily]=useState('soldier');
 const [tier,setTier]=useState('all');
 const [search,setSearch]=useState('');
 const [selectedId,setSelectedId]=useState('soldier-1');
 const candidates=useMemo(()=>MONSTER_PRESETS.filter(p=>(family==='all'||p.familyId===family)&&(tier==='all'||String(p.tier)===tier)&&normalizeSearch(`${p.name} ${p.familyName} ${p.summary}`).includes(normalizeSearch(search))),[family,tier,search]);
 const selected=candidates.find(p=>p.id===selectedId)||candidates[0];
 const corpus=analysis.families.find(f=>f.id===selected?.familyId);
 if(!open) return null;
 return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="template-library-title" className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-2 sm:p-5">
  <section className="template-library bg-stone-950 border border-stone-700 rounded-xl w-full max-w-5xl max-h-[92dvh] overflow-y-auto">
   <div className="sticky top-0 z-10 bg-stone-950 flex justify-between gap-3 p-4 border-b border-stone-700">
    <div><h2 id="template-library-title" className="font-cinzel text-xl font-bold text-amber-200">Biblioteca de modelos</h2><p className="text-sm text-stone-400 mt-1">72 novos modelos · 18 famílias · 4 patamares · 7 clássicos</p></div>
    <button type="button" onClick={onClose} aria-label="Fechar biblioteca de modelos" className="min-h-11 min-w-11 flex items-center justify-center self-start rounded-lg border border-stone-700"><X size={20}/></button>
   </div>
   <div className="p-4 space-y-4">
    <p className="text-sm text-stone-300">Escolha o papel e o patamar. Modelos editáveis; não equivalem a níveis oficiais de dificuldade. Carta Selvagem pode ser alterada depois.</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
     <label className="text-sm col-span-2 sm:col-span-1">Família<select className="template-field" aria-label="Família do modelo" value={family} onChange={e=>setFamily(e.target.value)}>
      <option value="all">Todas as famílias</option>
      {[...new Set(CREATURE_FAMILIES.map(f=>f.group))].map(group=><optgroup key={group} label={group}>{CREATURE_FAMILIES.filter(f=>f.group===group).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</optgroup>)}
      <option value="classic">Modelos clássicos</option>
     </select></label>
     <label className="text-sm">Patamar<select className="template-field" aria-label="Patamar do modelo" value={tier} onChange={e=>setTier(e.target.value)}><option value="all">Todos os patamares</option>{POWER_TIERS.map((name,i)=><option key={name} value={i+1}>{i+1} · {name}</option>)}<option value="0">Clássicos</option></select></label>
     <label className="text-sm">Buscar modelo<input type="search" className="template-field" aria-label="Buscar modelo" placeholder="Ex.: arquimago, enxame…" value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setFamily('all');}}/></label>
    </div>
    <p role="status" className="text-sm text-stone-400">{candidates.length} modelos encontrados</p>
    {!selected ? <div className="p-5 rounded-lg border border-stone-700"><p>Nenhum modelo corresponde aos filtros.</p><button type="button" className="min-h-11 underline" onClick={()=>{setFamily('all');setTier('all');setSearch('');}}>Limpar filtros de modelos</button></div> :
    <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 items-start">
     <div className="grid grid-cols-1 gap-2 max-h-72 md:max-h-[55vh] overflow-y-auto p-1" role="group" aria-label="Modelos disponíveis">
      {candidates.map(p=><button type="button" key={p.id} aria-pressed={p.id===selected.id} onClick={()=>{setSelectedId(p.id); if(window.matchMedia('(max-width: 767px)').matches) previewRef.current?.scrollIntoView({block:'start',behavior:'instant'});}} className={`template-option text-left rounded-lg border p-3 ${p.id===selected.id?'border-amber-500 bg-amber-900/20':'border-stone-700 bg-stone-900'}`}>
       <span className="font-semibold block">{p.name}</span><span className="text-xs text-stone-400 block mt-1">{p.tier?`${p.tier} · ${POWER_TIERS[p.tier-1]}`:'Clássico'} · {p.template.isWildCard?'Carta Selvagem':'Extra'}</span>
      </button>)}
     </div>
     <article ref={previewRef} aria-label="Prévia do modelo" className="rounded-lg border border-stone-700 p-4 space-y-3 min-w-0 scroll-mt-28">
      <div><h3 className="font-cinzel text-lg font-bold text-amber-200">{selected.name}</h3><p className="text-sm text-stone-400">{selected.summary}</p></div>
      <div className="flex flex-wrap gap-2 text-sm"><span>{selected.template.race}</span><span>· {selected.template.isWildCard?'Carta Selvagem':'Extra'}</span><span>· Tamanho {selected.template.size}</span></div>
      <dl className="grid grid-cols-3 gap-2 text-sm">{[['Mov.',selected.template.movement],['Aparar',selected.template.parry],['Resistência',selected.template.toughness]].map(([label,value])=><div key={label} className="border border-stone-700 rounded-lg p-2"><dt className="text-xs text-stone-400">{label}</dt><dd className="font-semibold break-words">{value}</dd></div>)}</dl>
      <p className="text-sm">{Object.entries(selected.template.attributes).map(([key,die])=>`${({agility:'Agilidade',cunning:'Astúcia',spirit:'Espírito',strength:'Força',vigor:'Vigor'} as Record<string,string>)[key]} ${die}`).join(' · ')}</p>
      <p className="text-sm"><strong>Perícias: </strong>{selected.template.skills}</p>
      <p className="text-sm"><strong>Ataques: </strong>{selected.template.weapons}</p>
      {selected.template.powers&&<p className="text-sm"><strong>Poderes: </strong>{selected.template.powers}</p>}
      <details><summary className="cursor-pointer min-h-11 py-2 font-semibold text-sm">Habilidades e limites ({selected.template.abilities.length})</summary><ul className="space-y-2 text-sm">{selected.template.abilities.map((a,i)=><li key={i}><strong>{a.name}: </strong>{a.description}</li>)}</ul>{selected.template.advantages&&<p className="text-sm mt-2"><strong>Vantagens: </strong>{selected.template.advantages}</p>}</details>
      <p className="text-sm"><strong>Fraquezas e cuidados: </strong>{selected.template.complications||'Defina com o mestre.'}</p>
      {corpus&&<details><summary className="cursor-pointer min-h-11 py-2 text-sm font-semibold flex items-center gap-2"><BookOpen size={16}/>Padrões encontrados no acervo ({corpus.count})</summary><p className="text-xs text-stone-400 mb-2">Papéis sugeridos podem se sobrepor. Exemplos de inspiração; o modelo não é cópia destas fichas.</p><ul className="text-sm space-y-1">{corpus.examples.map(m=><li key={m.id}>{m.name} <span className="text-stone-400">· {m.sourcebook}</span></li>)}</ul></details>}
      <button type="button" onClick={()=>onSelect(selected.id)} className="primary-action min-h-12 w-full rounded-lg px-4 font-semibold">Usar modelo: {selected.name}</button>
      <p className="text-xs text-stone-400">Aplicar substitui a ficha mecânica após confirmação. Seu nome, história e retrato são mantidos.</p>
     </article>
    </div>}
   </div>
  </section>
 </div>;
}
