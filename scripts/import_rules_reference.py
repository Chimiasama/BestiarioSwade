#!/usr/bin/env python3
"""Copy reference texts from swadebuilder assets. Source repository is read-only."""
import argparse, hashlib, json, pathlib, subprocess, unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--source-root',type=pathlib.Path,default=pathlib.Path('/workspace/MyApplication'));args=p.parse_args()
source=args.source_root
files=[('advantage','app/src/main/assets/vantagens.json'),('hindrance','app/src/main/assets/complicacoes.json'),('power','app/src/main/assets/poderes.json'),('superpower','app/src/main/assets/super_poderes.json'),('skill','app/src/main/assets/pericias.json'),('attribute','app/src/main/assets/geral_atributos.json'),('ability','app/src/main/assets/basico_habilidades_raciais.json'),('advantage','app/src/full/assets/havenwood/vantagens.json'),('hindrance','app/src/full/assets/havenwood/complicacoes.json')]
def dump(data):return json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def norm(value):return ''.join(c for c in unicodedata.normalize('NFD',value.lower()) if unicodedata.category(c)!='Mn').strip()
def text(value):
 if isinstance(value,dict):return '; '.join(f'{k}: {text(v)}' for k,v in value.items())
 if isinstance(value,list):return ', '.join(map(text,value))
 if isinstance(value,bool):return 'Sim' if value else 'Não'
 return str(value)
entries={};audit=[]
for kind,relative in files:
 raw=(source/relative).read_bytes();sha=hashlib.sha256(raw).hexdigest();data=json.loads(raw)
 if isinstance(data,dict):data=data['atributos']
 audit.append({'file':relative,'sha256':sha,'records':len(data),'kind':kind})
 for i,item in enumerate(data):
  name=item.get('nome') or item.get('name');description=item.get('descricao') or item.get('description') or ''
  if not name or not description:raise ValueError(f'Missing reference text: {relative}:{i}')
  books=item.get('livros') or [item.get('origem') or ('SUPER' if kind=='superpower' else 'BASICO')]
  details=[]
  labels={'categoria':'Categoria','severity':'Gravidade','estagio':'Estágio','pontosDePoder':'Pontos de Poder','custoBase':'Custo base','distancia':'Alcance','duracao':'Duração','atributo':'Atributo associado','basica':'Perícia básica','custo':'Custo racial','manifestacoes':'Manifestações','ativacao':'Ativação','tipo':'Tipo','observacoes':'Observações'}
  for field,label in labels.items():
   if field in item and item[field] not in (None,'',[]):details.append({'label':label,'value':text(item[field])})
  req=item.get('requisitos')
  if req:
   if req.get('estagio'):details.append({'label':'Estágio requerido','value':text(req['estagio'])})
   for field,label in [('atributos','Atributos requeridos'),('pericias','Perícias requeridas')]:
    if req.get(field):details.append({'label':label,'value':', '.join(f'{k} d{v}' if isinstance(v,int) else f'{k} {text(v)}' for k,v in req[field].items())})
   if req.get('vantagens_previas'):details.append({'label':'Vantagens requeridas','value':', '.join(str(v).replace('_',' ') for v in req['vantagens_previas'])})
   if req.get('observacoes'):details.append({'label':'Requisitos adicionais','value':text(req['observacoes'])})
   if req.get('gruposAlternativos'):details.append({'label':'Requisitos alternativos','value':' OU '.join(text(v).replace('_',' ') for v in req['gruposAlternativos'])})
  modifiers=[]
  for mod in item.get('modificadores',[]):
   if isinstance(mod,str):modifiers.append({'name':mod.split(':',1)[0],'description':mod.split(':',1)[1] if ':' in mod else mod})
   else:modifiers.append({'name':mod.get('nome','Modificador'),'cost':str(mod.get('custo','')),'description':mod.get('descricao','')})
  result={'name':name,'kind':kind,'description':description,'summary':item.get('descricaoLite',''),'details':details,'modifiers':modifiers}
  key=hashlib.sha256(dump(result).encode()).hexdigest()[:20]
  entry=entries.setdefault(key,{'id':f'{kind}-{key}',**result,'books':[],'origins':[],'aliases':[]})
  entry['books']=sorted(set(entry['books']+books))
  entry['origins'].append({'file':relative,'index':i,'sourceId':item.get('id',name)})
  if item.get('originalName'):entry['aliases']=sorted(set(entry['aliases']+[item['originalName']]))
# These short UI explanations are authored here; they are not attributed to imported books.
for name,description in {
 'Aparar':'É a dificuldade para acertar esta criatura em combate corpo a corpo. A base é 2 + metade do dado de Lutar; escudos, Vantagens e habilidades podem alterar o valor. Confira os bônus já incluídos na ficha.',
 'Resistência':'Compare o dano com este valor para determinar seus efeitos. A base é 2 + metade do dado de Vigor; Tamanho, armadura e habilidades podem alterar o total. O número entre parênteses normalmente indica a armadura já incluída.',
 'Movimentação':'Distância que a criatura pode percorrer em uma ação de movimento, medida em quadros. Modos de locomoção, corrida e terreno podem mudar essa distância. Use os valores específicos da ficha para voo, natação ou outras formas de deslocamento.',
 'Tamanho':'Representa o porte da criatura. Pode modificar Resistência e se relaciona à Escala; o valor de Resistência da ficha normalmente já inclui o modificador de Tamanho.',
 'Carta Selvagem':'Rola um d6 Selvagem junto ao dado de traço e usa o maior resultado; essa regra não adiciona Dado Selvagem ao dano. Em geral suporta três Ferimentos antes de ser incapacitada.',
 'Extra':'Rola apenas seu dado de traço e, em geral, fica incapacitado ao sofrer um Ferimento. Habilidades específicas da criatura podem modificar esse comportamento.',
}.items():
 key=hashlib.sha256(name.encode()).hexdigest()[:20];entries[key]={'id':f'rule-{key}','name':name,'kind':'rule','description':description,'summary':'','details':[],'modifiers':[],'books':['BESTIARIO'],'origins':[{'file':'scripts/import_rules_reference.py','index':None,'sourceId':name}],'aliases':[]}
values=sorted(entries.values(),key=lambda e:(e['kind'],norm(e['name']),e['id']))
out=ROOT/'data/rules';out.mkdir(parents=True,exist_ok=True)
for kind in sorted({e['kind'] for e in values}):(out/(kind+'.json')).write_text(json.dumps([e for e in values if e['kind']==kind],ensure_ascii=False,separators=(',',':'))+'\n')
index=[{k:e[k] for k in ['id','name','kind','books','aliases']}|{'severity':next((d['value'] for d in e['details'] if d['label']=='Gravidade'),'')} for e in values]
(out/'index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
report={'sourceRepository':'Chimiasama/MyApplication','sourceCommit':subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip(),'sources':audit,'inputRecords':sum(a['records'] for a in audit),'uniqueEntries':len(values),'localSummaries':6,'counts':{k:sum(e['kind']==k for e in values) for k in sorted({e['kind'] for e in values})}}
(ROOT/'data/rulesImportAudit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for a in audit:
 assert hashlib.sha256((source/a['file']).read_bytes()).hexdigest()==a['sha256'],a['file']
print(json.dumps(report['counts'],ensure_ascii=False));print(f"{report['inputRecords']} source records → {len(values)} reference entries (including 6 local summaries). Source files unchanged.")
