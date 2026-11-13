import React,{useState,useEffect,useMemo,useRef} from 'react';
import {useDialogAccessibility} from '../hooks/useDialogAccessibility';
import {useBackNavigation} from '../hooks/useBackNavigation';
import {RULE_INDEX,RULE_KINDS,findReferenceMatches,searchReferences,loadReferenceKind,openRulesReference,type RuleKind,type RuleEntry,type ReferenceRequest} from '../services/rulesReference';
import {RULE_BOOK_LABELS,scenarioRuleCode} from '../services/scenarioService';

export const ReferenceTerm:React.FC<{term:string;kind?:RuleKind;sourcebook?:string;localText?:string;children?:React.ReactNode}>=({term,kind,sourcebook,localText,children})=>{
 return <button type="button" className="reference-term min-h-11 text-left underline decoration-dotted underline-offset-4" aria-label={`Consultar ${kind?RULE_KINDS[kind].toLowerCase():'regra'} ${term}`} onClick={event=>{event.stopPropagation();openRulesReference({term,kind,sourcebook,localText});}}>{children||term}</button>;
};

function ReferenceDialog({request,onClose}:{request:ReferenceRequest;onClose:()=>void}){
 const previewRef=useRef<HTMLElement>(null);
 const dialogRef=useDialogAccessibility(true);useBackNavigation(true,onClose,160);
 const [query,setQuery]=useState(request.term);const [kind,setKind]=useState<RuleKind|''>(request.kind||'');
 const [manual,setManual]=useState(!request.term);const [selectedId,setSelectedId]=useState('');const [limit,setLimit]=useState(30);
 const [entry,setEntry]=useState<RuleEntry|null>(null);const [error,setError]=useState('');
 const matches=useMemo(()=>manual?searchReferences(query,kind||undefined,request.sourcebook):findReferenceMatches(request.term,kind||undefined,request.sourcebook),[manual,query,kind,request]);
 const sourceSummary=(books:string[])=>{const preferred=books.find(b=>b===scenarioRuleCode(request.sourcebook))||books.find(b=>b==='BASICO')||books[0];return `${RULE_BOOK_LABELS[preferred]||preferred}${books.length>1?` · +${books.length-1} cenários`:''}`;};
 const selected=matches.find(e=>e.id===selectedId)||matches[0];
 useEffect(()=>{let alive=true;setEntry(null);setError('');if(selected)loadReferenceKind(selected.kind).then(entries=>{if(alive)setEntry(entries.find(e=>e.id===selected.id)||null);}).catch(()=>{if(alive)setError('Não foi possível abrir este texto. Feche e tente novamente.');});return()=>{alive=false;};},[selected?.id]);
 const changeQuery=(q:string)=>{setQuery(q);setManual(true);setSelectedId('');setLimit(30);};
 const candidateList=selected?(<div className="space-y-2 max-h-56 md:max-h-[58vh] overflow-y-auto p-1" role="group" aria-label="Definições encontradas">
      {matches.slice(0,limit).map(e=><button key={e.id} type="button" aria-pressed={e.id===selected.id} onClick={()=>{setSelectedId(e.id);if(window.matchMedia('(max-width: 767px)').matches)previewRef.current?.scrollIntoView({block:'start',behavior:'instant'});}} className={`w-full text-left p-3 rounded-lg border ${selected.id===e.id?'border-amber-500 bg-amber-900/20':'border-stone-700 bg-stone-900'}`}><span className="font-semibold block text-sm">{e.name}</span><span className="text-xs text-stone-400 block mt-1">{RULE_KINDS[e.kind]}{e.severity?` · ${e.severity}`:''} · {sourceSummary(e.books)}</span></button>)}
      {matches.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+30)} className="min-h-11 underline">Mostrar mais definições</button>}
     </div>):null;
 const definition=selected?(<article ref={previewRef} aria-label="Texto da regra" className="min-w-0 border border-stone-700 rounded-lg p-4 space-y-4 scroll-mt-28">
      <div><h3 className="font-cinzel text-xl font-bold text-amber-200">{selected.name}</h3><p className="text-xs text-stone-400 mt-1">{RULE_KINDS[selected.kind]} · {sourceSummary(selected.books)}</p></div>
      {error?<p role="alert">{error}</p>:(!entry||entry.id!==selected.id)?<p role="status">Abrindo definição…</p>:<>
       {entry.summary&&<details><summary className="min-h-11 py-2 cursor-pointer font-semibold text-sm">Resumo rápido</summary><p className="text-sm whitespace-pre-wrap">{entry.summary}</p></details>}

       <section aria-label="Descrição completa da regra"><p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.description}</p></section>
       {entry.details.length>0&&<details><summary className="min-h-11 py-2 cursor-pointer font-semibold text-sm">Requisitos e características ({entry.details.length})</summary><dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">{entry.details.map((d,i)=><div key={i} className="border border-stone-700 rounded-lg p-2"><dt className="font-semibold text-stone-400">{d.label}</dt><dd className="whitespace-pre-wrap">{d.value}</dd></div>)}</dl></details>}
       {entry.modifiers.length>0&&<details><summary className="min-h-11 py-2 cursor-pointer font-semibold">Modificadores ({entry.modifiers.length})</summary><div className="space-y-3 text-sm">{entry.modifiers.map((m,i)=><section key={i}><h4 className="font-semibold">{m.name}{m.cost?` (${m.cost})`:''}</h4><p className="whitespace-pre-wrap">{m.description}</p></section>)}</div></details>}
       <details><summary className="min-h-11 py-2 cursor-pointer text-sm">Origem do texto</summary><p className="text-xs text-stone-400">{entry.books.map(b=>RULE_BOOK_LABELS[b]||b).join(', ')}</p><p className="text-xs text-stone-400">{entry.books.includes('BESTIARIO')?'Resumo próprio do Bestiário.':'Texto importado do acervo do swadebuilder, preservando as versões por cenário.'}</p><ul className="text-xs text-stone-400 mt-2 space-y-1">{entry.origins.map((o,i)=><li key={i}>{o.file} · {o.sourceId}{o.index!==null?` · registro ${o.index+1}`:''}</li>)}</ul></details>
      </>}
     </article>):null;
 return <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="reference-title" className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-5" style={{background:'var(--modal-backdrop)'}}>
  <section className="reference-dialog max-w-5xl w-full max-h-[92dvh] overflow-y-auto rounded-xl border border-stone-700 bg-stone-950">
   <header className="sticky top-0 z-10 bg-stone-950 border-b border-stone-700 p-4 flex justify-between items-start gap-3"><div><h2 id="reference-title" className="font-cinzel text-xl font-bold text-amber-200">Consulta de regras</h2><p className="text-sm text-stone-400 mt-1">{RULE_INDEX.length.toLocaleString('pt-BR')} definições · disponível neste aparelho</p></div><button type="button" onClick={onClose} aria-label="Fechar consulta de regras" className="min-h-11 min-w-11 border border-stone-700 rounded-lg">✕</button></header>
   <div className="p-4 space-y-4">
    {request.localText&&<section className="rounded-lg border border-stone-700 p-3"><h3 className="font-semibold">{request.term} · texto desta criatura</h3><p className="text-sm whitespace-pre-wrap mt-2">{request.localText}</p></section>}
    <details open={manual}><summary className="min-h-11 py-2 cursor-pointer font-semibold text-sm">Buscar outra regra ou versão</summary>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="text-sm sm:col-span-2">Buscar definição<input type="search" className="template-field" value={query} onChange={e=>changeQuery(e.target.value)} placeholder="Ex.: Golpe Poderoso, Curar, Astúcia…"/></label><label className="text-sm">Tipo de regra<select className="template-field" value={kind} onChange={e=>{setKind(e.target.value as RuleKind|'');setManual(true);setSelectedId('');setLimit(30);}}><option value="">Todos os tipos</option>{Object.entries(RULE_KINDS).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label></div>
    </details>
    <p role="status" className="text-sm text-stone-400">{matches.length} definições encontradas{request.sourcebook?' · versões do cenário da criatura aparecem primeiro':''}. Textos de cenários diferentes podem ter regras distintas.</p>
    {!matches.length&&<section className="rounded-lg border border-stone-700 p-4 space-y-2"><p>Não há uma definição exata disponível para este nome. Ele pode ser próprio da criatura ou usar outra tradução.</p><button type="button" className="min-h-11 underline" onClick={()=>{setKind('');changeQuery('');}}>Pesquisar em todas as definições</button></section>}
    {selected&&<div className={`grid gap-4 items-start ${matches.length>1||manual?manual?'md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]':'md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]':''}`}>
     {manual?<>{candidateList}{definition}</>:<>{definition}{matches.length>1&&candidateList}</>}
    </div>}
   </div>
  </section>
 </div>;
}
export function RulesReferenceHost(){
 const [request,setRequest]=useState<ReferenceRequest|null>(null);
 useEffect(()=>{const open=(event:Event)=>setRequest((event as CustomEvent<ReferenceRequest>).detail);window.addEventListener('swade:reference',open);return()=>window.removeEventListener('swade:reference',open);},[]);
 return request?<ReferenceDialog request={request} onClose={()=>setRequest(null)}/>:null;
}
