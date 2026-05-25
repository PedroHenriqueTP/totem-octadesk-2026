export type JornadaVersao = 'CONSULTIVA' | 'ARCADE_COMPLETO' | 'FAST_TRACK';

export const VERSAO_ATIVA: JornadaVersao = 'ARCADE_COMPLETO';

export interface QuizQuestionOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizQuestionOption[];
}

export const quizJourneyConfig = {
  // Banco de Questões Interativas (Metodologia de Desafio Gamificado)
  questions: [
    {
      id: 1,
      question: "Sua Operação está recebendo muitos requests e o time de Atendimento não está dando conta da Demanda. O que você faz?",
      options: [
        { text: "Contrato mais atendentes imediatamente para apagar o incêndio.", isCorrect: false, feedback: "Contratar em massa eleva o custo e o tempo de treinamento é lento." },
        { text: "Forço a equipe a fazer hora extra para zerar a fila.", isCorrect: false, feedback: "Gera sobrecarga, turnover alto e queda na qualidade do suporte." },
        { text: "Limito o atendimento e deixo os clientes esperando.", isCorrect: false, feedback: "Isso aumenta a taxa de abandono e queima a imagem da marca." },
        { text: "Implemento robôs/IA para triar e resolver demandas simples.", isCorrect: true, feedback: "Correto! A inteligência artificial escala sua operação sem inflar o custo da folha de pagamento." }
      ]
    },
    {
      id: 2,
      question: "O seu cliente inicia o contacto pelo WhatsApp, depois envia um e-mail e, por fim, tenta o chat do site. A sua equipa perde-se em três ferramentas diferentes e envia respostas duplicadas. O que faz?",
      options: [
        { text: "Exijo que a equipe olhe as três telas ao mesmo tempo.", isCorrect: false, feedback: "Isso gera erro humano, respostas duplicadas e lentidão absurda." },
        { text: "Desligo os outros canais e forço todos a usarem só e-mail.", isCorrect: false, feedback: "Limitar o cliente reduz as chances de conversão. O cliente moderno é omnichannel." },
        { text: "Centralizo todos os canais em uma única plataforma.", isCorrect: true, feedback: "Exato! Com a Octadesk, o time usa uma única tela para WhatsApp, Instagram, E-mail e Chat." },
        { text: "Crio uma planilha para registrar de qual canal o cliente veio.", isCorrect: false, feedback: "Gestão manual gera atrasos e os dados ficam obsoletos rapidamente." }
      ]
    },
    {
      id: 3,
      question: "O gestor da operação precisa de saber qual é o tempo médio de primeira resposta (SLA) da equipa para apresentar relatórios à diretoria, mas os dados estão espalhados em folhas de cálculo manuais. O que faz?",
      options: [
        { text: "Peço para cada atendente cronometrar suas próprias conversas.", isCorrect: false, feedback: "Impossível de auditar, gerando dados não confiáveis e perda de produtividade." },
        { text: "Consolido os dados do Excel manualmente toda sexta-feira.", isCorrect: false, feedback: "Processo extremamente braçal e suscetível a erros, atrasando a tomada de decisão." },
        { text: "Utilizo painéis de dashboard e métricas gerados em tempo real.", isCorrect: true, feedback: "Perfeito! A visão de BI e relatórios automatizados são vitais para gerenciar a saúde da operação." },
        { text: "Aviso à diretoria que é impossível calcular o SLA com precisão.", isCorrect: false, feedback: "Isso demonstra falta de controle operacional e gera insegurança corporativa." }
      ]
    },
    {
      id: 4,
      question: "Durante a madrugada, a sua empresa continua a receber solicitações de suporte, mas não há agentes disponíveis, gerando insatisfação nos clientes logo no início da manhã. O que faz?",
      options: [
        { text: "Contrato uma equipe de plantão 24/7 de madrugada.", isCorrect: false, feedback: "Custo altíssimo de adicional noturno que não compensa o volume de atendimentos na madrugada." },
        { text: "Deixo uma mensagem dizendo que o atendimento só funciona em horário comercial.", isCorrect: false, feedback: "O cliente desiste da compra ao não ter uma resposta imediata na jornada dele." },
        { text: "Ignoro e o time do turno da manhã que se vire com a fila.", isCorrect: false, feedback: "A equipe da manhã já chega sobrecarregada, e o SLA das primeiras horas vai pro espaço." },
        { text: "Aciono um bot de IA para dar suporte e até fechar vendas enquanto a equipe dorme.", isCorrect: true, feedback: "Excelente! O Bot da Octadesk mantém o motor de vendas e suporte ativo 24 horas por dia." }
      ]
    },
    {
      id: 5,
      question: "A sua equipa de atendimento gasta metade do dia a responder exatamente à mesma pergunta: \"Qual é o prazo de entrega?\". Isso atrasa os casos mais complexos. O que faz?",
      options: [
        { text: "Crio atalhos de teclado com a resposta pronta para eles colarem.", isCorrect: false, feedback: "Mesmo colando, o agente precisa parar e ler a mensagem, o que toma tempo humano valioso." },
        { text: "Escondo a política de frete no site para ver se eles procuram mais.", isCorrect: false, feedback: "Gerar atrito intencional destrói a experiência de navegação do usuário." },
        { text: "Automatizo um fluxo de FAQ no WhatsApp para dúvidas frequentes.", isCorrect: true, feedback: "Na mosca! Automatizar respostas recorrentes tira o peso da operação e foca o humano apenas no que é complexo." },
        { text: "Mando o cliente ler o site toda vez que perguntar.", isCorrect: false, feedback: "Péssima postura consultiva. Você perde oportunidades de up-sell ao ser ríspido." }
      ]
    }
  ] as QuizQuestion[],

  // Regra de Negócio para Distribuição de Brindes e Transbordo
  rewards: {
    high_score: {
      title: "Mestre da Eficiência Operacional",
      brinde: "Kit Premium Octadesk (Garrafa Inox + Caderno Executive)",
      badgeColor: "#00E5FF"
    },
    participation: {
      title: "Explorador do Ecossistema",
      brinde: "Brinde Oficial Fórum 2026 (PopSocket + Stickers Exclusivos)",
      badgeColor: "#00DA70"
    }
  }
};
