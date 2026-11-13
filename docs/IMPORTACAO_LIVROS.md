# Importação dos livros de Savage Worlds

Foram acrescentadas **1.060 fichas** e **20 referências/modelos**, preservando as 46 entradas existentes. O catálogo passa a ter **1.126 entradas**. As variantes de livros diferentes permanecem separadas por suplemento; uma adaptação antiga não substitui a ficha extraída do livro.

## Origem e escopo

Fonte: os 19 arquivos de texto `docs/swade_*` do SWADE Builder (`MyApplication`), no commit `931cc9db8ddff627824a259539acbe4cce4b2249`. A origem foi somente lida: nenhum arquivo desse repositório foi modificado.

São incluídos blocos de estatísticas de criaturas, animais, aliados e NPCs dos bestiários/galerias e encontros, além de referências nomeadas que não apresentam uma ficha fixa própria. Exemplos de criação de personagens e personalidades humanas de cenário fora desses catálogos foram excluídos; suas linhas estão registradas em `data/bookImportAudit.json`. Livros sem blocos de ficha não geram estatísticas presumidas a partir de menções narrativas.

| Livro | Fichas | Referências/modelos |
| --- | ---: | ---: |
| Arte da Guerra (ADG) | 21 | 3 |
| Arte da Guerra — Diário do Kui | 43 | 0 |
| Core Rules | 43 | 0 |
| Crystal Heart | 80 | 0 |
| Crystal Heart — Muitos Corações | 0 | 0 |
| Cidade do Sol & Vapor — Livro do Criador | 40 | 0 |
| Cidade do Sol & Vapor — Livro dos Mortais | 4 | 0 |
| Cidade do Sol & Vapor — Movimento Vermelho | 0 | 0 |
| Deadlands: O Oeste Estranho | 84 | 3 |
| Deadlands — Compêndio | 8 | 0 |
| Compêndio de Fantasia | 241 | 0 |
| Havenwood | 16 | 1 |
| Havenwood — Zoo do Povo-Fera | 0 | 0 |
| Compêndio de Horror | 175 | 4 |
| Pathfinder para Savage Worlds | 25 | 0 |
| Pathfinder — Compêndio de Golarion | 0 | 0 |
| Compêndio de Sci-Fi | 178 | 9 |
| Compêndio de Superpoderes | 102 | 0 |
| Wiseguys — Livro do Jogador | 0 | 0 |

## Fidelidade e apresentação

- Cada entrada registra arquivo, linha inicial e intervalos do texto usado. O hash SHA-256 de cada livro fica no relatório de auditoria.
- A ficha detalhada oferece **Consultar ficha no texto do livro** para conferir regras, alternativas de valores e contexto. Esse texto e as variantes opcionais ficam ocultos no modo jogador.
- As descrições vieram de extrações de PDF, com erros tipográficos e trechos em ordem de colunas diferente. `scripts/book-overrides.json` registra correções de nomes e intervalos revistos, incluindo dragão/elemental, mecha/liche, tubarão e vampiros do livro básico.
- Habilidades variantes são exibidas separadamente, como opções; não são incorporadas automaticamente às habilidades padrão.
- Superglom e Esporo têm Aparar repetido no lugar da Movimentação no texto-fonte. A movimentação fica explicitamente não informada. As correções `Espírito dd4 → d4` e `Agilidade 10 → d10` também aparecem como avisos.
- Entradas sem ficha fixa exibem **—** nos campos ausentes, o rótulo **Referência** e as regras originais. Não são inventados atributos, Aparar ou Resistência. Botões de rolagem sem dado ficam desabilitados.
- Alguns perfis pressupõem habilidades comuns de sua família, remissões ou uma criatura-base. O texto original continua sendo a referência para esses ajustes; as fichas não calculam automaticamente todos os modelos possíveis.
- Uma ilustração local genérica identifica entradas dos livros, sem atribuir imagens aleatórias às criaturas.

## Atualizar a importação

Na raiz do Bestiário:

```sh
python scripts/import-books.py /workspace/MyApplication/docs
python -m unittest discover -s tests -v
npx --no-install tsc --noEmit
npm run build
```

O importador lê os livros e grava somente `data/bookMonsters.json` e `data/bookImportAudit.json` no Bestiário. Não acessa serviços externos. A importação é determinística. Se o hash de uma fonte mudar, ela é recusada antes de aplicar os ajustes por linha: revise os nomes/intervalos e a auditoria para a nova edição em vez de reaplicar offsets antigos.

## Verificação

Os testes de conteúdo conferem o inventário dos 19 livros, cobertura dos blocos selecionados, identificadores únicos, campos de ficha, ausência explícita de estatísticas, variantes opcionais e regressões de colunas intercaladas. A interface foi exercitada com Chromium/Playwright para pesquisar e abrir fichas, consultar fontes e verificar referências sem dados, além de preservar o catálogo anterior.
