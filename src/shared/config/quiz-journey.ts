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
}

export const ETAPAS_PAREDE: Record<string, EtapaParedeConfig> = {
  captacao: {
    numero: 1,
    nome: "Captação",
    dor: "Quero alcançar mais clientes...",
    iconName: "Megafone",
    description: "Atraia e engaje novos leads com campanhas integradas e automações de disparo.",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-24 h-24"><defs><filter id="shadow-3d-1" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#1F2538" flood-opacity="0.15" /></filter><linearGradient id="body-grad-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5E8BFF" /><stop offset="50%" stop-color="#2D62FF" /><stop offset="100%" stop-color="#1A4ED9" /></linearGradient><linearGradient id="horn-grad-1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FFFFFF" /><stop offset="70%" stop-color="#E2E8F0" /><stop offset="100%" stop-color="#CBD5E1" /></linearGradient><linearGradient id="accent-grad-1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2D62FF" /><stop offset="100%" stop-color="#001B3D" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#body-grad-1)" opacity="0.05" /><path d="M68 32 A25 25 0 0 1 68 68" stroke="#93C5FD" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6" /><path d="M76 24 A35 35 0 0 1 76 76" stroke="#2D62FF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.4" /><path d="M84 16 A45 45 0 0 1 84 84" stroke="#2D62FF" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.2" /><g filter="url(#shadow-3d-1)"><rect x="36" y="52" width="12" height="24" rx="6" transform="rotate(-15 36 52)" fill="url(#accent-grad-1)" /><path d="M26 38 C26 32 30 30 30 38 L30 58 C30 66 26 64 26 58 Z" fill="url(#accent-grad-1)" /><path d="M30 38 L58 26 C62 25 64 27 64 30 L64 66 C64 69 62 71 58 70 L30 58 Z" fill="url(#body-grad-1)" /><ellipse cx="64" cy="48" rx="5" ry="20" fill="url(#horn-grad-1)" /><ellipse cx="64" cy="48" rx="2" ry="14" fill="#1F2538" /></g></svg>`
  },
  vendas: {
    numero: 2,
    nome: "Atendimento de Vendas",
    dor: "Perco vendas porque meu time demora para responder...",
    iconName: "Headset Vendas",
    description: "Agilize o primeiro contato com chatbots inteligentes e distribua leads instantaneamente.",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-24 h-24"><defs><filter id="shadow-3d-2" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#1F2538" flood-opacity="0.15" /></filter><linearGradient id="blue-grad-2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5E8BFF" /><stop offset="100%" stop-color="#2D62FF" /></linearGradient><linearGradient id="dark-grad-2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2D354D" /><stop offset="100%" stop-color="#1F2538" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#blue-grad-2)" opacity="0.05" /><g filter="url(#shadow-3d-2)"><path d="M26 48 A26 26 0 0 1 74 48" stroke="url(#dark-grad-2)" stroke-width="6" stroke-linecap="round" fill="none" /><path d="M28 48 A24 24 0 0 1 72 48" stroke="#5E8BFF" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6" /><rect x="20" y="42" width="12" height="22" rx="6" fill="url(#blue-grad-2)" /><rect x="23" y="45" width="6" height="16" rx="3" fill="#FFFFFF" opacity="0.2" /><rect x="18" y="46" width="3" height="14" rx="1.5" fill="url(#dark-grad-2)" /><rect x="68" y="42" width="12" height="22" rx="6" fill="url(#blue-grad-2)" /><rect x="71" y="45" width="6" height="16" rx="3" fill="#FFFFFF" opacity="0.2" /><rect x="79" y="46" width="3" height="14" rx="1.5" fill="url(#dark-grad-2)" /><path d="M30 60 Q34 76 46 76" stroke="url(#dark-grad-2)" stroke-width="3" stroke-linecap="round" fill="none" /><circle cx="48" cy="76" r="4.5" fill="url(#blue-grad-2)" /><path d="M64 62 Q72 58 76 68 Q76 74 68 74 L64 78 L65 72 Z" fill="#cef5ca" stroke="#114e0b" stroke-width="1.5" /><circle cx="68" cy="68" r="1.5" fill="#114e0b" /><circle cx="72" cy="68" r="1.5" fill="#114e0b" /></g></svg>`
  },
  notificacoes: {
    numero: 3,
    nome: "Notificações",
    dor: "Meu time passa o dia respondendo 'onde está meu pedido'...",
    iconName: "Sino",
    description: "Notifique seus clientes automaticamente sobre atualizações de status de pedidos no WhatsApp.",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-24 h-24"><defs><filter id="shadow-3d-3" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#1F2538" flood-opacity="0.15" /></filter><linearGradient id="gold-grad-3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFD700" /><stop offset="60%" stop-color="#F59E0B" /><stop offset="100%" stop-color="#D97706" /></linearGradient><linearGradient id="blue-grad-3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5E8BFF" /><stop offset="100%" stop-color="#2D62FF" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#blue-grad-3)" opacity="0.05" /><g filter="url(#shadow-3d-3)"><circle cx="50" cy="22" r="6" stroke="url(#gold-grad-3)" stroke-width="4.5" fill="none" /><circle cx="50" cy="74" r="8" fill="url(#blue-grad-3)" /><path d="M50 26 C38 26 34 38 34 52 L30 68 C29 70 31 72 34 72 L66 72 C69 72 71 70 70 68 L66 52 C66 38 62 26 50 26 Z" fill="url(#gold-grad-3)" /><path d="M30 68 C30 68 40 71 50 71 C60 71 70 68 70 68" stroke="#FFF" stroke-width="1.5" fill="none" opacity="0.2" /><circle cx="68" cy="62" r="12" fill="url(#blue-grad-3)" stroke="#FFFFFF" stroke-width="2.5" /><path d="M63 62 L66 65 L73 58" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" /></g></svg>`
  },
  posvenda: {
    numero: 4,
    nome: "Pós-venda",
    dor: "Tenho muita troca, devolução e reclamação...",
    iconName: "Caixa",
    description: "Automatize solicitações de troca e devolução e resolva reclamações com rapidez e controle.",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-24 h-24"><defs><filter id="shadow-3d-4" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#1F2538" flood-opacity="0.15" /></filter><linearGradient id="top-face-4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E2E8F0" /><stop offset="100%" stop-color="#CBD5E1" /></linearGradient><linearGradient id="left-face-4" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#A1BFFC" /><stop offset="100%" stop-color="#2D62FF" /></linearGradient><linearGradient id="right-face-4" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2D62FF" /><stop offset="100%" stop-color="#1A4ED9" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="#2D62FF" opacity="0.05" /><path d="M22 62 A34 34 0 0 1 78 38" stroke="#93C5FD" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.5" stroke-dasharray="4 4" /><path d="M78 38 L72 32 M78 38 L82 44" stroke="#93C5FD" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.5" /><g filter="url(#shadow-3d-4)"><path d="M50 48 L22 34 L22 64 L50 78 Z" fill="url(#left-face-4)" /><path d="M50 48 L78 34 L78 64 L50 78 Z" fill="url(#right-face-4)" /><path d="M50 18 L22 34 L50 48 L78 34 Z" fill="url(#top-face-4)" /><path d="M50 48 L36 41 L50 34 L64 41 Z" fill="#1F2538" opacity="0.15" /><path d="M22 34 L12 24 L40 38 Z" fill="#CBD5E1" /><path d="M78 34 L88 24 L60 38 Z" fill="#94A3B8" /><path d="M26 62 A22 22 0 0 0 74 62" stroke="#cef5ca" stroke-width="3.5" stroke-linecap="round" fill="none" /><path d="M74 62 L68 58 M74 62 L78 57" stroke="#cef5ca" stroke-width="3.5" stroke-linecap="round" fill="none" /></g></svg>`
  },
  helpdesk: {
    numero: 5,
    nome: "Helpdesk",
    dor: "Meu atendimento não tem organização, SLA nem métricas...",
    iconName: "Headset Suporte",
    description: "Centralize tickets de suporte, defina acordos de SLA e meça a performance com relatórios em tempo real.",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-24 h-24"><defs><filter id="shadow-3d-5" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#1F2538" flood-opacity="0.15" /></filter><linearGradient id="panel-grad-5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" /><stop offset="100%" stop-color="#E2E8F0" stop-opacity="0.9" /></linearGradient><linearGradient id="blue-grad-5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5E8BFF" /><stop offset="100%" stop-color="#2D62FF" /></linearGradient></defs><circle cx="50" cy="50" r="40" fill="url(#blue-grad-5)" opacity="0.05" /><g filter="url(#shadow-3d-5)"><rect x="22" y="24" width="46" height="38" rx="8" fill="url(#panel-grad-5)" stroke="#CBD5E1" stroke-width="1.5" transform="rotate(-6 22 24)" /><rect x="28" y="32" width="22" height="4" rx="2" fill="#2D62FF" opacity="0.8" transform="rotate(-6 28 32)" /><rect x="26" y="40" width="34" height="2" rx="1" fill="#94A3B8" transform="rotate(-6 26 40)" /><rect x="25" y="45" width="28" height="2" rx="1" fill="#94A3B8" transform="rotate(-6 25 45)" /><g transform="translate(64, 58)"><circle cx="0" cy="0" r="15" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="2" /><circle cx="0" cy="0" r="6" fill="#FFFFFF" /><path d="M -3 -18 L 3 -18 L 4 -14 L -4 -14 Z" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="1" /><path d="M -3 18 L 3 18 L 4 14 L -4 14 Z" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="1" /><path d="M 18 -3 L 18 3 L 14 4 L 14 -4 Z" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="1" /><path d="M -18 -3 L -18 3 L -14 4 L -14 -4 Z" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="1" /><path d="M 10 -13 L 15 -8 L 11 -5 L 7 -10 Z" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="1" /><path d="M -10 13 L -15 8 L -11 5 L -7 10 Z" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="1" /><path d="M 13 10 L 8 15 L 5 11 L 10 7 Z" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="1" /><path d="M -13 -10 L -8 -15 L -5 -11 L -10 -7 Z" fill="url(#blue-grad-5)" stroke="#FFFFFF" stroke-width="1" /></g></g></svg>`
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
