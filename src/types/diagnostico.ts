export type TamanhoOperacao = 'Ate 5 colaboradores' | 'De 6 a 20 colaboradores' | 'De 21 a 100 colaboradores' | 'Mais de 100 colaboradores';

export interface RespostasQuiz {
  tamanhoOperacao: TamanhoOperacao;
  totalFerramentas: 'Apenas 1 (Centralizada)' | 'De 2 a 4 ferramentas' | 'De 5 a 10 ferramentas' | 'Mais de 10 ferramentas (Ecossistema complexo)';
  possuiCarrinhoAbandonado: boolean;
  possuiIaVendas: boolean;
  possuiNotificacaoStatus: boolean;
  possuiIaDuvidasStatus: boolean;
  possuiEmissaoNotas: boolean;
  possuiHelpdeskSla: boolean;
}

export type TrilhaResultado = 'Automacao' | 'Atendimento' | 'Controle' | 'Enterprise';

export type DorPrincipal = 'Captação' | 'Atendimento de Vendas' | 'Notificações' | 'Pós-venda' | 'Helpdesk';
export type PorteEquipe = 'Ate 1 colaborador' | 'De 2 a 5 colaboradores' | 'De 6 a 15 colaboradores' | 'Mais de 15 colaboradores';
export type VolumeAtendimento = 'Até 100/mês' | 'De 101 a 1000/mês' | 'Mais de 1000/mês';
export type PlataformaEcommerce = 'Shopify / WooCommerce / Tray / Nuvemshop' | 'Plataforma própria' | 'Marketplaces fechados ou sem loja';

export interface ToolScores {
  faq: number;
  sales: number;
  info: number;
  cart: number;
}

export type ToolPrioridade = 'faq' | 'sales' | 'info' | 'cart';
