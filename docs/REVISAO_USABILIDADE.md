# Revisão de aparência e usabilidade

Revisão de 13/11/2026. Escopo: consulta e edição direta do Bestiário, em celular e computador, com dados locais. Sem contas, sincronização ou serviços de salvamento em nuvem. O repositório MyApplication não foi alterado.

## Diagnóstico e mudanças implantadas

| Problema observado | Ajuste |
| --- | --- |
| O catálogo completo criava aproximadamente 39 mil elementos e uma página de 388 mil pixels de altura no celular. | Paginação de 40 criaturas, contagem total e navegação nas duas extremidades. Busca, filtros e exportação continuam considerando todos os resultados. |
| Controles e filtros ocupavam a primeira tela; ferramentas cortavam horizontalmente. | Cabeçalho móvel com menu, filtros avançados recolhidos, ações secundárias em “Mais” e visão de lista compacta como padrão. |
| Nomes longos eram cortados; imagens genéricas repetidas consumiam espaço. | Nomes com quebra de linha, origem visível e retirada de retratos genéricos redundantes. |
| A consulta exigia lembrar acentos ou percorrer livros. | Busca global inicial, comparação sem acentos, opção de pesquisar conteúdo das fichas e acesso às cinco criaturas recentes. |
| A ficha abria na posição de rolagem da lista. | Abertura no topo e restauração da posição ao voltar; conservação dos filtros e página. |
| Informações opcionais empurravam os atributos para baixo. | Estatísticas essenciais primeiro; história, combate temporário e detalhes adicionais expansíveis. |
| Ações pequenas e pouco claras no celular. | Alvos de toque maiores, rótulos nas ações principais, ações destrutivas em vermelho e ação principal em âmbar. |
| Textos coloridos perdiam contraste no pergaminho; textos secundários eram escuros no tema noturno. | Revisão de contraste, cores semânticas específicas e dados sobre superfícies mais legíveis, mantendo a identidade visual do bestiário. |
| Escolha manual de aparência era substituída pelo sistema. | Preferência manual persistente e opção explícita para seguir a aparência do sistema. |
| Formulário começava pelo retrato e exigia rolar para salvar. | Identificação primeiro, imagem opcional recolhida e barra de salvamento acessível no celular. |
| Cancelar podia descartar trabalho sem aviso; falha de armazenamento podia aparentar sucesso. | Confirmação de descarte e tratamento de falha mantendo os dados no editor, com mensagem e possibilidade de tentar novamente. |
| Exclusões e avisos usavam diálogos nativos inconsistentes. | Confirmações integradas para exclusão/restauração e avisos discretos para operações comuns. |
| Diálogos não gerenciavam foco consistentemente. | Foco inicial, ciclo de Tab, devolução de foco, bloqueio da rolagem de fundo, nomes acessíveis e Escape para fechar sobreposições. |
| Valores desconhecidos prejudicavam estatísticas/encontros. | Estágio desconhecido apresentado como não informado, médias apenas com valores numéricos e referências sem ficha fora da geração de combate. |

A navegação Android mantém o comportamento solicitado: voltar fecha a sobreposição, retorna da ficha/lista/editor e, na tela inicial, pede confirmação antes de sair. Alterações pendentes no editor recebem confirmação de descarte.

## Verificação

- Testes unitários da ordem de navegação e limpeza do listener nativo.
- Testes do inventário e integridade das criaturas importadas.
- TypeScript e compilação de produção.
- Testes Chromium automatizados de busca sem acentos, paginação, filtros, retorno à posição, formulário, falha de armazenamento e recuperação, confirmação de exclusão, recentes e persistência de aparência.
- Fluxo Android exercitado com ponte Capacitor simulada, incluindo confirmação de saída.
- Verificação de largura em 320, 390, 768 e 1440 pixels, sem transbordamento horizontal nos fluxos cobertos.
- Auditoria automatizada Axe (WCAG A/AA) nas telas principais e nos painéis de dados, regras, estatísticas, encontros, dados locais e PDF, em modos claro e escuro.
- Inspeção visual de capturas em celular e computador.

Comandos básicos: `npm run test:back`, `python -m unittest discover -s tests -v`, `npx tsc --noEmit`, `npm run build`. Os testes `tests/usability.browser.mjs` e `tests/androidBack.browser.mjs` exigem Vite em execução e Playwright; `PLAYWRIGHT_MODULE` pode apontar para a instalação externa. Não adicionam dependências ao aplicativo.

A auditoria automatizada não equivale a certificação de acessibilidade. O APK ainda precisa ser experimentado em aparelho físico para avaliar teclado Android, botão/gesto voltar, áreas seguras e conforto durante uma sessão de jogo. O armazenamento continua local: exportar backup permanece importante antes de desinstalar o aplicativo ou limpar seus dados.
