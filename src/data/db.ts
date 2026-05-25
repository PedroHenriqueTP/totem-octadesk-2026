import Dexie, { type Table } from "dexie";
import { TamanhoOperacao, TrilhaResultado, ToolScores } from "../types/diagnostico";

export interface Lead {
  id?: number;
  nome: string;
  empresa?: string;
  email: string;
  contato?: string;
  tamanhoOperacao: string; // Guarda a seleção de equipe do Passo 2 (ex: "Mais de 15")
  volumeVendasMes: string; // Guarda a seleção de volume/notas do Passo 2 (ex: "Mais de 1000/mês")
  canais: string[];        // Canais selecionados no Passo 2
  transbordo_urgente: boolean; // Flag silenciosa de transbordo urgente para equipes grandes
  score_quiz: number;      // Quantidade de acertos (0 a 5) no Quiz
  capturado_via?: string;
  perfil_bifurcado?: TrilhaResultado;
  sincronizado: number;
  criado_em: string;
  
  // Propriedades do DeepDive de Tablet
  toolScores?: ToolScores;
  prioridade_ferramenta?: string;
  tempo_jornada_segundos?: number;
  isPotentialLead?: boolean;
  
  // Propriedades antigas mantidas como opcionais para compatibilidade
  totalFerramentas?: 'Apenas 1 (Centralizada)' | 'De 2 a 4 ferramentas' | 'De 5 a 10 ferramentas' | 'Mais de 10 ferramentas (Ecossistema complexo)';
  possuiCarrinhoAbandonado?: boolean;
  possuiIaVendas?: boolean;
  possuiNotificacaoStatus?: boolean;
  possuiIaDuvidasStatus?: boolean;
  possuiEmissaoNotas?: boolean;
  possuiHelpdeskSla?: boolean;
  atuacao?: string;
}

export class OctadeskEventDatabase extends Dexie {
  leads!: Table<Lead>;

  constructor() {
    super("OctadeskEventDatabase");
    this.version(1).stores({
      leads: "++id, email, perfil_bifurcado, sincronizado, criado_em",
    });
  }
}

export const db = new OctadeskEventDatabase();
