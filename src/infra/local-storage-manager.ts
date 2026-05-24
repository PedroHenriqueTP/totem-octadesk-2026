import { LeadData, DiagnosticoResultado } from '../core/quiz-bifurcation';

export interface LeadRegistrado {
  id: string;
  timestamp: string;
  dados: LeadData;
  diagnostico: DiagnosticoResultado;
  sincronizado: boolean;
}

const STORAGE_KEY = '@octadesk-hub:leads-offline';

export const LocalStorageManager = {
  // Salva o lead localmente (Garante persistência mesmo sem internet)
  salvarLeadLocal(dados: LeadData, diagnostico: DiagnosticoResultado): LeadRegistrado {
    const novoLead: LeadRegistrado = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      dados,
      diagnostico,
      sincronizado: false
    };

    const leadsAtuais = this.obterLeadsLocais();
    leadsAtuais.push(novoLead);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsAtuais));
    
    return novoLead;
  },

  obterLeadsLocais(): LeadRegistrado[] {
    if (typeof window === 'undefined') return [];
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  },

  // Marca como sincronizado após o upload com sucesso para o banco/Prisma
  marcarComoSincronizado(id: string): void {
    const leads = this.obterLeadsLocais();
    const leadsAtualizados = leads.map(lead => 
      lead.id === id ? { ...lead, sincronizado: true } : lead
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsAtualizados));
  },

  obterFilaPendente(): LeadRegistrado[] {
    return this.obterLeadsLocais().filter(lead => !lead.sincronizado);
  }
};
