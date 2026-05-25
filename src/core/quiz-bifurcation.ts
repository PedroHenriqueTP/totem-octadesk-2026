import { ToolScores } from "../types/diagnostico";

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
  toolScores?: ToolScores;
  prioridadeFerramenta?: string;
  tempoJornadaSegundos?: number;
  isPotentialLead?: boolean;
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
  toolScores?: ToolScores;
  prioridadeFerramenta?: string;
}
