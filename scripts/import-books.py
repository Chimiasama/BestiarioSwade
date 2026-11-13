#!/usr/bin/env python3
"""Importa fichas dos dumps locais sem modificar o repositório de origem."""
import argparse, hashlib, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS = {
 'swade_adg': 'Arte da Guerra (ADG)',
 'swade_adg_diario_do_kui': 'Arte da Guerra — Diário do Kui',
 'swade_basico': 'Livro Básico',
 'swade_crystal_heart': 'Crystal Heart',
 'swade_crystal_heart_muitos_coracoes': 'Crystal Heart — Muitos Corações',
 'swade_csv_livro_do_criador': 'Cidade do Sol & Vapor — Livro do Criador',
 'swade_csv_livro_dos_mortais': 'Cidade do Sol & Vapor — Livro dos Mortais',
 'swade_csv_movimento_vermelho': 'Cidade do Sol & Vapor — Movimento Vermelho',
 'swade_deadlands': 'Deadlands: O Oeste Estranho',
 'swade_deadlands_compendio': 'Deadlands — Compêndio',
 'swade_fantasia': 'Compêndio de Fantasia',
 'swade_havenwood': 'Havenwood',
 'swade_havenwood_zoo_povo_fera': 'Havenwood — Zoo do Povo-Fera',
 'swade_horror': 'Compêndio de Horror',
 'swade_pathfinder_basico': 'Pathfinder para Savage Worlds',
 'swade_pathfinder_compendio': 'Pathfinder — Compêndio de Golarion',
 'swade_scifi': 'Compêndio de Sci-Fi',
 'swade_superpoderes': 'Compêndio de Superpoderes',
 'swade_wiseguys_jogador': 'Wiseguys — Livro do Jogador',
}
# Criação de personagens e personalidades humanas de cenário não são bestiários.
def in_scope(book, line):
 if book == 'swade_adg': return line >= 14000 or line == 6482
 if book == 'swade_crystal_heart': return line >= 10000
 if book == 'swade_csv_livro_do_criador': return line < 3307 or 7800 <= line <= 8100
 if book == 'swade_csv_livro_dos_mortais': return 8700 <= line < 8900
 if book in ('swade_csv_movimento_vermelho', 'swade_wiseguys_jogador'): return False
 if book == 'swade_deadlands': return line >= 12098
 if book == 'swade_deadlands_compendio': return line < 5500 or line > 8200
 return True

EXCLUDED = {'ficha','bestiário','criaturas','savage worlds','adversários e desafios','aventuras',
 'animais','animais comuns','galeria','novos inimigos','aliados conjurados','poderes',
 'compêndio de fantasia','compêndio de ficção científica','compêndio de superpoderes',
 'compêndio de horror','habilidades especiais','perícias','vantagens','complicações',
 'atributos','equipamento','equipamentos','armas','características','robôs',
 'nível de','poder','apêndicepêndice','ideias de aventura','galeriaaleria de vilõesilões','i','ii','iii','iv','v','vi'}
def clean(s):
 s=re.sub(r'[\x00-\x1f\x7f-\x9f]', '', s)
 s=re.sub(r'COMPÊNDI\s*O DE (?:HORROR|SUPERPODERES)\s*', '', s)
 return s.strip()
def heading(s):
 t=clean(s)
 if not t or len(t)>85 or len(t)<3 or t.casefold() in EXCLUDED: return False
 if re.match(r'^(CAPÍTULO|DEADLANDS:|SAVAGE WORLDS|COMPÊNDIO|PATHFINDER|O Livro|A Cidade|Livro d)',t): return False
 if re.search(r'[.!?;:“”"=0-9]',t) or t.startswith(('•','\u0084','−','-','~')): return False
 if t.isupper(): return bool(re.search('[A-ZÀ-Ý]',t)) and not re.fullmatch(r'[\d\W]+',t)
 words=t.split()
 return t[0].isupper() and not re.search(r'\d',t) and all(w[0].isupper() or w in ('de','da','do','das','dos','e','o','a','em','ao','à') for w in words)

def find_heading(lines, i, lower, book):
 for j in range(i-1,max(lower-1,i-250),-1):
  t=clean(lines[j])
  upper_book=book in {'swade_basico','swade_fantasia','swade_horror','swade_pathfinder_basico','swade_scifi','swade_superpoderes','swade_deadlands','swade_deadlands_compendio'}
  marker=bool(re.match(r'^c\s+',t))
  if marker or (heading(lines[j]) and (not upper_book or t.isupper())):
   start=j
   # Títulos em caixa alta podem ocupar até três linhas.
   while start>lower and j-start<2 and heading(lines[start-1]) and clean(lines[start-1]).isupper() and clean(lines[start]).isupper(): start-=1
   return start, ' '.join(clean(s) for s in lines[start:j+1])
 return i, 'SEM TÍTULO'

