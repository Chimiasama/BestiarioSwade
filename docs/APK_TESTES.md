# APK de testes

No GitHub, abra **Actions → Build Android APK → Run workflow**, selecione `main` (ou outra branch que contenha a Action) e execute.

A Action valida o catálogo e os tipos, compila o site, sincroniza os arquivos web com o Capacitor e executa `:app:assembleDebug`. Ela não roda automaticamente em pushes.

Ao terminar, abra a execução e baixe o artefato **bestiario-de-lendas-debug-<número>** em **Artifacts** ou pelo link no resumo. Extraia o ZIP para obter `app-debug.apk`. Os artefatos ficam disponíveis por 14 dias.

O APK pode ser instalado para testes no Android 7.0 ou superior (API 24). É assinado com a chave debug do runner; não exige segredo nem chave de produção. Como a chave debug pode mudar entre execuções, uma atualização pode exigir desinstalar a versão de teste anterior. Exporte seu backup JSON antes de desinstalar para preservar suas criações locais.

A build utiliza Node 24, Java 21 e o SDK definido em `android/gradle/libs.versions.toml`. A distribuição Gradle tem checksum SHA-256 verificado pelo wrapper. A Action não publica releases nem envia o APK para a Play Store.
