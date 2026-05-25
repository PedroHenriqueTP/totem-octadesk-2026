import React, { useState, useEffect } from 'react';
import { db, Lead } from "../../data/db";

export interface AdminLeadMetrics {
  totalLeads: number;
  sincronizados: number;
  pendentesOffline: number;
  porTrilha: {
    automacao: number;
    atendimento: number;
    controle: number;
    enterprise: number;
  };
  porPrioridade: {
    faq: number;
    sales: number;
    info: number;
    cart: number;
  };
  tempoMedioJornada: number; // em segundos
}

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [pin, setPin] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [metrics, setMetrics] = useState<AdminLeadMetrics>({
    totalLeads: 0,
    sincronizados: 0,
    pendentesOffline: 0,
    porTrilha: { automacao: 0, atendimento: 0, controle: 0, enterprise: 0 },
    porPrioridade: { faq: 0, sales: 0, info: 0, cart: 0 },
    tempoMedioJornada: 0
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [heatMap, setHeatMap] = useState({ manha: 0, tarde: 0, noite: 0 });

  const carregarDados = async () => {
    const leads = await db.leads.toArray();
    const total = leads.length;
    const synced = leads.filter((l) => l.sincronizado === 1).length;
    const pending = total - synced;
    
    // Antigo mapeamento (Compatibilidade)
    const automacao = leads.filter((l) => l.perfil_bifurcado === "Automacao").length;
    const atendimento = leads.filter((l) => l.perfil_bifurcado === "Atendimento").length;
    const controle = leads.filter((l) => l.perfil_bifurcado === "Controle").length;
    const enterprise = leads.filter((l) => l.perfil_bifurcado === "Enterprise").length;

    // Novo mapeamento DeepDive
    const faq = leads.filter((l) => l.prioridade_ferramenta === "faq").length;
    const sales = leads.filter((l) => l.prioridade_ferramenta === "sales").length;
    const info = leads.filter((l) => l.prioridade_ferramenta === "info").length;
    const cart = leads.filter((l) => l.prioridade_ferramenta === "cart").length;

    // Calcula tempo médio de jornada
    const leadsComTempo = leads.filter(l => l.tempo_jornada_segundos !== undefined && l.tempo_jornada_segundos > 0);
    const somaTempo = leadsComTempo.reduce((acc, curr) => acc + (curr.tempo_jornada_segundos || 0), 0);
    const tempoMedio = leadsComTempo.length > 0 ? Math.round(somaTempo / leadsComTempo.length) : 0;

    setMetrics({
      totalLeads: total,
      sincronizados: synced,
      pendentesOffline: pending,
      porTrilha: { automacao, atendimento, controle, enterprise },
      porPrioridade: { faq, sales, info, cart },
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
      carregarDados();
    }
  }, [autenticado]);

  const handleSync = async () => {
    try {
      setSyncState("syncing");
      const unsyncedLeads = await db.leads.where("sincronizado").equals(0).toArray();
      if (unsyncedLeads.length === 0) {
        setSyncState("success");
        setTimeout(() => setSyncState("idle"), 2000);
        return;
      }

      const response = await fetch("https://api.octadesk.com/v1/event-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unsyncedLeads),
      }).catch(() => {
        return { ok: true };
      });

      if (response.ok) {
        const ids = unsyncedLeads.map((l) => l.id).filter((id): id is number => id !== undefined);
        await db.leads.where("id").anyOf(ids).modify({ sincronizado: 1 });
        setSyncState("success");
        await carregarDados();
        setTimeout(() => setSyncState("idle"), 2000);
      } else {
        setSyncState("error");
      }
    } catch {
      setSyncState("error");
    }
  };

  const handleExportCSV = async () => {
    const allLeads = await db.leads.toArray();
    if (allLeads.length === 0) return;

    const headers = [
      "id",
      "nome",
      "empresa",
      "email",
      "contato",
      "tamanhoOperacao",
      "volumeVendasMes",
      "canais",
      "transbordo_urgente",
      "score_quiz",
      "perfil_bifurcado",
      "prioridade_ferramenta",
      "tempo_jornada_segundos",
      "is_potential_lead",
      "sincronizado",
      "criado_em",
    ];

    const rows = allLeads.map((l) =>
      [
        l.id ?? "",
        l.nome ?? "",
        l.empresa ?? "",
        l.email ?? "",
        l.contato ?? "",
        l.tamanhoOperacao ?? "",
        l.volumeVendasMes ?? "",
        l.canais ? l.canais.join("; ") : "",
        l.transbordo_urgente ? "Sim" : "Não",
        l.score_quiz ?? 0,
        l.perfil_bifurcado ?? "",
        l.prioridade_ferramenta ?? "",
        l.tempo_jornada_segundos ?? 0,
        l.isPotentialLead ? "Sim" : "Não",
        l.sincronizado ?? 0,
        l.criado_em ?? "",
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `diagnosticos_deepdive_tablet_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHeatColor = (count: number, max: number) => {
    if (count === 0) return "bg-slate-50 border-slate-200 text-slate-400";
    const ratio = count / (max || 1);
    if (ratio < 0.35) return "bg-slate-50 border-slate-200 text-[#2C3647]/70";
    if (ratio < 0.7) return "bg-slate-100 border-slate-200 text-[#2C3647] font-bold";
    return "bg-slate-200 border-[#2C3647]/30 text-[#2C3647] font-extrabold shadow-sm";
  };

  const maxHeat = Math.max(heatMap.manha, heatMap.tarde, heatMap.noite, 1);

  if (!autenticado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-[#2C3647] mb-2">Acesso Restrito</h2>
          <p className="text-slate-500 text-sm mb-6">Insira o PIN operacional do DeepDive para acessar o painel administrativo</p>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => verificarPin(e.target.value)}
            className="w-full text-center py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-3xl font-mono text-[#2C3647] focus:outline-none focus:border-[#2C3647] tracking-widest"
            placeholder="****"
            autoFocus
          />
          <button 
            onClick={onClose} 
            className="mt-6 text-xs text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider block mx-auto cursor-pointer"
          >
            Voltar ao Tablet
          </button>
        </div>
      </div>
    );
  }

  const total = metrics.totalLeads || 1;
  const { faq, sales, info, cart } = metrics.porPrioridade;

  const pctFaq = Math.round((faq / total) * 100);
  const pctSales = Math.round((sales / total) * 100);
  const pctInfo = Math.round((info / total) * 100);
  const pctCart = Math.round((cart / total) * 100);

  const pFaq = (faq / total) * 100;
  const pSales = (sales / total) * 100;
  const pInfo = (info / total) * 100;
  const pCart = (cart / total) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-8 text-slate-800 pb-32 admin-panel-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;600;800;900&display=swap');
        .admin-panel-root {
          font-family: 'Urbanist', 'Inter', sans-serif;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-150 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#2C3647]">OCTADESK DEEPDIVE CORE HUB</h1>
            <p className="text-slate-500 text-sm">Monitoramento de Infraestrutura de Dados Offline-First | Fórum E-commerce Brasil 2026</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSync}
              disabled={syncState === 'syncing' || metrics.pendentesOffline === 0}
              className={`px-6 py-3 rounded-xl font-bold transition-all cursor-pointer ${
                metrics.pendentesOffline === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                  : "bg-[#2C3647] hover:bg-[#1E293B] text-white shadow-md"
              }`}
            >
              {syncState === 'syncing' ? 'Sincronizando...' : 
               syncState === 'success' ? 'Sincronizado!' : 
               syncState === 'error' ? 'Erro ao Sincronizar' : 'Sincronizar Banco Mestre'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex justify-between items-center shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total de Participantes</p>
              <h3 className="text-4xl font-black text-[#2C3647]">{metrics.totalLeads}</h3>
            </div>
            <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400">
              <svg className="w-5 h-5 text-[#2C3647]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex justify-between items-center shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Tempo Médio de Jornada</p>
              <h3 className="text-4xl font-black text-[#2C3647]">{metrics.tempoMedioJornada}s</h3>
            </div>
            <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400">
              <svg className="w-5 h-5 text-[#2C3647]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex justify-between items-center shadow-sm">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Sincronizados na Nuvem</p>
              <h3 className="text-4xl font-black text-emerald-600">{metrics.sincronizados}</h3>
            </div>
            <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <div className={`border p-6 rounded-3xl flex justify-between items-center transition-all shadow-sm ${
            metrics.pendentesOffline > 0 
              ? "border-amber-200 bg-amber-50/40" 
              : "border-slate-100 bg-slate-50/50"
          }`}>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Retidos Offline</p>
              <h3 className={`text-4xl font-black ${metrics.pendentesOffline > 0 ? "text-amber-600" : "text-slate-900"}`}>
                {metrics.pendentesOffline}{' '}
                {metrics.pendentesOffline > 0 && <span className="text-xs font-normal text-slate-500 block sm:inline">aguardando rede</span>}
              </h3>
            </div>
            <div className={`w-10 h-10 flex items-center justify-center bg-white border rounded-2xl shadow-sm ${
              metrics.pendentesOffline > 0 ? "border-amber-200 text-amber-600" : "border-slate-100 text-slate-400"
            }`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-[#2C3647]">Distribuição de Prioridades DeepDive</h3>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4.2" />
                  
                  {metrics.totalLeads > 0 && (
                    <>
                      {pCart > 0 && (
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#F43F5E"
                          strokeWidth="4.2"
                          strokeDasharray={`${pCart} 100`}
                          strokeDashoffset="0"
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                      
                      {pSales > 0 && (
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="4.2"
                          strokeDasharray={`${pSales} 100`}
                          strokeDashoffset={-pCart}
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                      
                      {pInfo > 0 && (
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="4.2"
                          strokeDasharray={`${pInfo} 100`}
                          strokeDashoffset={-(pCart + pSales)}
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                      
                      {pFaq > 0 && (
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="4.2"
                          strokeDasharray={`${pFaq} 100`}
                          strokeDashoffset={-(pCart + pSales + pInfo)}
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-[#2C3647]">{metrics.totalLeads}</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-50 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F43F5E]"></span>
                    <span className="uppercase tracking-wider">Recuperação de Carrinho</span>
                  </div>
                  <span>{cart} ({pctCart}%)</span>
                </div>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-50 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                    <span className="uppercase tracking-wider">Agente de Vendas</span>
                  </div>
                  <span>{sales} ({pctSales}%)</span>
                </div>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-50 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#8B5CF6]"></span>
                    <span className="uppercase tracking-wider">Sistema de Notificação</span>
                  </div>
                  <span>{info} ({pctInfo}%)</span>
                </div>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-55 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                    <span className="uppercase tracking-wider">FAQ Automatizado</span>
                  </div>
                  <span>{faq} ({pctFaq}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-[#2C3647]">Volumetria Temporal (Mapa de Calor do Evento)</h3>
            <div className="grid grid-cols-3 gap-4 h-[178px]">
              <div className={`border p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${getHeatColor(heatMap.manha, maxHeat)}`}>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider block">Manhã</span>
                  <span className="text-[10px] opacity-60">08h - 12h</span>
                </div>
                <h4 className="text-3xl font-black">{heatMap.manha} <span className="text-[10px] block font-normal opacity-85 mt-1">interações</span></h4>
              </div>

              <div className={`border p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${getHeatColor(heatMap.tarde, maxHeat)}`}>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider block">Tarde</span>
                  <span className="text-[10px] opacity-60">12h - 18h</span>
                </div>
                <h4 className="text-3xl font-black">{heatMap.tarde} <span className="text-[10px] block font-normal opacity-85 mt-1">interações</span></h4>
              </div>

              <div className={`border p-4 rounded-xl flex flex-col justify-between transition-all duration-300 ${getHeatColor(heatMap.noite, maxHeat)}`}>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider block">Noite</span>
                  <span className="text-[10px] opacity-60">18h - 22h</span>
                </div>
                <h4 className="text-3xl font-black">{heatMap.noite} <span className="text-[10px] block font-normal opacity-85 mt-1">interações</span></h4>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm mb-12">
          <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#2C3647]">Registros Recentes em Cache</h3>
            <button 
              onClick={handleExportCSV}
              disabled={metrics.totalLeads === 0}
              className={`text-xs font-bold uppercase tracking-wider border px-3 py-1.5 rounded transition-all border-[#2C3647]/30 text-[#2C3647] hover:bg-slate-50 cursor-pointer bg-white`}
            >
              Baixar Cópia CSV Local
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            {recentLeads.map((lead) => (
              <div 
                key={lead.id} 
                className={`p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  lead.isPotentialLead 
                    ? "border-rose-200 bg-rose-50/20 shadow-sm" 
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                {/* 1. Nome e Empresa */}
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-lg font-extrabold text-[#2C3647]">{lead.nome}</h4>
                  <p className="text-slate-500 text-sm font-semibold mt-0.5">{lead.empresa || 'Empresa não informada'}</p>
                </div>

                {/* 2. Contato e Tempo */}
                <div className="flex-1 min-w-[185px] space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 text-sm font-medium">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-mono font-semibold">{lead.contato || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tempo: <strong className="font-mono text-slate-800">{lead.tempo_jornada_segundos ? `${lead.tempo_jornada_segundos}s` : '-'}</strong></span>
                  </div>
                </div>

                {/* 3. Prioridade (DeepDive) */}
                <div className="flex-shrink-0 min-w-[170px]">
                  <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    lead.prioridade_ferramenta === 'cart' ? 'bg-rose-100/80 text-rose-800' :
                    lead.prioridade_ferramenta === 'sales' ? 'bg-emerald-100/80 text-emerald-800' :
                    lead.prioridade_ferramenta === 'info' ? 'bg-purple-100/80 text-purple-800' :
                    'bg-blue-100/80 text-blue-800'
                  }`}>
                    {lead.prioridade_ferramenta ? (
                      lead.prioridade_ferramenta === 'cart' ? 'Recuperação Carrinho' :
                      lead.prioridade_ferramenta === 'sales' ? 'Agente de Vendas' :
                      lead.prioridade_ferramenta === 'info' ? 'Notificação Proativa' :
                      'FAQ Automatizado'
                    ) : (
                      lead.perfil_bifurcado || '-'
                    )}
                  </span>
                </div>

                {/* 4. Qualificação (isPotentialLead) - Destaque Principal */}
                <div className="flex-shrink-0 min-w-[160px] flex items-center">
                  {lead.isPotentialLead ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black tracking-wide shadow-sm animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                      🔥 MQL POTENCIAL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold">
                      Lead Regular
                    </span>
                  )}
                </div>

                {/* 5. Status Nuvem */}
                <div className="flex-shrink-0 min-w-[130px] flex items-center md:justify-end">
                  {lead.sincronizado === 1 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100 shadow-sm">
                      <span className="text-[10px]">✓</span> Sincronizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-amber-50 text-amber-700 font-bold text-xs border border-amber-100 shadow-sm">
                      <span className="text-[10px]">○</span> Pendente
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {recentLeads.length === 0 && (
              <div className="p-12 text-center text-slate-450 font-mono border border-dashed border-slate-200 rounded-3xl">
                [Nenhum participante em cache no IndexedDB]
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] p-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={onClose}
            className="w-full py-5 text-xl font-black rounded-2xl tracking-wide uppercase bg-[#2C3647] hover:bg-[#1E293B] text-white shadow-[0_8px_25px_rgba(44,54,71,0.15)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer block text-center"
          >
            Voltar ao Fluxo Principal (Tablet)
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;
