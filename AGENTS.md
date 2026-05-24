<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Handoff Técnico - Totem Octadesk (E-commerce Brasil 2026)

Este projeto foi consolidado e está validado.

## Resumo da Arquitetura
- **Stack**: Next.js 16 (React 19) com exportação estática (`output: 'export'`), estilizado com Tailwind CSS v4.
- **Offline-First**: Armazenamento IndexedDB local utilizando Dexie.js. Os leads são persistidos localmente com `sincronizado: 0` sob o schema: `leads: '++id, email, perfil_bifurcado, sincronizado, criado_em'`.
- **Motor de Decisão**: Algoritmo puro em `src/utils/bifurcation.ts`.
- **Uso do Polvo**: O estado da UI e as transições do Polvo são controlados pelo hook `usePolvo.ts` com os estados `idle`, `thinking`, `trilha_enterprise`, `trilha_automacao`, `trilha_atendimento` e `trilha_controle`.
- **Painel de Controle**: Acessível no rodapé com autenticação PIN `2026`. Permite sincronização em lote (Batch POST) e exportação de emergência (download CSV).

Toda a base técnica está homologada e builds de produção executam com sucesso.

