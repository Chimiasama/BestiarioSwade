# Biblioteca de modelos de criatura

Análise de 13/11/2026. Foram varridas todas as **1.126 entradas** distribuídas com o aplicativo: **1.106 fichas completas e 20 referências/modelos sem ficha própria**. As referências ficam fora das estatísticas e da classificação. As fichas originais não foram modificadas.

## O que a análise mostrou

- 902 entradas usam raça “Não especificada”. A classificação considera identidade, perícias, ataques e nomes de habilidades, em vez de depender apenas da raça. Não usa o histórico para inferir natureza ou poder.
- Resistência numérica disponível em 1.104 fichas: mediana 8; metade central entre 6 e 11; intervalo observado de 1 a 36.
- Aparar: mediana 6; metade central entre 5 e 6. Tamanho explícito disponível em 494 fichas; os valores ausentes não foram tratados como zero na análise.
- Ataques naturais, medo, voo, armadura, mortos-vivos, constructos e intangibilidade formam padrões recorrentes. Esses padrões justificam famílias com mecânicas distintas, além de combatentes e conjuradores.
- 17 fichas completas ficaram como “Sem padrão seguro”. Não foram forçadas para uma família. Uma criatura pode ter vários papéis, por isso as contagens das famílias não devem ser somadas.

## Modelos disponibilizados

**72 modelos novos**, em 18 famílias e quatro patamares, mais os **7 modelos clássicos preservados**: 79 opções no total.

Os novos modelos são propostas autorais informadas pelos padrões do acervo, não médias automáticas nem cópias de uma criatura específica. A progressão preserva a função: magos continuam frágeis fisicamente; brutos ganham tamanho e força; enxames mantêm regras coletivas; comandantes ganham liderança. Patamar, Estágio SWADE e condição de Carta Selvagem não são a mesma coisa.

| Família | Patamares de criação | Fichas com esse papel sugerido | Mediana da Resistência observada |
| --- | --- | ---: | ---: |
| Soldados e comandantes | Soldado → Tenente → Capitão → Comandante | 269 | 8 |
| Atiradores | Arqueiro recruta → Atirador treinado → Atirador de elite → Mestre atirador | 46 | 6 |
| Ladinos e assassinos | Batedor → Infiltrador → Assassino veterano → Mestre das sombras | 18 | 7 |
| Brutos e gigantes | Brutamontes → Ogro de guerra → Gigante esmagador → Colosso | 77 | 13 |
| Feras e ataques naturais | Predador jovem → Predador adulto → Predador alfa → Fera ancestral | 485 | 8 |
| Enxames | Pequeno enxame → Enxame voraz → Nuvem predadora → Praga colossal | 3 | 7 |
| Criaturas aquáticas | Caçador de rio → Predador abissal → Terror das profundezas → Leviatã | 75 | 10 |
| Voadores e alados | Caçador alado → Predador dos céus → Soberano das alturas → Terror celeste | 135 | 7 |
| Mortos-vivos | Cadáver reanimado → Guardião sepulcral → Cavaleiro da tumba → Senhor dos mortos | 95 | 9 |
| Espíritos e aparições | Aparição inquieta → Espectro → Assombração maior → Espírito ancestral | 58 | 6 |
| Demônios e horrores | Servo infernal → Demônio caçador → Senhor infernal → Príncipe do abismo | 44 | 7 |
| Constructos e máquinas | Autômato simples → Sentinela mecânica → Golem de guerra → Titã artificial | 81 | 10 |
| Elementais | Centelha elemental → Elemental → Elemental maior → Avatar elemental | 36 | 8 |
| Plantas e fungos | Broto hostil → Guardião de vinhas → Árvore desperta → Ancião da floresta | 15 | 12 |
| Dragões | Cria de dragão → Dragão jovem → Dragão adulto → Dragão ancestral | 11 | 20 |
| Magos e arcanistas | Mago aprendiz → Mago pleno → Mestre arcano → Arquimago | 69 | 7 |
| Sacerdotes e xamãs | Acólito → Sacerdote → Hierofante → Sumo sacerdote | 12 | 8 |
| Psiônicos | Sensitivo → Adepto psiônico → Mestre mental → Arconte psiônico | 45 | 9 |

## Uso no aplicativo

1. Abra **Criar → Explorar 79 modelos de criatura**.
2. Escolha família, patamar ou pesquise por nome. A prévia apresenta atributos, perícias, ataques, poderes, habilidades, fraquezas e exemplos relacionados no acervo.
3. Toque em **Usar modelo** e confirme. Nome, história e retrato são preservados; a ficha mecânica é substituída. Cancelar a confirmação mantém os dados atuais.
4. Personalize e salve normalmente no aparelho. Os poderes e Pontos de Poder possuem campo próprio e são preservados na edição.

No catálogo, **Filtros → Papel sugerido da criatura** permite explorar os mesmos padrões. O filtro considera também criaturas criadas ou importadas no aparelho. A origem do modelo é guardada em `templateId`; o classificador considera essa origem e as mecânicas presentes.

Os patamares 1 e 2 começam como Extras; 3 e 4, como Cartas Selvagens. Isso é uma sugestão editável, sem alterar automaticamente o Estágio SWADE. Os modelos arcanos incluem listas de poderes e recursos crescentes, sujeitos às regras e requisitos da mesa. Poderes não são efeitos permanentemente ativos.

Aparar deriva de Lutar. Resistência inclui Vigor, Tamanho, armadura e os bônus de natureza quando indicados, sem somá-los novamente. Imunidades, fraquezas e regras próprias do modelo são descritas na ficha. Defina a fraqueza de uma criatura etérea antes de colocá-la em jogo.

## Auditoria e manutenção

- `npm run analyze:templates`: reproduz a varredura e gera `data/templateCatalogAnalysis.json` (uma linha lógica por entrada, com identificador e papéis) e `data/templateFamilySummary.json` (resumo utilizado pela interface).
- `npm run test:templates`: verifica cobertura das famílias, progressão, integridade das fórmulas, isolamento dos modelos, preservação da identidade e correspondência de cada classificação com a auditoria salva.
- `tests/templates.browser.mjs`: cobre seleção, prévia, confirmação/cancelamento, salvamento e reedição dos poderes, filtro por papel, estados vazios, Escape e larguras 320/390/768/1440.
- Auditoria Axe da biblioteca nos modos claro e escuro; TypeScript, build e regressões de navegação e edição.

Limite: a classificação é uma sugestão heurística e pode exigir revisão em criaturas híbridas ou com terminologia incomum. O catálogo de origem contém traduções e valores incompletos; a análise não inventa o que falta. Os modelos precisam ser ajustados ao cenário e ao grupo; não constituem uma garantia matemática de equilíbrio de encontros.
