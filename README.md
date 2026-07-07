# 🐙 Totem Octadesk DeepDive — E-Commerce Brasil 2026

> **Totem interativo de diagnóstico operacional** para uso em estandes físicos de eventos de e-commerce. Captura e qualifica leads em tempo real com integração HubSpot e armazenamento offline-first via IndexedDB.

---

## 🎯 Visão Geral

O **Octadesk DeepDive** é uma Progressive Web App (PWA) desenvolvida em Next.js 16 e React 19, projetada para rodar em tablets verticais em estandes físicos de eventos. O visitante realiza um diagnóstico de 4 perguntas sobre sua operação de e-commerce, recebe uma recomendação de solução personalizada e é direcionado visualmente para a etapa correspondente na parede do estande.

### Fluxo de Telas

```
Recepção → Cadastro → Dor Principal (P1) → Qualificação (P2-P4) → Processando → Direcionamento → Relatório → Obrigado
```

---

## 🏗️ Arquitetura

- **Stack**: Next.js 16 (React 19) com exportação estática (`output: 'export'`)
- **Estilização**: Tailwind CSS v4
- **Offline-First**: IndexedDB via [Dexie.js](https://dexie.org/) — leads persistidos localmente com flag `sincronizado: 0`
- **Motor de Decisão**: [`src/utils/bifurcation.ts`](./src/utils/bifurcation.ts) — algoritmo puro de scoring e direcionamento
- **Integração**: HubSpot Forms API via [`src/infra/hubspot.ts`](./src/infra/hubspot.ts)
- **Sincronização**: [`src/infra/sync-middleware.ts`](./src/infra/sync-middleware.ts) — auto-sync a cada 30s + listener de rede
- **PWA**: Service Worker gerado pelo `@ducanh2912/next-pwa`

---

## 📊 Lógica de Qualificação (Lead Scoring)

A pontuação determina o potencial comercial do visitante (0–10 pts):

| Critério | Pontuação |
|---|---|
| Equipe 50–200 | +1 pt |
| Equipe 200–500 | +2 pts |
| Equipe 500+ | +3 pts |
| Volume 50–200/mês | +1 pt |
| Volume 200+/mês | +2 pts |
| Shopify / Plataforma própria | +1 pt |
| Marketplace (ML, Shopee, Magalu) | +3 pts ⚠️ |
| Cargo decisor (CEO, Diretor, etc.) | +2 pts |

### Cores Dinâmicas por Score

| Score | Cor de Fundo | Perfil |
|---|---|---|
| 0–1 | `#FFFFFF` Branco | Padrão |
| 2–4 | `#F0F5FF` Azul Celeste | Baixo potencial |
| 5–7 | `#D6E4FF` Azul Gelo | Médio/Alto |
| 8–9 | `#2D62FF` Azul Octadesk | Alto potencial |
| 10 | `#001B3D` Azul Marinho | Enterprise — abordagem imediata |

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js 20+
- npm 10+

### Desenvolvimento (LAN / Tablet)

```bash
npm install
npm run dev
# Disponível em http://localhost:3000
# Acessível na rede local via http://<IP-da-máquina>:3000
```

### Build de Produção

```bash
npm run build
# Gera saída estática em /out/
```

---

## 🗂️ Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router (layout, page, globals.css)
├── presentation/
│   └── components/
│       ├── QuizApp.tsx     # Componente principal (todas as telas)
│       ├── AdminPanel.tsx  # Painel de controle (PIN: 2026)
│       └── OctoMascot.tsx  # Mascote SVG animado
├── utils/
│   └── bifurcation.ts      # Motor de decisão e scoring
├── hooks/
│   └── usePolvo.ts         # Hook de estado do mascote
├── data/
│   └── db.ts               # Schema Dexie/IndexedDB
├── infra/
│   ├── hubspot.ts          # Cliente HubSpot Forms API
│   ├── sync-middleware.ts  # Lógica de sincronização offline→online
│   └── local-storage-manager.ts
├── shared/config/          # Configuração do Quiz (perguntas e opções)
└── types/
    └── diagnostico.ts      # Tipos TypeScript do domínio
public/
└── assets/                 # Logos, SVGs e ilustrações das etapas
```

---

## ⚙️ Painel de Controle (Administrador)

Acessível pelo botão **⚙️** no canto inferior direito de qualquer tela.

- **PIN de acesso**: `2026`
- **Funcionalidades**:
  - Visualizar todos os leads capturados localmente
  - Sincronização em lote com o HubSpot
  - Exportação de emergência em CSV
  - Indicador de status de conectividade

---

## 🎨 Branding

- **Cor primária**: `#2D62FF` (Azul Octadesk)
- **Cor dark**: `#001B3D` (Azul Marinho Enterprise)
- **Fonte**: Poppins (Google Fonts)
- **Logo**: Squircle azul + texto Octadesk

---

## 📋 Diretrizes de Qualidade

- ✅ **Sem scroll vertical**: Todas as telas cabem em 100dvh
- ✅ **Touch-first**: `touch-action: manipulation` em todos os elementos interativos
- ✅ **Offline resiliente**: Dados nunca são perdidos — sempre persistidos localmente antes do sync
- ✅ **Contrast compliance**: Texto preto/navy em fundos claros, branco em fundos escuros

---

## 📝 Licença

Projeto proprietário — **Octadesk / Movidesk** © 2026. Todos os direitos reservados.
