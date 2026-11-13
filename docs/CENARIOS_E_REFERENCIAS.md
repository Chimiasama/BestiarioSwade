# Cenários e consulta contextual de regras

## Organização do catálogo

A biblioteca inicial agrupa criaturas por cenário, sem misturar ou descartar as fichas de livros diferentes. No acervo distribuído, 17 títulos de origem passam a ocupar 13 grupos:

| Cenário | Criaturas e referências | Origens reunidas |
| --- | ---: | --- |
| Cidade do Sol a Vapor | 45 | Livro do Criador, Livro dos Mortais e entradas gerais |
| Arte da Guerra | 69 | Livro principal e Diário do Kui |
| Deadlands: O Oeste Estranho | 97 | Livro principal e Compêndio |

Os demais grupos são Crystal Heart, Fantasia, Ficção Científica, Havenwood, Horror, Lendas Brasileiras, Livro Básico, Pathfinder, Superpoderes e Wiseguys. Criações locais e cenários próprios também aparecem quando existirem no aparelho. Os filtros e estatísticas usam os mesmos grupos.

**Core Rules foi renomeado para Livro Básico.** A leitura de bases locais antigas também apresenta esse título, sem regravar a base ou substituir o trabalho do usuário. As fichas mantêm o livro específico, texto de origem e referências de linha/página que já possuíam. Não foram inventados números de página ausentes.

## Textos trazidos do swadebuilder

Foram lidos 3.378 registros dos arquivos de assets do MyApplication, incluindo os complementos de Havenwood. Duplicatas com nome, texto, resumo, requisitos e modificadores idênticos compartilham uma definição; suas origens e cenários são reunidos. Textos ou requisitos diferentes continuam como versões distintas.

| Tipo | Definições importadas |
| --- | ---: |
| Vantagens | 928 |
| Complicações | 236 |
| Poderes | 321 |
| Superpoderes | 92 |
| Perícias | 66 |
| Atributos | 5 |
| Habilidades raciais | 115 |
| **Total importado** | **1.763** |

Há ainda seis resumos próprios do Bestiário sobre Aparar, Resistência, Movimentação, Tamanho, Carta Selvagem e Extra, identificados como resumos locais. A consulta disponibiliza **1.769 definições** ao todo.

Foram preservados os textos completos disponíveis nos assets, resumos, pré-requisitos, gravidade das complicações, Pontos de Poder, alcance, duração, manifestações e modificadores quando presentes. “Origem do texto” identifica arquivo, registro, identificador e cenários. O manifesto `data/rulesImportAudit.json` registra o commit do repositório fonte, a quantidade de registros e SHA-256 de cada arquivo lido. O importador confirma que os arquivos fonte não mudaram durante a importação.

**Nenhum arquivo do MyApplication/swadebuilder foi alterado.**

## Consulta no aplicativo

- Na ficha, toque no nome de uma vantagem, complicação, poder, habilidade, perícia ou atributo. O texto da definição aparece primeiro; busca, requisitos e versões alternativas ficam disponíveis na mesma janela.
- Nos atributos e perícias, o nome abre a explicação; o dado tem seu próprio botão para continuar rolando testes.
- Os nomes Aparar, Resistência, Movimentação e Tamanho também abrem explicações.
- “Consultar regras” na ficha e o botão de consulta no Guia Rápido permitem pesquisar todo o acervo por nome e tipo.
- A consulta prioriza o cenário da criatura e depois o Livro Básico; versões de outros cenários são identificadas e continuam acessíveis. Poderes arcanos e superpoderes permanecem separados, mesmo quando a criatura pertence a um cenário de superpoderes.
- Abreviações e variantes explícitas, como Conhec. Geral, Jutsu, Ambidestria e Nervos de Aço Aprimorado, têm correspondências controladas. Jutsu direciona à definição de Lutar específica de Arte da Guerra, que contém suas regras.
- Habilidades próprias da criatura mantêm seu texto local em destaque. Quando não há definição exata no acervo, o aplicativo informa isso e oferece uma busca; não inventa uma regra nem assume que uma habilidade de nome parecido é equivalente.

Os arquivos ficam empacotados no APK. Textos completos são carregados por categoria ao abrir uma definição, evitando carregar todo o acervo na tela inicial. Não há conta, consulta a outro aplicativo instalado ou conexão com serviço de nuvem. A versão web continua dependendo de seu servidor para carregar os arquivos, como o restante do aplicativo.

## Cobertura e testes

`data/rulesCoverageAudit.json` registra os nomes presentes nas fichas que encontraram definição e os que ainda não têm correspondência, com frequências. Nomes próprios, efeitos inventados para uma criatura, indicações genéricas como “Variável” e traduções não equivalentes permanecem sem correspondência automática.

Validação realizada: integridade e rastreabilidade de todos os registros, agrupamento sem perda de criaturas, compatibilidade da base antiga, consulta por cenário e tipo, variantes e abreviações, cliques reais nos termos da ficha, preservação das rolagens, busca, estado sem definição, larguras móveis/computador, navegação Android com ponte simulada, TypeScript, build e auditoria Axe nos temas claro e escuro. O comportamento em aparelho físico continua sujeito à validação do APK no dispositivo.

Comandos de manutenção:

```sh
npm run import:references -- --source-root /workspace/MyApplication
npm run test:references
node scripts/audit_rules_coverage.mjs
```

A importação escreve exclusivamente no Bestiário. `tests/rulesReference.browser.mjs` usa Vite e Playwright para os fluxos no navegador. O workflow manual de APK também executa os testes de referências.
