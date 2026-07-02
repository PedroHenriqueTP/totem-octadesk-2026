import React, { useState, useEffect } from 'react';
import { db, Lead } from "../../data/db";
import { HubSpotClient } from '../../infra/hubspot';

export interface AdminLeadMetrics {
  totalLeads: number;
  sincronizados: number;
  pendentesOffline: number;
  porEtapa: {
    captacao: number;
    vendas: number;
    notificacoes: number;
    posvenda: number;
    helpdesk: number;
  };
  porTrilha: {
    automacao: number;
    atendimento: number;
    controle: number;
    enterprise: number;
  };
  tempoMedioJornada: number; // em segundos
}

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [pin, setPin] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncCount, setSyncCount] = useState(0);
  
  const [metrics, setMetrics] = useState<AdminLeadMetrics>({
    totalLeads: 0,
    sincronizados: 0,
    pendentesOffline: 0,
    porEtapa: { captacao: 0, vendas: 0, notificacoes: 0, posvenda: 0, helpdesk: 0 },
    porTrilha: { automacao: 0, atendimento: 0, controle: 0, enterprise: 0 },
    tempoMedioJornada: 0
  });
  
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [heatMap, setHeatMap] = useState({ manha: 0, tarde: 0, noite: 0 });

  const carregarDados = async () => {
    const leads = await db.leads.toArray();
    const total = leads.length;
    const synced = leads.filter((l) => l.sincronizado === 1).length;
    const pending = total - synced;
    
    // Contagem por Etapa do Ecossistema (prioridade_ferramenta mapeia para o ID da dor)
    const captacao = leads.filter((l) => l.prioridade_ferramenta === "captacao").length;
    const vendas = leads.filter((l) => l.prioridade_ferramenta === "vendas").length;
    const notificacoes = leads.filter((l) => l.prioridade_ferramenta === "notificacoes").length;
    const posvenda = leads.filter((l) => l.prioridade_ferramenta === "posvenda").length;
    const helpdesk = leads.filter((l) => l.prioridade_ferramenta === "helpdesk").length;

    // Contagem por Trilha legado (compatibilidade)
    const automacao = leads.filter((l) => l.perfil_bifurcado === "Automacao").length;
    const atendimento = leads.filter((l) => l.perfil_bifurcado === "Atendimento").length;
    const controle = leads.filter((l) => l.perfil_bifurcado === "Controle").length;
    const enterprise = leads.filter((l) => l.perfil_bifurcado === "Enterprise").length;

    // Calcula tempo médio de jornada
    const leadsComTempo = leads.filter(l => l.tempo_jornada_segundos !== undefined && l.tempo_jornada_segundos > 0);
    const somaTempo = leadsComTempo.reduce((acc, curr) => acc + (curr.tempo_jornada_segundos || 0), 0);
    const tempoMedio = leadsComTempo.length > 0 ? Math.round(somaTempo / leadsComTempo.length) : 0;

    setMetrics({
      totalLeads: total,
      sincronizados: synced,
      pendentesOffline: pending,
      porEtapa: { captacao, vendas, notificacoes, posvenda, helpdesk },
      porTrilha: { automacao, atendimento, controle, enterprise },
      tempoMedioJornada: tempoMedio
    });

    let m = 0, t = 0, n = 0;
    leads.forEach((l) => {
      const hours = new Date(l.criado_em).getHours();
      if (hours >= 8 && hours < 12) m++;
      else if (hours >= 12 && hours < 18) t++;
      else if (hours >= 18 && hours < 22) n++;
    });
    setHeatMap({ manha: m, tarde: t, noite: n });

    const sortedLeads = [...leads]
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
      .slice(0, 8);
    setRecentLeads(sortedLeads);
  };

  const verificarPin = (valor: string) => {
    setPin(valor);
    if (valor === '2026') {
      setAutenticado(true);
    }
  };

  useEffect(() => {
    if (autenticado) {
      Promise.resolve().then(() => {
        carregarDados();
      });
    }
  }, [autenticado]);

  // Sincroniza em lote com o HubSpot
  const handleSync = async () => {
    try {
      setSyncState("syncing");
      const unsyncedLeads = await db.leads.where("sincronizado").equals(0).toArray();
      if (unsyncedLeads.length === 0) {
        setSyncState("success");
        setTimeout(() => setSyncState("idle"), 2000);
        return;
      }

      let successCount = 0;
      for (const lead of unsyncedLeads) {
        const leadData = {
          nome: lead.nome,
          email: lead.email,
          telefone: lead.contato || "",
          empresa: lead.empresa || "",
          cargo: lead.cargo || "",
          dorPrincipal: lead.dor_principal || "",
          tamanhoEmpresa: lead.tamanho_empresa || "",
          volumeAtendimentos: lead.volume_atendimentos || "",
          plataforma: lead.plataforma || "",
          etapaIndicada: lead.etapa_indicada || "",
          isDecisor: lead.is_decisor || false,
          prioridadeFerramenta: lead.prioridade_ferramenta || "",
          tempoJornadaSegundos: lead.tempo_jornada_segundos || 0,
          tamanhoOperacao: lead.tamanhoOperacao || "",
          volumeVendasMes: lead.volumeVendasMes || "",
          canais: lead.canais || [],
          transbordoUrgente: lead.transbordo_urgente || false,
          scoreQuiz: lead.score_quiz || 0
        };

        const synced = await HubSpotClient.enviarFormulario(leadData);
        if (synced) {
          await db.leads.where("id").equals(lead.id!).modify({ sincronizado: 1 });
          successCount++;
        }
      }

      setSyncCount(successCount);
      setSyncState("success");
      await carregarDados();
      setTimeout(() => {
        setSyncState("idle");
        setSyncCount(0);
      }, 3000);
    } catch (e) {
      console.error(e);
      setSyncState("error");
    }
  };

  // Exportação CSV otimizada para o Excel brasileiro (usa ponto e vírgula e UTF-8 BOM)
  const handleExportCSV = async () => {
    const allLeads = await db.leads.toArray();
    if (allLeads.length === 0) return;

    const headers = [
      "ID",
      "Nome",
      "Empresa",
      "Email",
      "WhatsApp/Contato",
      "Cargo",
      "Dor Principal (P1)",
      "Tamanho da Equipe (P2)",
      "Volume Mensal (P3)",
      "Plataforma (P4)",
      "Etapa Recomendada",
      "MQL Quente/Decisor",
      "Sincronizado HubSpot",
      "Data de Cadastro"
    ];

    const rows = allLeads.map((l) =>
      [
        l.id ?? "",
        l.nome ?? "",
        l.empresa ?? "",
        l.email ?? "",
        l.contato ?? "",
        l.cargo ?? "",
        l.dor_principal ?? "",
        l.tamanho_empresa ?? "",
        l.volume_atendimentos ?? "",
        l.plataforma ?? "",
        l.etapa_indicada ?? "",
        l.is_decisor ? "Sim" : "Não",
        l.sincronizado === 1 ? "Sim" : "Não",
        l.criado_em ?? ""
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(";")
    );

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_deepdive_ecommerce_2026_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHeatColor = (count: number, max: number) => {
    if (count === 0) return "bg-slate-50 border-slate-200 text-slate-400";
    const ratio = count / (max || 1);
    if (ratio < 0.35) return "bg-blue-50/50 border-blue-100/50 text-blue-900/60";
    if (ratio < 0.7) return "bg-blue-50 border-blue-100 text-blue-900 font-semibold";
    return "bg-blue-100 border-[#2D62FF]/30 text-blue-950 font-black shadow-sm";
  };

  const maxHeat = Math.max(heatMap.manha, heatMap.tarde, heatMap.noite, 1);

  if (!autenticado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] p-8 rounded-[24px] shadow-xl text-center">
          <h2 className="text-xl font-extrabold text-[#1F2538] mb-1">Acesso Administrativo</h2>
          <p className="text-slate-500 text-xs mb-6">Insira o PIN operacional do stand para visualizar métricas</p>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => verificarPin(e.target.value)}
            className="w-2/3 text-center py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-3xl font-mono text-[#1F2538] focus:outline-none focus:border-[#2D62FF] tracking-widest"
            placeholder="****"
            autoFocus
          />
          <button 
            onClick={onClose} 
            className="mt-6 text-xs text-slate-400 hover:text-slate-700 transition-colors uppercase font-bold tracking-wider block mx-auto cursor-pointer"
          >
            Voltar ao Tablet
          </button>
        </div>
      </div>
    );
  }

  const total = metrics.totalLeads || 1;
  const { captacao, vendas, notificacoes, posvenda, helpdesk } = metrics.porEtapa;

  const pctCap = Math.round((captacao / total) * 100);
  const pctVen = Math.round((vendas / total) * 100);
  const pctNot = Math.round((notificacoes / total) * 100);
  const pctPos = Math.round((posvenda / total) * 100);
  const pctHel = Math.round((helpdesk / total) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8FAFC] p-6 text-slate-800 pb-32 admin-panel-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800;900&display=swap');
        .admin-panel-root {
          font-family: 'Poppins', 'Inter', sans-serif;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#1F2538]">OCTADESK DEEPDIVE ADMIN PANEL</h1>
            <p className="text-slate-500 text-xs">Mapeamento de Qualificação & Sincronização HubSpot | Fórum 2026</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={handleSync}
              disabled={syncState === 'syncing' || metrics.pendentesOffline === 0}
              className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                metrics.pendentesOffline === 0
                  ? "bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed"
                  : "bg-[#2D62FF] hover:bg-[#1A4ED9] text-white shadow-md shadow-blue-100"
              }`}
            >
              {syncState === 'syncing' ? 'Sincronizando...' : 
               syncState === 'success' ? (syncCount > 0 ? `Sincronizados ${syncCount} leads!` : 'Já sincronizado!') : 
               syncState === 'error' ? 'Erro ao Sincronizar' : 'Sincronizar HubSpot'}
            </button>
          </div>
        </header>

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 p-4.5 rounded-[20px] shadow-sm">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Participantes</p>
            <h3 className="text-2xl font-black text-[#1F2538]">{metrics.totalLeads}</h3>
          </div>

          <div className="bg-white border border-slate-200 p-4.5 rounded-[20px] shadow-sm">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Tempo Médio</p>
            <h3 className="text-2xl font-black text-[#1F2538]">{metrics.tempoMedioJornada}s</h3>
          </div>

          <div className="bg-white border border-slate-200 p-4.5 rounded-[20px] shadow-sm">
            <p className="text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-0.5">No HubSpot</p>
            <h3 className="text-2xl font-black text-emerald-600">{metrics.sincronizados}</h3>
          </div>

          <div className={`border p-4.5 rounded-[20px] shadow-sm ${
            metrics.pendentesOffline > 0 ? "border-amber-200 bg-amber-50/20" : "bg-white border-slate-200"
          }`}>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Fila Offline</p>
            <h3 className={`text-2xl font-black ${metrics.pendentesOffline > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {metrics.pendentesOffline}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Distribuição por Etapas da Parede */}
          <div className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-[#1F2538] uppercase tracking-wider border-b border-slate-100 pb-2">Distribuição por Etapa da Parede</h3>
            
            <div className="space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="truncate">Etapa 1: Captação</span>
                  <span>{captacao} ({pctCap}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${pctCap}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="truncate">Etapa 2: Vendas</span>
                  <span>{vendas} ({pctVen}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D1A0]" style={{ width: `${pctVen}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="truncate">Etapa 3: Notificações</span>
                  <span>{notificacoes} ({pctNot}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${pctNot}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="truncate">Etapa 4: Pós-venda</span>
                  <span>{posvenda} ({pctPos}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${pctPos}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="truncate">Etapa 5: Helpdesk</span>
                  <span>{helpdesk} ({pctHel}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F2538]" style={{ width: `${pctHel}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Mapa de Calor Temporal */}
          <div className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-[#1F2538] uppercase tracking-wider border-b border-slate-100 pb-2">Mapa de Calor (Volumetria Diária)</h3>
            <div className="grid grid-cols-3 gap-3 h-[180px]">
              <div className={`border p-4.5 rounded-2xl flex flex-col justify-between transition-all duration-300 ${getHeatColor(heatMap.manha, maxHeat)}`}>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block">Manhã</span>
                  <span className="text-[9px] opacity-60">08h - 12h</span>
                </div>
                <h4 className="text-xl font-black">{heatMap.manha}</h4>
              </div>

              <div className={`border p-4.5 rounded-2xl flex flex-col justify-between transition-all duration-300 ${getHeatColor(heatMap.tarde, maxHeat)}`}>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block">Tarde</span>
                  <span className="text-[9px] opacity-60">12h - 18h</span>
                </div>
                <h4 className="text-xl font-black">{heatMap.tarde}</h4>
              </div>

              <div className={`border p-4.5 rounded-2xl flex flex-col justify-between transition-all duration-300 ${getHeatColor(heatMap.noite, maxHeat)}`}>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block">Noite</span>
                  <span className="text-[9px] opacity-60">18h - 22h</span>
                </div>
                <h4 className="text-xl font-black">{heatMap.noite}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Leads Recentes */}
        <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm mb-12">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-xs text-[#1F2538] uppercase tracking-wider">Leads Recentes em Cache</h3>
            <button 
              onClick={handleExportCSV}
              disabled={metrics.totalLeads === 0}
              className="text-[9px] font-extrabold uppercase tracking-wider border border-[#1F2538]/30 px-3 py-1.5 rounded-lg transition-all hover:bg-slate-100 cursor-pointer bg-white"
            >
              Exportar para Excel (.csv)
            </button>
          </div>
          
          <div className="p-4 space-y-3">
            {recentLeads.map((lead) => (
              <div 
                key={lead.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                  lead.is_decisor 
                    ? "border-rose-200 bg-rose-50/10 shadow-sm" 
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-[#1F2538] text-sm">{lead.nome}</h4>
                    {lead.is_decisor && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[8px] font-black uppercase tracking-wider animate-pulse">
                        🔥 Decisor
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5">{lead.empresa} ({lead.cargo})</p>
                </div>

                <div className="flex-1 space-y-0.5 text-slate-500">
                  <div className="font-mono font-semibold text-slate-700">{lead.contato}</div>
                  <div className="text-[10px]">{lead.email}</div>
                </div>

                <div className="flex-shrink-0 min-w-[120px]">
                  <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider">Trilha Mapeada</span>
                  <span className="font-black text-[#2D62FF] text-[10px] uppercase truncate block max-w-[150px]">
                    {lead.etapa_indicada || lead.perfil_bifurcado}
                  </span>
                </div>

                <div className="flex-shrink-0 flex items-center">
                  {lead.sincronizado === 1 ? (
                    <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[9px] border border-emerald-100">
                      ✓ HubSpot
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-extrabold text-[9px] border border-amber-100">
                      ○ Offline
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {recentLeads.length === 0 && (
              <div className="p-8 text-center text-slate-400 font-mono border border-dashed border-slate-200 rounded-xl text-xs">
                [Nenhum participante em cache no IndexedDB]
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] p-4 z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={onClose}
            className="w-full py-4 text-xs md:text-sm font-black rounded-xl tracking-wider uppercase bg-[#1F2538] hover:bg-[#2C3647] text-white shadow-md transition-all cursor-pointer block text-center"
          >
            Voltar ao Tablet
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
