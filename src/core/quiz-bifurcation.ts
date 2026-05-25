export interface LeadData {
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  tamanhoOperacao: string;
  volumeVendasMes: string;
  canais: string[];
  transbordoUrgente: boolean;
  scoreQuiz: number;
}

export type DestinoLead = 
  | 'TRANSBORDO_COMERCIAL_URGENTE' 
  | 'TRILHA_AUTOMACAO_ECOMMERCE' 
  | 'TRILHA_GESTAO_WHATSAPP' 
  | 'TRIAGEM_PADRAO';

export interface DiagnosticoResultado {
  destino: DestinoLead;
  focoProduto: string;
  mensagemInterface: string;
  brindeQualificado: boolean;
}
