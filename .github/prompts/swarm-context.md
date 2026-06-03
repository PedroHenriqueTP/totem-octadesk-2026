# CONTEXTO DO ENXAME DE AGENTES (TOTEM OCTADESK DEEPDIVE)

Você deve configurar a árvore de agents e skills dentro da camada de infraestrutura e hooks do Next.js (`src/core/data` ou `src/hooks`). O funcionamento lógico do Quiz deve acionar o enxame da seguinte forma:

1. Cada clique nas alternativas A ou B das 5 questões deve somar peso no objeto de `scores` mapeado em `quiz-journey.ts`.
2. Ao atingir a tela de resultados, o `Agente Orquestrador` deve avaliar qual chave do objeto (`faq`, `sales`, `carrinho`, `atendimento`) recebeu a maior pontuação de dor.
3. A interface do tablet deve renderizar um bloco exclusivo detalhando a "Defesa da I.A." e a skill correspondente do Agente Especialista que resolve aquele prejuízo operacional.
4. Mantenha os arquivos de código 100% limpos de comentários redundantes, deixando as definições de arquitetura estritamente restritas a este arquivo de documentação de contexto.

---

## 🐝 Arquitetura do Enxame: Agentes & Skills

### 1. Agente Orquestrador (Core / Router)
* **Skill Principal:** Gerenciamento de Estado e Contexto Global.
* **Função:** Monitora a navegação no tablet, gerencia a transição suave de telas sem rolagem e calcula em tempo real o **Score de Prejuízo Operacional** com base nas respostas A ou B selecionadas pelo usuário.
* **Skill Técnica:** Roteamento dinâmico no Next.js e injeção de contexto nos subagentes assim que o botão "Iniciar Deepdive" é acionado.

### 2. Agente Especialista: Atendimento Comercial 24/7 (WOZ Core)
* **Skill Principal:** Resolução de Contexto e Disponibilidade Ininterrupta.
* **Função:** Ativado se o usuário pontuar alto na **Dor 1** (perda de vendas à noite/finais de semana).
* **Skill Técnica:** Simula a qualificação imediata de leads em linguagem natural, demonstrando como a IA da Octadesk responde instantaneamente sem depender de intervenção humana ou menus rígidos e travados.

### 3. Agente Especialista: Automação de Vendas (Sales Agent)
* **Skill Principal:** Condução de Fluxo Comercial e Fechamento.
* **Função:** Ativado se a maior dor do usuário for a **Dor 2** (vendedores sobrecarregados e perda de timing).
* **Skill Técnica:** Roteamento de catálogo interativo e geração de links de pagamento direto na interface de conversação simulada, demonstrando como fechar pedidos de ponta a ponta sem transbordo humano.

### 4. Agente Especialista: Triagem e Dúvidas Frequentes (FAQ Agent)
* **Skill Principal:** Engenharia de Prompt Baseada em Conhecimento (RAG Local).
* **Função:** Ativado se a dor do cliente for a **Dor 3** (tempo da equipe desperdiçado com perguntas repetitivas como prazos e trocas).
* **Skill Técnica:** Absorção de manuais, PDFs e regras de negócio da empresa para responder de forma natural, precisa e instantânea, mantendo o histórico unificado da conversa.

### 5. Agente Especialista: Recuperação Ativa (Carrinhos Abandonados)
* **Skill Principal:** Monitoramento de Eventos e Gatilhos Ativos (Webhooks).
* **Função:** Ativado se o gargalo for a **Dor 4** (desistência de compra no checkout do e-commerce).
* **Skill Técnica:** Disparo ativo de notificações personalizadas via WhatsApp (API Oficial da Meta) assim que o abandono é detectado, engajando o cliente com suporte imediato para salvar a venda.

### 6. Agente Analista: Performance & Monitoria (Métricas Agent)
* **Skill Principal:** Agregação de Dados e Geração de Relatórios (Analytics).
* **Função:** Ativado na tela final do diagnóstico para expor o panorama geral do negócio do cliente (Métricas/CSAT da **Dor 5**).
* **Skill Técnica:** Geração dinâmica de gráficos e dashboards compactos na tela do tablet, exibindo o tempo médio de resposta, índice de satisfação gerado automaticamente e o alerta de risco operacional.
