# Botão voltar no Android

O app usa o evento `backButton` do plugin oficial `@capacitor/app`, sem depender de URLs para as telas React.

- Um diálogo aberto é fechado antes de sair da tela. Se há diálogos sobrepostos, fecha primeiro o mais recente.
- Na ficha de uma criatura, volta à lista do mesmo livro/aba.
- No editor, volta à tela de origem. A ficha e os filtros anteriores permanecem montados; salvar atualiza a ficha selecionada.
- Na lista de um livro, no compêndio geral ou nos favoritos, volta à biblioteca inicial.
- Na biblioteca inicial, abre a confirmação **Fechar o aplicativo?**. **Cancelar** ou voltar novamente mantém o app aberto. Somente **Fechar app** chama `App.exitApp()`.
- A confirmação de exclusão do histórico de dados é descartada antes de fechar o rolador.

O teclado e as interfaces nativas do Android continuam usando o comportamento do sistema. A confirmação de saída é específica do aplicativo Android; ela não é registrada no navegador ou no iOS.

## Manutenção

`hooks/useBackNavigation.tsx` registra ações por camada: telas (10), ficha (20), diálogos (100) e confirmação de saída (200). A saída na biblioteca tem prioridade inferior às demais ações. `BackNavigationScope` desabilita as ações de componentes preservados enquanto outra tela está ativa.

Novos diálogos devem chamar `useBackNavigation(isOpen, onClose)` antes de qualquer retorno condicional. O listener nativo é removido no desmontar, inclusive quando o registro assíncrono termina depois da limpeza do efeito no StrictMode.

## Validação

```sh
npm run test:back
npx --no-install tsc --noEmit
npm run build
npx --no-install cap sync android
```

A Action manual de APK também executa `npm run test:back` e compila o plugin nativo. O teste de interface usa Chromium/Playwright e um bridge Android simulado para conferir o evento nativo, os fluxos de navegação, cancelamento e saída confirmada:

```sh
# Com o servidor Vite em execução e Playwright disponível:
PLAYWRIGHT_MODULE=/caminho/para/playwright/index.mjs node tests/androidBack.browser.mjs
```

Essa simulação não substitui experimentar os botões/gestos e o teclado no aparelho físico com o APK atualizado.
