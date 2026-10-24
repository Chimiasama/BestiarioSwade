# Plano de Implantação de Melhorias - Bestiário de Lendas (SWADE)

Este documento estabelece o roteiro técnico e arquitetural de implantação para as melhorias propostas na análise crítica do aplicativo **Bestiário de Lendas** para *Savage Worlds Edição Aventura (SWADE)*.

---

## 🎯 **Objetivos Gerais**

1. **Aprimorar a Automação de Combate em Mesa**:
   - Transformar strings de armas/ataques em botões interativos de rolagem de dano com cálculo de Força e explosão de Ases.
2. **Expandir Ferramentas do Mestre (Gerenciamento de Campanhas)**:
   - Permitir salvar, carregar, renomear e excluir composições de encontros customizados para sessões de jogo preparadas antecedência.
3. **Segurança e Apresentação para Jogadores (Modo Jogador / Fog of War)**:
   - Oferecer um modo de visualização para o Mestre ocultar histórias secretas, fraquezas e notas confidenciais ao projetar ou compartilhar a tela com os jogadores.
4. **Otimização de Armazenamento e Escalabilidade**:
   - Integrar suporte a **IndexedDB** para fotos e retratos em alta resolução (Base64), evitando estouro da cota de 5MB do `localStorage`.

---

## 📋 **Fases de Implantação**

### **Fase 1: Automação de Dano de Armas e Ataques**
- **Arquivos Afetados**: `types.ts`, `services/diceService.ts`, `components/Bestiary.tsx`, `components/MonsterCreator.tsx`
- **Ações**:
  - Implementar o parser de expressões de dano (ex: `For+d8`, `2d6+1`, `For+d6+2`).
  - Renderizar botões de ataque interativos na ficha estendida e nos cartões rápidos.
  - Exibir o resultado detalhado da rolagem de dano na Modal de Dados com soma e detecção de Ases.

### **Fase 2: Salvamento de Encontros de Campanha**
- **Arquivos Afetados**: `components/EncounterBuilderModal.tsx`, `services/customMonsterService.ts`
- **Ações**:
  - Criar estrutura de dados `SavedEncounter` para salvar composições de monstros com contadores e notas do Mestre.
  - Adicionar interface de gerenciamento (Salvar Encontro Atual, Carregar Encontro Salvo, Deletar Encontro).

### **Fase 3: Modo de Visualização do Jogador (Player View / Fog of War)**
- **Arquivos Afetados**: `App.tsx`, `types.ts`, `components/Bestiary.tsx`
- **Ações**:
  - Implementar alternador global e por ficha para ocultar a seção de história/lenda secreta e notas confidenciais.
  - Exibir apenas estatísticas visíveis, arte do monstro e nome/arquétipo para os jogadores na mesa.

### **Fase 4: Armazenamento Otimizado com IndexedDB para Fotos**
- **Arquivos Afetados**: `services/customMonsterService.ts`
- **Ações**:
  - Criar o serviço IndexedDB `swade_image_db` para salvar strings de Base64 de imagens.
  - Fallback automático para URLs e migração transparente do LocalStorage.

---

## 🔍 **Critérios de Validação e Qualidade**
- Todos os componentes devem compilar sem erros de TypeScript.
- Compatibilidade total com os 8 temas (diurnos e noturnos).
- Responsividade garantida em dispositivos móveis e desktops.
