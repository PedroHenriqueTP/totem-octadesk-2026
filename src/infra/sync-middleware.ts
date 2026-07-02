import { db } from "../data/db";
import { HubSpotClient } from "./hubspot";

// Controle de concorrência para evitar chamadas de sincronização paralelas
let isSyncing = false;

// Callbacks registrados para notificar mudanças no status da fila
type SyncCallback = (pendingCount: number) => void;
const listeners = new Set<SyncCallback>();

/**
 * Registra um callback para ser notificado de mudanças na quantidade de pendências
 */
export function subscribeToSyncChanges(callback: SyncCallback) {
  listeners.add(callback);
  // Notifica imediatamente com a contagem atual
  db.leads.where("sincronizado").equals(0).count().then(count => {
    callback(count);
  });
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Notifica todos os listeners sobre a quantidade atual de pendências
 */
async function notifyListeners() {
  const count = await db.leads.where("sincronizado").equals(0).count();
  listeners.forEach(callback => callback(count));
}

/**
 * Sincroniza todos os leads pendentes (sincronizado === 0) no IndexedDB com o HubSpot.
 * Retorna o número de leads sincronizados com sucesso.
 */
export async function autoSyncOfflineLeads(): Promise<number> {
  if (isSyncing) return 0;
  
  if (typeof window !== "undefined" && !navigator.onLine) {
    await notifyListeners();
    return 0;
  }

  isSyncing = true;
  let successCount = 0;

  try {
    const unsyncedLeads = await db.leads.where("sincronizado").equals(0).toArray();
    
    if (unsyncedLeads.length > 0) {
      console.log(`[Sync Middleware] Encontrado(s) ${unsyncedLeads.length} lead(s) pendente(s) offline. Iniciando sincronização automática...`);
      
      for (const lead of unsyncedLeads) {
        // Mapeia os dados do banco para o formato de payload esperado pelo HubSpotClient
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
      
      if (successCount > 0) {
        console.log(`[Sync Middleware] Sincronização concluída. ${successCount} lead(s) enviado(s) com sucesso.`);
      }
    }
  } catch (error) {
    console.error("[Sync Middleware] Erro na sincronização automática em segundo plano:", error);
  } finally {
    isSyncing = false;
    await notifyListeners();
  }

  return successCount;
}

/**
 * Inicializa a escuta de rede e cron de sincronização em segundo plano.
 * Retorna uma função de limpeza para desregistrar listeners e intervals.
 */
export function setupAutoSync(): () => void {
  if (typeof window === "undefined") return () => {};

  // Executa imediatamente para limpar qualquer fila pendente ao iniciar/recarregar a página
  autoSyncOfflineLeads();

  // Escuta os eventos de rede online/offline do navegador
  const handleOnline = () => {
    console.log("[Sync Middleware] Conexão de rede detectada online. Forçando sincronização...");
    autoSyncOfflineLeads();
  };

  const handleOffline = () => {
    console.warn("[Sync Middleware] Dispositivo desconectado da rede.");
    notifyListeners();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Intervalo periódico de contingência de 30 segundos
  const intervalId = setInterval(() => {
    autoSyncOfflineLeads();
  }, 30000);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    clearInterval(intervalId);
  };
}
