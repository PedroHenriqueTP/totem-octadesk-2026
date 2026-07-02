import { LeadData } from "../core/quiz-bifurcation";

// Valores padrão de homologação para o HubSpot (Fórum E-commerce Brasil 2026)
const DEFAULT_PORTAL_ID = "48682026"; // Exemplo de Portal ID
const DEFAULT_FORM_GUID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"; // Exemplo de Form GUID

interface HubSpotField {
  name: string;
  value: string;
}

export const HubSpotClient = {
  /**
   * Envia os dados do Lead para o HubSpot Forms API
   * Retorna true se a integração foi concluída com sucesso, false caso contrário (ex: rede offline)
   */
  async enviarFormulario(lead: LeadData): Promise<boolean> {
    const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || DEFAULT_PORTAL_ID;
    const formGuid = process.env.NEXT_PUBLIC_HUBSPOT_FORM_GUID || DEFAULT_FORM_GUID;
    
    // Se for o GUID mock padrão, simula o sucesso localmente para evitar erros de 404 no console
    if (formGuid === DEFAULT_FORM_GUID) {
      console.warn("[HubSpot] Modo Homologação: Usando GUID de formulário mock. Envio local simulado com sucesso.");
      return true;
    }

    const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;

    // Mapeamento de propriedades para o padrão do CRM HubSpot
    const fields: HubSpotField[] = [
      { name: "firstname", value: lead.nome },
      { name: "email", value: lead.email },
      { name: "phone", value: lead.telefone },
      { name: "company", value: lead.empresa },
      { name: "jobtitle", value: lead.cargo || "" },
      { name: "dor_principal", value: lead.dorPrincipal || "" },
      { name: "tamanho_empresa", value: lead.tamanhoEmpresa || "" },
      { name: "volume_atendimentos", value: lead.volumeAtendimentos || "" },
      { name: "plataforma_ecommerce", value: lead.plataforma || "" },
      { name: "etapa_indicada_parede", value: lead.etapaIndicada || "" },
      { name: "perfil_bifurcado", value: lead.prioridadeFerramenta || "" },
      { name: "is_decisor_mql", value: lead.isDecisor ? "true" : "false" }
    ];

    try {
      // Se estiver explicitamente sem internet no tablet, falha imediatamente
      if (typeof window !== "undefined" && !navigator.onLine) {
        console.warn("[HubSpot] Dispositivo offline. Lead enfileirado localmente.");
        return false;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: typeof window !== "undefined" ? window.location.href : "http://localhost:3000",
            pageName: "Octadesk DeepDive Quiz"
          }
        }),
        // Timeout curto de 6 segundos para não travar a UI em redes instáveis de eventos
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        console.log("[HubSpot] Lead sincronizado com sucesso no CRM em tempo real.");
        return true;
      } else {
        const errorText = await response.text();
        console.error("[HubSpot] Erro na resposta da API:", response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error("[HubSpot] Falha de conexão ou timeout:", error);
      return false;
    }
  }
};
