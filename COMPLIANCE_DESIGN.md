# Diretrizes de Entrega de Assets: Animações do Polvo

## Formatos Suportados
- **Rive (.riv)**: Altamente recomendado pela performance nativa via WebGL.
- **Lottie (.json)**: Aceito utilizando renderização canvas/svg acelerada por hardware.

## Tabela de Estados da Animação
| Estado da UI | Gatilho Técnico | Descrição da Animação | Loop |
| :--- | :--- | :--- | :--- |
| `idle` | Hook usePolvo em espera | Movimento sutil dos tentáculos, respiração, aguardando interação. | Sim |
| `thinking` | Processando respostas | Animação dinâmica do polvo calculando (ex: luzes piscando, tentáculos girando). | Sim |
| `trilha_enterprise` | Perfil Enterprise definido | Reação celebrando/direcionando para a trilha Enterprise. | Não |
| `trilha_automacao` | Perfil Automacao definido | Reação celebrando/direcionando para a trilha Automação. | Não |
| `trilha_atendimento` | Perfil Atendimento definido | Reação celebrando/direcionando para a trilha Atendimento. | Não |
| `trilha_controle` | Perfil Controle definido | Reação celebrando/direcionando para a trilha Controle. | Não |

## Requisitos Técnicos de Exportação
- **Resolução**: Vetores puros ou assets de imagem em resolução @2x vertical (otimizado para telas tablet e totens verticais 1080x1920).
- **Aceleração por Hardware**: Evite efeitos pesados de desfoque (blur) ou sombras dinâmicas rasterizadas para garantir 60 FPS estáveis.
- **Estrutura de Nomes**: Salvar os arquivos exatamente com o nome da trilha (ex: `idle.json` / `idle.riv`, `thinking.json` / `thinking.riv`, etc.) dentro de `/public/assets/animations/`.
