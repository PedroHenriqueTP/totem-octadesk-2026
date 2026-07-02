# Handoff Técnico - Totem Octadesk (E-commerce Brasil 2026)

Este documento define o ecossistema de agentes e a arquitetura técnica da aplicação.

---

## 1. Time de Agentes e Papéis

Para coordenar a manutenção e evolução deste projeto, a seguinte equipe de agentes virtuais é definida:

### 👤 Architect & Core Developer (Antigravity)
- **Responsabilidade**: Garantir a integridade da lógica de negócios, do motor de decisão (`bifurcation.ts`) e da sincronização de dados local (Dexie.js/IndexedDB) com o HubSpot.
- **Diretriz**: Seguir padrões modernos de React 19 / Next.js 16 e manter o código modular e legível.

### 🎨 Design & UX Auditor
- **Responsabilidade**: Assegurar a fidelidade visual com os mockups físicos do projeto, gerenciar paletas de cores, tipografia, espaçamento e garantir o atendimento sem barras de rolagem vertical (experiência fluida em tablets).
- **Diretriz**: Monitorar o uso correto do logotipo oficial de duas cores (squircle azul) e dos fundos dinâmicos baseados em potencial.

### 🔌 Integration & Analytics Oracle
- **Responsabilidade**: Supervisionar a integridade das integrações (HubSpot API) e a segurança/integridade do IndexedDB local para contingência offline.
- **Diretriz**: Garantir persistência de dados íntegra e sincronização resiliente.

---

## 2. Resumo da Arquitetura

- **Stack**: Next.js 16 (React 19) com exportação estática (`output: 'export'`), estilizado com Tailwind CSS v4.
- **Offline-First**: Armazenamento IndexedDB local utilizando Dexie.js. Os leads são persistidos localmente com `sincronizado: 0` sob o schema: `leads: '++id, email, perfil_bifurcado, sincronizado, criado_em'`.
- **Motor de Decisão**: Algoritmo puro em `src/utils/bifurcation.ts`.
- **Lógica do Polvo**: O estado da UI e as transições do Polvo são controlados pelo hook `usePolvo.ts` com os estados `idle`, `thinking`, `trilha_enterprise`, `trilha_automacao`, `trilha_atendimento` e `trilha_controle`.
- **Painel de Controle**: Acessível no rodapé com autenticação PIN `2026`. Permite sincronização em lote (Batch POST) e exportação de emergência (download CSV).

---

## 3. Diretrizes de Qualidade e Interface (Compliance)

1. **Sem Barras de Rolagem**: O app do totem deve ser exibido em tela cheia (`100vh` ou `100dvh`). Nenhuma tela de pergunta ou resultado deve disparar barra de rolagem. Espaçamentos (`margins`, `paddings`) devem ser pequenos e responsivos.
2. **Branding Consistente**: O logotipo deve usar o squircle azul (#2D62FF) e o polvo em sua cor padrão.
3. **Contrastes Claros**: A tela final do totem muda de cor dependendo da pontuação do lead. O texto deve mudar automaticamente para preto/navy em fundos claros (branco/celeste/gelo) e branco em fundos escuros (azul/marinho) para total legibilidade.
