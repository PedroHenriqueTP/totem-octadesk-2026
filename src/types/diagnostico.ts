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

export interface ToolScores {
  faq: number;
  sales: number;
  info: number;
  cart: number;
}

export type ToolPrioridade = 'faq' | 'sales' | 'info' | 'cart';
