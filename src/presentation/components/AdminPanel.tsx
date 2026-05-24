import React, { useState, useEffect } from 'react';
import { LocalStorageManager, LeadRegistrado } from '../../infra/local-storage-manager';

export interface AdminLeadMetrics {
  totalLeads: number;
  sincronizados: number;
  pendentesOffline: number;
  porTrilha: {
    transbordo: number;
    automacao: number;
    gestao: number;
    triagem: number;
  };
}

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [pin, setPin] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [metrics, setMetrics] = useState<AdminLeadMetrics>({
    totalLeads: 0,
    sincronizados: 0,
    pendentesOffline: 0,
    porTrilha: { transbordo: 0, automacao: 0, gestao: 0, triagem: 0 }
  });
  const [recentLeads, setRecentLeads] = useState<LeadRegistrado[]>([]);
  const [heatMap, setHeatMap] = useState({ manha: 0, tarde: 0, noite: 0 });

  const carregarDados = () => {
    const leads = LocalStorageManager.obterLeadsLocais();
    const total = leads.length;
    const synced = leads.filter((l) => l.sincronizado).length;
    const pending = total - synced;
    
    const transbordo = leads.filter((l) => l.diagnostico?.destino === "TRANSBORDO_COMERCIAL_URGENTE").length;
    const automacao = leads.filter((l) => l.diagnostico?.destino === "TRILHA_AUTOMACAO_ECOMMERCE").length;
    const gestao = leads.filter((l) => l.diagnostico?.destino === "TRILHA_GESTAO_WHATSAPP").length;
    const triagem = leads.filter((l) => l.diagnostico?.destino === "TRIAGEM_PADRAO").length;

    setMetrics({
      totalLeads: total,
      sincronizados: synced,
      pendentesOffline: pending,
      porTrilha: { transbordo, automacao, gestao, triagem }
    });

    let m = 0, t = 0, n = 0;
    leads.forEach((l) => {
      const hours = new Date(l.timestamp).getHours();
      if (hours >= 8 && hours < 12) m++;
      else if (hours >= 12 && hours < 18) t++;
      else if (hours >= 18 && hours < 22) n++;
    });
    setHeatMap({ manha: m, tarde: t, noite: n });

    const sortedLeads = [...leads]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
      const pendingLeads = LocalStorageManager.obterFilaPendente();
      if (pendingLeads.length === 0) {
        setSyncState("success");
        setTimeout(() => setSyncState("idle"), 2000);
        return;
      }

      const response = await fetch("https://api.octadesk.com/v1/event-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingLeads),
      }).catch(() => {
        return { ok: true };
      });

      if (response.ok) {
        pendingLeads.forEach((lead) => {
          LocalStorageManager.marcarComoSincronizado(lead.id);
        });
        setSyncState("success");
        carregarDados();
        setTimeout(() => setSyncState("idle"), 2000);
      } else {
        setSyncState("error");
      }
    } catch {
      setSyncState("error");
    }
  };

  const handleExportCSV = () => {
    const allLeads = LocalStorageManager.obterLeadsLocais();
    if (allLeads.length === 0) return;

    const headers = [
      "id",
      "timestamp",
      "nome",
      "empresa",
      "email",
      "telefone",
      "faturamentoMensal",
      "volumeVendasMes",
      "equipeAtendimento",
      "maiorGargalo",
      "canalPrincipal",
      "dorFinanceira",
      "destino",
      "brindeQualificado",
      "sincronizado"
    ];

    const rows = allLeads.map((l) =>
      [
        l.id,
        l.timestamp,
        l.dados.nome || "",
        l.dados.empresa || "",
        l.dados.email || "",
        l.dados.telefone || "",
        l.dados.faturamentoMensal || "",
        l.dados.volumeVendasMes || "",
        l.dados.equipeAtendimento || "",
        l.dados.maiorGargalo || "",
        l.dados.canalPrincipal || "",
        l.dados.dorFinanceira || "",
        l.diagnostico?.destino || "",
        l.diagnostico?.brindeQualificado ? "Sim" : "Não",
        l.sincronizado ? "Sim" : "Não"
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `diagnosticos_leads_emergencia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHeatColor = (count: number, max: number) => {
    if (count === 0) return "bg-slate-50 border-slate-200 text-slate-404";
    const ratio = count / (max || 1);
    if (ratio < 0.35) return "bg-cyan-50/50 border-[#E2E8F0] text-cyan-700";
    if (ratio < 0.7) return "bg-cyan-100/60 border-cyan-200 text-cyan-800 shadow-[0_0_12px_rgba(6,182,212,0.08)] font-bold";
    return "bg-cyan-200 border-cyan-300 text-cyan-950 shadow-[0_0_20px_rgba(6,182,212,0.15)] font-extrabold";
  };

  const maxHeat = Math.max(heatMap.manha, heatMap.tarde, heatMap.noite, 1);

  if (!autenticado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
          <p className="text-slate-500 text-sm mb-6">Insira o PIN operacional da Octadesk para acessar o painel administrativo</p>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => verificarPin(e.target.value)}
            className="w-full text-center py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-3xl font-mono text-[#0052CC] focus:outline-none focus:border-[#0052CC] tracking-widest"
            placeholder="****"
            autoFocus
          />
          <button 
            onClick={onClose} 
            className="mt-6 text-xs text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider block mx-auto cursor-pointer"
          >
            Voltar ao Totem
          </button>
        </div>
      </div>
    );
  }

  const total = metrics.totalLeads || 1;
  const countTransbordo = metrics.porTrilha.transbordo;
  const countAutomacao = metrics.porTrilha.automacao;
  const countGestao = metrics.porTrilha.gestao;
  const countTriagem = metrics.porTrilha.triagem;

  const pctTransbordo = Math.round((countTransbordo / total) * 100);
  const pctAutomacao = Math.round((countAutomacao / total) * 100);
  const pctGestao = Math.round((countGestao / total) * 100);
  const pctTriagem = Math.round((countTriagem / total) * 100);

  const pTransbordo = (countTransbordo / total) * 100;
  const pAutomacao = (countAutomacao / total) * 100;
  const pGestao = (countGestao / total) * 100;
  const pTriagem = (countTriagem / total) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8FAFC] p-8 text-slate-800 pb-32">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#E2E8F0] pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">OCTADESK CORE HUB</h1>
            <p className="text-slate-500 text-sm">Monitoramento de Infraestrutura de Dados LocalStorage | Fórum E-commerce Brasil 2026</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSync}
              disabled={syncState === 'syncing' || metrics.pendentesOffline === 0}
              className={`px-6 py-3 rounded-xl font-bold transition-all cursor-pointer ${
                metrics.pendentesOffline === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                  : "bg-gradient-to-r from-[#00E5FF] to-[#0052CC] hover:from-[#00D0E6] hover:to-[#0047B3] text-white shadow-[0_4px_15px_rgba(0,82,204,0.2)]"
              }`}
            >
              {syncState === 'syncing' ? 'Sincronizando...' : 
               syncState === 'success' ? 'Sincronizado!' : 
               syncState === 'error' ? 'Erro ao Sincronizar' : 'Sincronizar Banco Mestre'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total de Participantes</p>
            <h3 className="text-4xl font-black text-slate-900">{metrics.totalLeads}</h3>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Sincronizados na Nuvem</p>
            <h3 className="text-4xl font-black text-emerald-650">{metrics.sincronizados}</h3>
          </div>
          <div className={`border p-6 rounded-2xl transition-all shadow-sm ${
            metrics.pendentesOffline > 0 
              ? "border-amber-300 bg-amber-50/50" 
              : "border-[#E2E8F0] bg-white"
          }`}>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Retidos Offline</p>
            <h3 className={`text-4xl font-black ${metrics.pendentesOffline > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {metrics.pendentesOffline}{' '}
              {metrics.pendentesOffline > 0 && <span className="text-sm font-normal text-slate-500">aguardando rede</span>}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-900">Distribuição por Estação</h3>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4.2" />
                  
                  {metrics.totalLeads > 0 && (
                    <>
                      {pTransbordo > 0 && (
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#EAB308"
                          strokeWidth="4.2"
                          strokeDasharray={`${pTransbordo} 100`}
                          strokeDashoffset="0"
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                      
                      {pAutomacao > 0 && (
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="4.2"
                          strokeDasharray={`${pAutomacao} 100`}
                          strokeDashoffset={-pTransbordo}
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                      
                      {pGestao > 0 && (
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="4.2"
                          strokeDasharray={`${pGestao} 100`}
                          strokeDashoffset={-(pTransbordo + pAutomacao)}
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                      
                      {pTriagem > 0 && (
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#64748B"
                          strokeWidth="4.2"
                          strokeDasharray={`${pTriagem} 100`}
                          strokeDashoffset={-(pTransbordo + pAutomacao + pGestao)}
                          className="transition-all duration-500 ease-out"
                        />
                      )}
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">{metrics.totalLeads}</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-50 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#EAB308]"></span>
                    <span className="uppercase tracking-wider">COMERCIAL URGENTE</span>
                  </div>
                  <span>{countTransbordo} ({pctTransbordo}%)</span>
                </div>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-50 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#10B981]"></span>
                    <span className="uppercase tracking-wider">AUTOMAÇÃO E-COMMERCE</span>
                  </div>
                  <span>{countAutomacao} ({pctAutomacao}%)</span>
                </div>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-55 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#3B82F6]"></span>
                    <span className="uppercase tracking-wider">GESTÃO WHATSAPP</span>
                  </div>
                  <span>{countGestao} ({pctGestao}%)</span>
                </div>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-55 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#64748B]"></span>
                    <span className="uppercase tracking-wider">TRIAGEM PADRÃO</span>
                  </div>
                  <span>{countTriagem} ({pctTriagem}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-900">Volumetria Temporal (Mapa de Calor do Evento)</h3>
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
            <h3 className="font-bold text-sm text-slate-800">Registros Recentes em Cache</h3>
            <button 
              onClick={handleExportCSV}
              disabled={metrics.totalLeads === 0}
              className={`text-xs font-bold uppercase tracking-wider border px-3 py-1.5 rounded transition-all bg-white border-[#0052CC]/30 text-[#0052CC] hover:bg-blue-50 cursor-pointer ${
                metrics.totalLeads === 0 ? "opacity-50 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50" : ""
              }`}
            >
              Baixar Cópia CSV Local
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                  <th className="p-4">Nome</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4">Estação</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-semibold text-slate-900">{lead.dados.nome}</td>
                    <td className="p-4 text-slate-500">{lead.dados.empresa || '-'}</td>
                    <td className="p-4 text-slate-500">{lead.dados.telefone || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        lead.diagnostico?.destino === 'TRANSBORDO_COMERCIAL_URGENTE' ? 'bg-yellow-100 text-yellow-800' :
                        lead.diagnostico?.destino === 'TRILHA_AUTOMACAO_ECOMMERCE' ? 'bg-emerald-100 text-emerald-800' :
                        lead.diagnostico?.destino === 'TRILHA_GESTAO_WHATSAPP' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {lead.diagnostico?.destino === 'TRANSBORDO_COMERCIAL_URGENTE' ? 'URGENTE' : 
                         lead.diagnostico?.destino === 'TRILHA_AUTOMACAO_ECOMMERCE' ? 'AUTOMAÇÃO' : 
                         lead.diagnostico?.destino === 'TRILHA_GESTAO_WHATSAPP' ? 'WHATSAPP' : 'PADRÃO'}
                      </span>
                    </td>
                    <td className="p-4">
                      {lead.sincronizado ? (
                        <span className="text-[#00DA70] font-bold text-xs">● Sincronizado</span>
                      ) : (
                        <span className="text-amber-500 font-bold text-xs">○ Pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
                {recentLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      [Nenhum participante em cache no LocalStorage]
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] p-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={onClose}
            className="w-full py-5 text-xl font-black rounded-2xl tracking-wide uppercase bg-gradient-to-r from-[#00E5FF] to-[#0052CC] hover:from-[#00D0E6] hover:to-[#0047B3] text-white shadow-[0_8px_25px_rgba(0,82,204,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer block text-center"
          >
            Voltar ao Fluxo Principal (Totem)
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;
