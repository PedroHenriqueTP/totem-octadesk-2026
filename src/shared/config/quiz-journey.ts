export type JornadaVersao = 'CONSULTIVA' | 'ARCADE_COMPLETO' | 'FAST_TRACK';

export const VERSAO_ATIVA: JornadaVersao = 'ARCADE_COMPLETO';

export interface QuizQuestionOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
  scores: {
    faq?: number;
    sales?: number;
    info?: number;
    cart?: number;
  };
  prejuizo?: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizQuestionOption[];
}

export const TOOLS_CONFIG = {
  faq: {
    name: "Agente de I.A. para Dúvidas Frequentes",
    defense: "Responde dúvidas de forma natural e instantânea baseando-se nos seus manuais, reduzindo o esforço do time."
  },
  sales: {
    name: "Agente de Automação (Vendas)",
    defense: "Apresenta produtos e fecha vendas diretamente no WhatsApp e chat, 24 horas por dia."
  },
  info: {
    name: "Sistema de Notificação (Informativo)",
    defense: "Envia updates de status de pedidos e comunicados de forma automatizada no WhatsApp."
  },
  cart: {
    name: "Recuperador de Carrinho Abandonado",
    defense: "Detecta abandono no checkout e entra em contato via WhatsApp para recuperar a conversão."
  }
};

export const quizJourneyConfig = {
  questions: [
    {
      id: 1,
      question: "Como sua empresa gerencia o atendimento fora do horário comercial (noite e finais de semana)?",
      options: [
        { 
          text: "Respostas apenas no próximo dia útil.", 
          isCorrect: false, 
          feedback: "Deixar o cliente esperando até o próximo dia útil aumenta a taxa de abandono e faz você perder leads para concorrentes mais rápidos.", 
          scores: { faq: 3 }, 
          prejuizo: 3 
        },
        { 
          text: "Plantão manual exaustivo.", 
          isCorrect: false, 
          feedback: "Escalar o atendimento humano à noite e fins de semana sobrecarrega o time, gera custos extras e tem altíssimo risco de falhas.", 
          scores: { faq: 2 }, 
          prejuizo: 2 
        },
        { 
          text: "Inteligência Artificial atende na hora, entende o contexto e auxilia em qualquer horário.", 
          isCorrect: true, 
          feedback: "Excelente! O atendimento imediato 24/7 mantém os leads engajados e prontos para converter.", 
          scores: { faq: 0 }, 
          prejuizo: 0 
        }
      ]
    },
    {
      id: 2,
      question: "Qual o maior impacto no fechamento de vendas quando a equipe comercial está ocupada?",
      options: [
        { 
          text: "Clientes esperando na fila.", 
          isCorrect: false, 
          feedback: "Filas de espera longas destroem a taxa de conversão. No WhatsApp e chat, o cliente busca imediatismo.", 
          scores: { sales: 3 }, 
          prejuizo: 3 
        },
        { 
          text: "Vendedores correm e perdem qualidade.", 
          isCorrect: false, 
          feedback: "Pressionar o time de vendas a atender múltiplos contatos simultaneamente reduz a taxa de conversão e causa erros no fechamento.", 
          scores: { sales: 2 }, 
          prejuizo: 2 
        },
        { 
          text: "Agente de I.A. conduz a conversa, apresenta produtos e fecha a venda direto no chat.", 
          isCorrect: true, 
          feedback: "Perfeito! A I.A. atua no primeiro contato garantindo conversas qualificadas e fechamento ágil.", 
          scores: { sales: 0 }, 
          prejuizo: 0 
        }
      ]
    },
    {
      id: 3,
      question: "Quanto tempo sua equipe de suporte gasta respondendo a perguntas repetitivas dos clientes?",
      options: [
        { 
          text: "Equipe passa o dia respondendo dúvidas repetitivas.", 
          isCorrect: false, 
          feedback: "Alocar talentos humanos para responder frete, prazo e estoque é ineficiente e desperdiça tempo que poderia ser focado em fechar negócios.", 
          scores: { faq: 3 }, 
          prejuizo: 3 
        },
        { 
          text: "Tentamos respostas prontas, mas fica frio.", 
          isCorrect: false, 
          feedback: "Respostas automáticas estáticas e frias afastam o cliente. A I.A. conversacional resolve de forma personalizada e humanizada.", 
          scores: { faq: 2 }, 
          prejuizo: 2 
        },
        { 
          text: "Agente de I.A. lê os manuais da empresa e responde de forma natural e instantânea.", 
          isCorrect: true, 
          feedback: "Isso mesmo! O agente de I.A. resolve as dúvidas operacionais imediatamente, liberando o time para casos complexos.", 
          scores: { faq: 0 }, 
          prejuizo: 0 
        }
      ]
    },
    {
      id: 4,
      question: "O que acontece na sua operação quando um cliente abandona o carrinho no último segundo do pagamento?",
      options: [
        { 
          text: "Perdemos a venda definitivamente.", 
          isCorrect: false, 
          feedback: "Não recuperar carrinhos abandonados significa deixar dinheiro na mesa. Mais de 70% dos carrinhos são abandonados.", 
          scores: { cart: 3 }, 
          prejuizo: 3 
        },
        { 
          text: "E-mail de recuperação com baixa abertura.", 
          isCorrect: false, 
          feedback: "E-mails têm taxas de abertura inferiores a 15% atualmente. O WhatsApp garante abertura imediata e maior conversão.", 
          scores: { cart: 2 }, 
          prejuizo: 2 
        },
        { 
          text: "Agente de I.A. detecta o abandono na hora e entra em contato via WhatsApp para recuperar a venda.", 
          isCorrect: true, 
          feedback: "Sensacional! A abordagem instantânea no canal favorito do cliente aumenta muito a chance de conversão.", 
          scores: { cart: 0 }, 
          prejuizo: 0 
        }
      ]
    },
    {
      id: 5,
      question: "Qual o nível de clareza que você tem sobre a qualidade de atendimento e o tempo de resposta do time?",
      options: [
        { 
          text: "Sem controle de métricas.", 
          isCorrect: false, 
          feedback: "Quem não mede não gerencia. Sem dados claros, é impossível identificar gargalos ou avaliar a satisfação dos clientes.", 
          scores: { faq: 3 }, 
          prejuizo: 3 
        },
        { 
          text: "Equipe preenche relatórios manuais cansativos.", 
          isCorrect: false, 
          feedback: "Relatórios manuais gastam tempo produtivo da equipe e são altamente propensos a erros e omissões.", 
          scores: { faq: 2 }, 
          prejuizo: 2 
        },
        { 
          text: "Pesquisas de satisfação automatizadas ao fim de cada conversa e relatórios em tempo real.", 
          isCorrect: true, 
          feedback: "Excelente! Dados consolidados e automáticos garantem a governança e melhoria contínua do atendimento.", 
          scores: { faq: 0 }, 
          prejuizo: 0 
        }
      ]
    }
  ] as QuizQuestion[],

  rewards: {
    high_score: {
      title: "Mestre da Eficiência Operacional",
      brinde: "Kit Premium Octadesk (Garrafa Inox + Caderno Executive)",
      badgeColor: "#001B3D"
    },
    participation: {
      title: "Explorador do Ecossistema",
      brinde: "Brinde Oficial Fórum 2026 (PopSocket + Stickers Exclusivos)",
      badgeColor: "#4A5A70"
    }
  }
};
