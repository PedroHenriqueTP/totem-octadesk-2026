# Lógica de Diagnóstico e Qualificação de Leads (Totem Octadesk)

Este documento descreve a lógica de qualificação, pontuação (lead scoring) e direcionamento visual utilizada no Totem Interativo da Octadesk.

---

## 1. Critérios de Direcionamento

O direcionamento do lead para a etapa da parede é definido a partir da **Pergunta 1 (Dor Principal)**, com as seguintes regras de override:

1. **Override de Início de Jornada**: Se na **Pergunta 4 (Plataforma)** a resposta for *"Ainda não tenho loja online"*, o lead é automaticamente direcionado para a **Etapa 1: Captação**.
2. **Override de Foco em Métricas**: Se na **Pergunta 3 (Volume)** a resposta for *"Não sei / não acompanho esse número"*, o lead é automaticamente direcionado para a **Etapa 5: Helpdesk** (para estruturação e visibilidade).
3. **Mapeamento Padrão**: Caso não ocorram overrides, a resposta da Pergunta 1 define a etapa:
   - Option A -> **Etapa 1: Captação**
   - Option B -> **Etapa 2: Atendimento de Vendas**
   - Option C -> **Etapa 3: Notificações**
   - Option D -> **Etapa 4: Pós-venda**
   - Option E -> **Etapa 5: Helpdesk**

---

## 2. Lead Scoring (Pontuação de Potencial)

A pontuação determina o potencial comercial do visitante em uma escala de **0 a 10 pontos**, somando os seguintes pesos:

### Pergunta 2: Porte (Colaboradores)
- **Menos de 50** (Fora do ICP) = `0 pontos`
- **Entre 50 e 200** (Média) = `1 ponto`
- **Entre 200 a 500** (Operação grande - prioridade) = `2 pontos`
- **Mais de 500** (Enterprise) = `3 pontos`

### Pergunta 3: Volume de Atendimentos
- **Menos de 50** (Operação pequena) = `0 pontos`
- **Entre 50 e 200** (Média) = `1 ponto`
- **Mais de 200** (Operação grande - prioridade) = `2 pontos`
- **Não sei / não acompanho** (Sem visibilidade) = `0 pontos`

### Pergunta 4: Plataforma de E-commerce
- **Shopify** (Integração API ativa) = `1 ponto`
- **Tray, VTEX, Nuvemshop...** (Conectores CS) = `1 ponto`
- **Principalmente marketplaces (ML, Shopee...)** (⚠️ Alerta Vendedor) = `3 pontos`
- **Ainda não tenho loja online** = `0 pontos`

### Cadastro: Cargo / Função (Decisor)
- Identificado como decisor (CEO, Dono, Sócio, Diretor, Gerente, Head, Comprador, Coordenador) = `2 pontos`
- Outros cargos = `0 pontos`

---

## 3. Sinalização Subliminar de Cores (Tela Final)

As telas de **Direcionamento**, **Relatório** e **Obrigado** mudam subliminarmente de cor com base na pontuação total para guiar a abordagem do vendedor no estande:

- **0 a 1 ponto (Branco - `#FFFFFF`)**: Lead de menor potencial. Atendimento padrão e autoguiado.
- **2 a 4 pontos (Azul Celeste Suave - `#F0F5FF`)**: Baixo/Médio potencial.
- **5 a 7 pontos (Azul Gelo Intermediário - `#D6E4FF`)**: Médio/Alto potencial.
- **8 a 9 pontos (Azul Vibrante Octadesk - `#2D62FF`)**: Alto Potencial. Atenção do vendedor.
- **10 pontos (Azul Marinho Escuro - `#001B3D`)**: Altíssimo Potencial / Enterprise. Abordagem comercial imediata e prioritária.
