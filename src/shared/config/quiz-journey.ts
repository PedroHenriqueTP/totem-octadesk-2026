export type JornadaVersao = 'CONSULTIVA' | 'ARCADE_COMPLETO' | 'FAST_TRACK';

export const VERSAO_ATIVA: JornadaVersao = 'ARCADE_COMPLETO';

export interface QuizQuestionOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
  value: string; // Valor interno para salvar no banco/HubSpot
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizQuestionOption[];
}

// Configuração das Etapas da Parede
export interface EtapaParedeConfig {
  numero: number;
  nome: string;
  dor: string;
  iconName: string;
  description: string;
  iconSvg: string; // SVG inline para garantir renderização de qualidade 3D/minimalista
  imagePath: string; // Caminho para a imagem 3D premium gerada
}

export const ETAPAS_PAREDE: Record<string, EtapaParedeConfig> = {
  captacao: {
    numero: 1,
    nome: "Captação",
    dor: "Quero alcançar mais clientes...",
    iconName: "Megafone",
    description: "Atraia e engaje novos leads com campanhas integradas e automações de disparo.",
    iconSvg: "",
    imagePath: "/assets/etapa_captacao.png"
  },
  vendas: {
    numero: 2,
    nome: "Atendimento de Vendas",
    dor: "Perco vendas porque meu time demora para responder...",
    iconName: "Headset Vendas",
    description: "Agilize o primeiro contato com chatbots inteligentes e distribua leads instantaneamente.",
    iconSvg: "",
    imagePath: "/assets/etapa_vendas.png"
  },
  notificacoes: {
    numero: 3,
    nome: "Notificações",
    dor: "Meu time passa o dia respondendo 'onde está meu pedido'...",
    iconName: "Sino",
    description: "Notifique seus clientes automaticamente sobre atualizações de status de pedidos no WhatsApp.",
    iconSvg: "",
    imagePath: "/assets/etapa_notificacoes.png"
  },
  posvenda: {
    numero: 4,
    nome: "Pós-venda",
    dor: "Tenho muita troca, devolução e reclamação...",
    iconName: "Caixa",
    description: "Automatize solicitações de troca e devolução e resolva reclamações com rapidez e controle.",
    iconSvg: "",
    imagePath: "/assets/etapa_posvenda.png"
  },
  helpdesk: {
    numero: 5,
    nome: "Helpdesk",
    dor: "Meu atendimento não tem organização, SLA nem métricas...",
    iconName: "Headset Suporte",
    description: "Centralize tickets de suporte, defina acordos de SLA e meça a performance com relatórios em tempo real.",
    iconSvg: "",
    imagePath: "/assets/etapa_helpdesk.png"
  }
};

export const quizJourneyConfig = {
  questions: [
    {
      id: 1,
      question: "Qual situação mais acontece na sua operação hoje?",
      options: [
        { 
          text: "Quero alcançar mais clientes – faço pouca captação ativa pelo WhatsApp ou redes sociais.", 
          isCorrect: true, 
          feedback: "",
          value: "captacao"
        },
        { 
          text: "Perco vendas porque meu time demora para responder quem chega pelo WhatsApp ou Instagram.", 
          isCorrect: true, 
          feedback: "",
          value: "vendas"
        },
        { 
          text: "Meu time passa o dia respondendo 'onde está meu pedido' ou recuperando carrinho abandonado.", 
          isCorrect: true, 
          feedback: "",
          value: "notificacoes"
        },
        { 
          text: "Tenho muita troca, devolução e reclamação pós-compra que o time não consegue gerenciar bem.", 
          isCorrect: true, 
          feedback: "",
          value: "posvenda"
        },
        { 
          text: "Meu atendimento não tem organização, SLA nem métricas. Não sei o que está acontecendo.", 
          isCorrect: true, 
          feedback: "",
          value: "helpdesk"
        }
      ]
    },
    {
      id: 2,
      question: "Quantos colaboradores sua empresa tem hoje?",
      options: [
        { 
          text: "Menos de 50", 
          isCorrect: true, 
          feedback: "",
          value: "Menos de 50"
        },
        { 
          text: "Entre 50 e 200", 
          isCorrect: true, 
          feedback: "",
          value: "Entre 50 e 200"
        },
        { 
          text: "Entre 200 a 500", 
          isCorrect: true, 
          feedback: "",
          value: "Entre 200 a 500"
        },
        { 
          text: "Mais de 500", 
          isCorrect: true, 
          feedback: "",
          value: "Mais de 500"
        }
      ]
    },
    {
      id: 3,
      question: "Quantos atendimentos seu time recebe por dia?",
      options: [
        { 
          text: "Menos de 50", 
          isCorrect: true, 
          feedback: "",
          value: "Menos de 50"
        },
        { 
          text: "Entre 50 e 200", 
          isCorrect: true, 
          feedback: "",
          value: "Entre 50 e 200"
        },
        { 
          text: "Mais de 200", 
          isCorrect: true, 
          feedback: "",
          value: "Mais de 200"
        },
        { 
          text: "Não sei / não acompanho esse número", 
          isCorrect: true, 
          feedback: "",
          value: "Não sei / não acompanho esse número"
        }
      ]
    },
    {
      id: 4,
      question: "Em que plataforma sua loja vende?",
      options: [
        { 
          text: "Shopify", 
          isCorrect: true, 
          feedback: "",
          value: "Shopify"
        },
        { 
          text: "Tray, VTEX, Nuvemshop ou outra plataforma com site próprio", 
          isCorrect: true, 
          feedback: "",
          value: "Tray, VTEX, Nuvemshop ou outra plataforma com site próprio"
        },
        { 
          text: "Principalmente marketplaces (ML, Shopee, Magalu)", 
          isCorrect: true, 
          feedback: "",
          value: "Principalmente marketplaces (ML, Shopee, Magalu)"
        },
        { 
          text: "Ainda não tenho loja online", 
          isCorrect: true, 
          feedback: "",
          value: "Ainda não tenho loja online"
        }
      ]
    }
  ] as QuizQuestion[]
};
