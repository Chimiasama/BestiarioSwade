# Ataques na ficha e correções visuais

Revisão de 13/11/2026, a partir das capturas de uma versão anterior.

## Ataque e dano

A seção **Armas e ataques** procura fórmulas no campo de armas e também nas habilidades de ataques naturais, como Garras/Mordida. A varredura dos dados atuais reconheceu fórmulas em 604 criaturas, 560 delas sem campo de armas. Textos sem fórmula não recebem dano inventado. Ataques com regras especiais de área, resistência ou dano automático devem ser conferidos pelo mestre; “Dano direto” permite rolar sem teste de acerto.

- **Atacar** abre um painel com perícia, dificuldade e modificador. Sugere Lutar, Atirar ou Atletismo conforme o ataque; quando a perícia não existe, apresenta Sem treino d4−2. É possível escolher outra perícia da ficha.
- Informe Aparar do alvo no corpo a corpo; à distância, a dificuldade normalmente é 4, com ajustes de alcance, cobertura e outras condições. O modificador inicial considera os marcadores temporários de ferimentos e fadiga da ficha; pode ser editado.
- Cartas Selvagens rolam a perícia e d6 Selvagem, usando o maior resultado com o modificador. Extras rolam a perícia. Os dados explodem ao atingir a face máxima.
- O resultado informa acerto, erro, falha crítica e ampliações. Uma ampliação concede **um único d6 adicional de dano**, independentemente de quantas ampliações ocorreram.
- Por padrão, um acerto já rola o dano. É possível desativar essa opção e rolar manualmente depois do acerto.
- O dano soma todos os dados e explosões. **Não existe Dado Selvagem no dano.** Força d8+2 com Garras For+d4 resolve d8+2+d4, preservando o bônus da Força. Modificadores negativos também são respeitados.
- A fórmula e o modificador de dano são editáveis. Fórmulas inválidas mostram erro; não são substituídas silenciosamente por outra expressão.
- Rolagens entram no histórico da sessão. O total não aplica ferimentos automaticamente ao alvo: compare com a Resistência e a armadura adequadas.

O parser anterior separava vírgulas dentro dos parênteses, confundia notas com ataques e atribuía For+d4 a textos sem dano. Esses comportamentos foram removidos. Também foram corrigidos a exibição duplicada de modificadores do teste e o reprocessamento de dano no rolador antigo. Explosões não são mais truncadas após vinte resultados máximos.

## Modo noturno e teclado

As capturas mostram o seletor antigo de templates, substituído pela biblioteca atual. A biblioteca atual foi verificada nos modos claro e escuro. Foram reforçadas as cores dos controles nativos: `color-scheme`, foco, seleção de opções e preenchimento automático seguem o tema escolhido. O WebView Android deixa de aplicar escurecimento automático sobre as cores definidas pelo aplicativo.

O tratamento nativo já aplicava o espaço do teclado como padding. A Activity agora usa `adjustNothing`, para que o sistema não redimensione/panore novamente a mesma área. A compensação fica em um único ponto, no listener de insets. No editor, o campo focado é trazido para a área visível; a barra fixa de salvar volta ao fluxo do formulário enquanto o teclado ocupa a tela.

**Astúcia** é o nome exibido no editor, ficha e PDFs. O importador ainda reconhece nomes antigos nos livros para manter compatibilidade, e os textos originais das fontes não foram reescritos.

## Validação

- `npm run test:combat`: testes determinísticos de acerto, modificadores, falha crítica, ampliações, dano com Força, modificadores negativos, ausência de Dado Selvagem, explosões (inclusive mais de vinte), parser e varredura de todas as criaturas.
- `tests/combat.browser.mjs`: formulário escuro com janela reduzida simulando teclado; cores da biblioteca; terminologia; ataques provenientes apenas de habilidades; acerto/erro; dano manual/automático; ampliação e fórmulas inválidas.
- Regressões do catálogo, biblioteca de modelos, editor e navegação Android com ponte Capacitor simulada.
- Auditoria Axe do painel de ataque nos temas claro e escuro; TypeScript e build web. A compilação Android do workflow valida também as mudanças nativas.

A simulação de teclado no navegador verifica o layout, não substitui o teclado real Samsung/Android. No APK, verificar: focar Raça, digitar, fechar o teclado, abrir a biblioteca no modo noturno e executar um ataque. Não houve teste em aparelho físico nesta execução.