DIE=r'd\d+(?:\s*[+−–-]\s*\d+)?(?:\s*\(\s*A\s*\))?'
FIELDS=r'(?:Atributos?|Perícias?|Habilidades|Vantagem|Técnica Chi|Movimentação|Movimento|Aparar|Resistência|Vantagens|Complicações|Equipamentos?|Armas|Poderes(?: Arcanos)?|Superpoderes|Habilidades Especiais|Pontos de Poder|PPs?|Reserva de Chi)'

def normalize(s):
 return re.sub(r'\s+', ' ',s).strip().replace('–','-').replace('−','-')
def section(text, field):
 m=re.search(r'(?<!\w)(?:'+field+r')\s*:\s*(.*?)(?=(?<!\w)'+FIELDS+r'\s*:|$)',text,re.S|re.I)
 return normalize(m[1]) if m else ''
def split_list(s):
 return [v.strip().rstrip('.') for v in re.split(r',\s*(?![^()]*\))',s) if v.strip() not in ('','—','–','-','~')]

def main():
 ap=argparse.ArgumentParser(); ap.add_argument('docs',type=Path); args=ap.parse_args()
 monsters=[]; audit=[]; failures=[]
 overrides=json.loads((ROOT/'scripts/book-overrides.json').read_text())
 audit_path=ROOT/'data/bookImportAudit.json'
 previous={b['book']:b['sha256'] for b in json.loads(audit_path.read_text())['books']} if audit_path.exists() else {}
 for book,label in BOOKS.items():
  path=args.docs/book
  digest=hashlib.sha256(path.read_bytes()).hexdigest()
  if book in previous and previous[book]!=digest: raise SystemExit(f'{book}: fonte alterada; revise os overrides de linha antes de importar.')
  lines=path.read_text().splitlines()
  lines=[re.sub(r'^(?:COMPÊNDI\s*O DE (?:HORROR|SUPERPODERES)|SAVAGE PATHFINDER)\s*', '', l) for l in lines]
  starts=[i for i,l in enumerate(lines) if re.search(r'(?<!\w)Atributos?\s*:?\s+Agilidade',l,re.I) and re.search(r'Agilidade\s*:?\s*d?\d',' '.join(lines[i:i+5]),re.I)]
  titles=[find_heading(lines,i, starts[k-1]+1 if k else 0, book) for k,i in enumerate(starts)]
  for k,i in enumerate(starts):
   override=overrides.get(book,{}).get(str(i+1),{})
   if 'name' in override: titles[k]=(override.get('headingLine',i+1)-1,override['name'])
  stats={'book':book,'sourcebook':label,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'detected':len(starts),'imported':0,'outOfScope':[],'duplicates':[]}
  seen=set()
  for k,i in enumerate(starts):
   line=i+1
   if not in_scope(book,line): stats['outOfScope'].append(line); continue
   h,name=titles[k]
   override=overrides.get(book,{}).get(str(line),{})
   end=titles[k+1][0] if k+1<len(starts) else len(lines)
   if 'endLine' in override: end=override['endLine']
   segments=override.get('ranges',[[line,end]])
   source_lines=[l for a,b in segments for l in lines[a-1:b]]
   raw='\n'.join(source_lines).strip()
   txt='\n'.join(clean(l) for l in source_lines if not re.match(r'^(CAPÍTULO|DEADLANDS:|SAVAGE WORLDS|COMPÊNDI)',l))
   for old,new in override.get('corrections',{}).items(): txt=txt.replace(old,new)
   txt=re.sub(r'(?m)^(Perícias?)\s+(?=[A-ZÀ-Ý])',r'\1: ',txt)
   txt=re.sub(r'(Movimentação|Movimento|Aparar|Resistência)\s+(?=[0-9–—-])',r'\1: ',txt)
   attributes={}
   for key,pt in [('agility','Agilidade'),('cunning','Astúcia|Esperteza|Inteligência'),('spirit','Espírito'),('strength','Força'),('vigor','Vigor')]:
    m=re.search(r'(?:'+pt+r')\s*:?\s*((?:1)?'+DIE+r'|[—–-]|\d+)',txt[:450],re.I)
    if m: attributes[key]=re.sub(r'\s*([+\-])\s*',r'\1',normalize(m[1]).removeprefix('1') if m[1].startswith('1d') else normalize(m[1]))
   parry=re.search(r'Aparar\s*:\s*(\d+)',txt,re.I)
   movement=override.get('missing',{}).get('movement') or section(txt,'Movimentação|Movimento').rstrip(';')
   toughness=section(txt,'Resistência').split(';')[0]
   toughness=re.match(r'\d+(?:\s*\([^)]+\))?|[—–-]|Do\s+veículo',toughness,re.I)
   if len(attributes)!=5 or not parry or not movement or not toughness:
    failures.append({'book':book,'line':line,'name':name,'attributes':attributes,'parry':bool(parry),'movement':movement,'toughness':bool(toughness)})
    continue
   wild=override.get('wildCard', False) or bool(re.match(r'^[WDBc]\s+',name) or any(c in '\u008f\u0090' for c in lines[h]))
   name=re.sub(r'^[WDBc]\s+','',name).strip()
   if name and name[0].islower(): name=name[0].upper()+name[1:]
   if name.isupper(): name=name.capitalize()
   fingerprint=normalize(txt)
   if fingerprint in seen: stats['duplicates'].append(line); continue
   seen.add(fingerprint)
   abilities=[]
   ability_lines=[l for l in source_lines if not re.match(r'^\s*\d+\s*$',l) and not re.match(r'^(?:CAPÍTULO|DEADLANDS:|SAVAGE WORLDS|Compêndio de|Bestiário$|Criaturas$|Adversários e Des)',l)]
   ability_source=re.split(r'(?im)^HABILIDADES ESPECIAIS VARIANTES\s*$', '\n'.join(ability_lines),maxsplit=1)
   special=re.search(r'(?im)^Habilidades? Especiais\s*:?\s*\n(.*)', ability_source[0], re.S|re.I)
   if special:
    for part in re.split(r'(?:^|\n)\s*[\u0084\u008b\u008f\u0090•●▪]\s*', special[1]):
     part=normalize(re.sub(r'(?im)^Habilidades? Especiais\s*:?\s*$', '', part))
     if not part: continue
     title,sep,desc=part.partition(':')
     abilities.append({'name':title if sep else 'Habilidade especial','description':desc.strip() if sep else part})
   size=re.search(r'Tamanho\s*([+−–-]?\s*\d+)',special[1] if special else '')
   race='Não especificada'
   for pattern,label_type in [(r'(?i)morto.vivo','Morto-Vivo'),(r'(?i)construto|constructo|autômato','Constructo'),(r'(?i)\bPlanta\b', 'Planta'),(r'(?i)\bElemental\b', 'Elemental')]:
    if re.search(pattern,' '.join(a['name'] for a in abilities)): race=label_type; break
   animal_type=re.search(r'Tipo:\s*([^\n]+)', '\n'.join(lines[max(0,h):i]))
   if animal_type: race=normalize(animal_type[1])
   monster={'id':f'book-{book}-{line}','name':name,'race':race,'archetype':'Ficha do livro',
    'imageUrl':'/book-creature.svg','isWildCard':wild,'attributes':attributes,
    'skills':split_list(section(txt,'Perícias|Perícia|Habilidades')),'movement':movement,'parry':int(parry[1]),'toughness':toughness[0],
    'abilities':abilities,'advantages':split_list(section(txt,'Vantagens')),'complications':split_list(section(txt,'Complicações')),
    'history':normalize(' '.join(l for l in lines[h+1:i] if not re.match(r'^\d+$',l))) if h<i else '', 'sourcebook':label,
    'sourceReference':{'file':book,'line':line,'ranges':segments},'sourceText':raw}
   if len(ability_source)>1: monster['abilityVariants']=ability_source[1].strip()
   if override.get('missing'): monster['sourceWarnings']=list(override['missing'].values())
   if override.get('corrections'): monster['sourceWarnings']=[f'Correção de erro tipográfico: {old} → {new}' for old,new in override['corrections'].items()]
   for key,field in [('equipment','Equipamentos?'),('weapons','Armas'),('powers','Poderes(?: Arcanos)?|Superpoderes')]:
    value=section(txt,field)
    if value: monster[key]=value
   if size: monster['size']=int(normalize(size[1]).replace(' ',''))
   monsters.append(monster); stats['imported']+=1
  audit.append(stats)
 if failures:
  raise SystemExit('Importação incompleta; catálogo anterior preservado. Pendências: '+json.dumps(failures,ensure_ascii=False))
 references=json.loads((ROOT/'scripts/book-references.json').read_text())
 for entry in references:
  book=entry['book']; segments=entry['ranges']; line=segments[0][0]
  source=(args.docs/book).read_text().splitlines()
  text='\n'.join(l for a,b in segments for l in source[a-1:b])
  monsters.append({
   'id':f'reference-{book}-{line}', 'name':entry['name'], 'race':'Não especificada',
   'archetype':'Referência / modelo', 'referenceOnly':True, 'imageUrl':'/book-creature.svg',
   'attributes':dict.fromkeys(['agility','cunning','spirit','strength','vigor'],'—'),
   'skills':[], 'movement':'—','parry':'—','toughness':'—','abilities':[],
   'history':'Esta entrada usa regras próprias ou modifica outra ficha. Consulte o texto do livro abaixo.',
   'sourcebook':BOOKS[book], 'sourceReference':{'file':book,'line':line,'ranges':segments},
   'sourceText':text,
   'sourceWarnings':['Referência ou modelo sem ficha fixa própria. Os valores não foram presumidos.']
  })
 (ROOT/'data/bookMonsters.json').write_text(json.dumps(monsters,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'data/bookImportAudit.json').write_text(json.dumps({'books':audit,'references':references,'unresolved':failures},ensure_ascii=False,indent=2)+'\n')
 print(f'{len(monsters)} fichas; {len(failures)} pendências')
 for f in failures: print(f)
 for m in monsters: print(m['sourceReference']['file'],m['sourceReference']['line'],m['name'],sep='\t')
if __name__=='__main__': main()
