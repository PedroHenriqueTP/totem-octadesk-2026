export interface LeadData {
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  faturamentoMensal: 'ate_50k' | '51k_200k' | '201k_500k' | 'acima_500k';
  volumeVendasMes: 'ate_100' | '101_500' | '501_2000' | 'mais_2000';
  equipeAtendimento: 'eu_mais_um' | '3_5' | '6_15' | 'mais_15';
  maiorGargalo: 'demora_whatsapp' | 'centralizar_numero' | 'falta_metricas' | 'perda_historico';
  canalPrincipal: 'ecommerce' | 'whatsapp_instagram' | 'loja_fisica' | 'b2b';
  dorFinanceira: 'abandono_carrinho' | 'esquecimento_pix_boleto' | 'saida_chat' | 'pos_venda';
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

export function processarDiagnosticoLead(lead: LeadData): DiagnosticoResultado {
  // 1. Bifurcação por Porte e Escala (Gatilho Comercial Urgente)
  if (lead.faturamentoMensal === 'acima_500k' || lead.equipeAtendimento === 'mais_15') {
    return {
      destino: 'TRANSBORDO_COMERCIAL_URGENTE',
      focoProduto: 'Octadesk Enterprise: Atendimento em escala, múltiplos departamentos e roteamento avançado.',
      mensagemInterface: 'O Polvo identificou uma operação de alta escala! Um consultor especialista foi notificado para te atender aqui no estande agora.',
      brindeQualificado: true
    };
  }

  // 2. Bifurcação por Operação de E-commerce (Recuperação de Vendas)
  if (lead.canalPrincipal === 'ecommerce' && 
     (lead.dorFinanceira === 'abandono_carrinho' || lead.dorFinanceira === 'esquecimento_pix_boleto')) {
    return {
      destino: 'TRILHA_AUTOMACAO_ECOMMERCE',
      focoProduto: 'Integrações nativas com carrinhos, disparos automáticos de PIX e recuperação via WhatsApp.',
      mensagemInterface: 'Diagnóstico concluído! O Polvo encontrou o vazamento de dinheiro no seu carrinho. Veja como automatizar a recuperação:',
      brindeQualificado: true
    };
  }

  // 3. Bifurcação por Gargalo de Atendimento (Gestão e Centralização)
  if (lead.maiorGargalo === 'centralizar_numero' || lead.maiorGargalo === 'falta_metricas') {
    return {
      destino: 'TRILHA_GESTAO_WHATSAPP',
      focoProduto: 'Painel multiatendente, centralização de números do WhatsApp e dashboards de produtividade em tempo real.',
      mensagemInterface: 'Análise concluída! Seu time precisa de centralização e métricas. O Polvo organizou a melhor estrutura para sua equipe:',
      brindeQualificado: false
    };
  }

  // 4. Fluxo Padrão (Self-Service / Automação Geral)
  return {
    destino: 'TRIAGEM_PADRAO',
    focoProduto: 'Octadesk Bot e automação de canais para otimização de tempo e pós-venda.',
    mensagemInterface: 'Tudo pronto! O Polvo mapeou sua operação e preparou uma demonstração das ferramentas de automação da Octadesk.',
    brindeQualificado: false
  };
}
