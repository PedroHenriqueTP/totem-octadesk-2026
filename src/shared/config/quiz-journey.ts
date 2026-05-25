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
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizQuestionOption[];
}

export const TOOLS_CONFIG = {
  faq: {
    name: "Atendimento Automatizado (FAQ)",
    defense: "Foco total na redução de custos operacionais e tempo de resposta de dúvidas repetitivas. Libera a equipe humana para tratar apenas de casos complexos e estratégicos."
  },
  sales: {
    name: "Agente de Automação (Vendas)",
    defense: "Foco na atração e qualificação de clientes em tempo real. Prospecção automatizada de leads 24/7 para garantir que nenhum cliente fique sem resposta na jornada comercial."
  },
  info: {
    name: "Sistema de Notificação (Informativo)",
    defense: "Foco na proatividade operacional. Envia notificações automáticas de status de pedido e atualizações aos clientes antes que eles precisem perguntar, eliminando o estresse pós-venda."
  },
  cart: {
    name: "Recuperação de Carrinho Abandonado",
    defense: "Foco na conversão cirúrgica de vendas perdidas no checkout. Identifica desistências e reengaja o usuário via mensagens e ofertas dinâmicas no WhatsApp para recuperar receita imediata."
  }
};

export const quizJourneyConfig = {
  questions: [
    {
      id: 1,
      question: "Quantas mentes comandam o seu atendimento hoje?",
      options: [
        { text: "1 (Eu sozinho)", isCorrect: true, feedback: "Mapeado para triagem inicial simplificada.", scores: { faq: 1 } },
        { text: "2 a 5", isCorrect: true, feedback: "Mapeado para escala comercial de micro-equipe.", scores: { sales: 1 } },
        { text: "6 a 15", isCorrect: true, feedback: "Mapeado para suporte e atendimento estruturado.", scores: { info: 1 } },
        { text: "Mais de 15", isCorrect: true, feedback: "Mapeado para recuperação e alta demanda transacional.", scores: { cart: 1 } }
      ]
    },
    {
      id: 2,
      question: "Qual seu volume mensal de vendas ou emissão de notas?",
      options: [
        { text: "Até 100", isCorrect: true, feedback: "Triagem para baixo volume de processamento.", scores: { faq: 1 } },
        { text: "101 a 500", isCorrect: true, feedback: "Qualificação comercial de médio volume.", scores: { sales: 1 } },
        { text: "501 a 1000", isCorrect: true, feedback: "Mapeado para notificações ativas de entrega.", scores: { info: 1 } },
        { text: "Mais de 1000", isCorrect: true, feedback: "Mapeado para recuperação avançada de checkout.", scores: { cart: 1 } }
      ]
    },
    {
      id: 3,
      question: "Por quais canais seus clientes mais chegam?",
      options: [
        { text: "WhatsApp", isCorrect: true, feedback: "Automatização ideal para chat do WhatsApp.", scores: { sales: 1 } },
        { text: "Instagram", isCorrect: true, feedback: "Automatização ideal para vendas em redes sociais.", scores: { sales: 1 } },
        { text: "E-mail", isCorrect: true, feedback: "Automatização para canais clássicos.", scores: { faq: 1 } },
        { text: "Chat no Site", isCorrect: true, feedback: "Mapeamento de FAQ direto no chat do site.", scores: { faq: 1 } },
        { text: "Telefone", isCorrect: true, feedback: "Auxílio de triagem e informação ativa.", scores: { info: 1 } }
      ]
    },
    {
      id: 4,
      question: "Como você lida com as dúvidas repetitivas e vendas hoje?",
      options: [
        { text: "100% Manual", isCorrect: true, feedback: "Necessidade crítica de automação de vendas e FAQ.", scores: { sales: 1 } },
        { text: "Uso algumas automações", isCorrect: true, feedback: "Ideal para otimização de carrinhos abandonados.", scores: { cart: 1 } },
        { text: "Já sou automatizado", isCorrect: true, feedback: "Mapeado para envio proativo de status pós-compra.", scores: { info: 1 } }
      ]
    },
    {
      id: 5,
      question: "Qual o seu principal desafio para este semestre?",
      options: [
        { text: "Recuperar vendas perdidas", isCorrect: true, feedback: "Mapeado para recuperação de carrinho abandonado.", scores: { cart: 2 } },
        { text: "Escalar sem contratar mais gente", isCorrect: true, feedback: "Mapeado para agente de automação de vendas.", scores: { sales: 2 } },
        { text: "Reduzir tempo de resposta", isCorrect: true, feedback: "Mapeado para FAQ e atendimento automatizado.", scores: { faq: 2 } },
        { text: "Organizar a bagunça dos canais", isCorrect: true, feedback: "Mapeado para envio proativo de notificações.", scores: { info: 2 } }
      ]
    }
  ] as QuizQuestion[],

  rewards: {
    high_score: {
      title: "Mestre da Eficiência Operacional",
      brinde: "Kit Premium Octadesk (Garrafa Inox + Caderno Executive)",
      badgeColor: "#2C3647"
    },
    participation: {
      title: "Explorador do Ecossistema",
      brinde: "Brinde Oficial Fórum 2026 (PopSocket + Stickers Exclusivos)",
      badgeColor: "#4A5A70"
    }
  }
};
