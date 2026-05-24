import Dexie, { type Table } from "dexie";
import { TamanhoOperacao, TrilhaResultado } from "../types/diagnostico";

export interface Lead {
  id?: number;
  nome: string;
  empresa?: string;
  atuacao?: string;
  email: string;
  contato?: string;
  tamanhoOperacao: TamanhoOperacao;
  totalFerramentas: 'Apenas 1 (Centralizada)' | 'De 2 a 4 ferramentas' | 'De 5 a 10 ferramentas' | 'Mais de 10 ferramentas (Ecossistema complexo)';
  possuiCarrinhoAbandonado: boolean;
  possuiIaVendas: boolean;
  possuiNotificacaoStatus: boolean;
  possuiIaDuvidasStatus: boolean;
  possuiEmissaoNotas: boolean;
  possuiHelpdeskSla: boolean;
  capturado_via?: string;
  perfil_bifurcado?: TrilhaResultado;
  sincronizado: number;
  criado_em: string;
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
