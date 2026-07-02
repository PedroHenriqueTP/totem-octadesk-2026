import { TrilhaResultado, RespostasQuiz } from "../types/diagnostico";

export interface EtapaDirecionamento {
  numero: number;
  nome: string;
  dor: string;
  iconName: string;
}

/**
 * Retorna a etapa recomendada na parede com base na Dor Principal (Pergunta 1)
 */
export function obterEtapaRecomendada(
  dorValue: string,
  _volumeP3?: string,
  _plataformaP4?: string
): EtapaDirecionamento {
  switch (dorValue) {
    case 'captacao':
      return {
        numero: 1,
        nome: "Captação",
        dor: "Quero alcançar mais clientes",
        iconName: "Megafone"
      };
    case 'vendas':
      return {
        numero: 2,
        nome: "Atendimento de Vendas",
        dor: "Perco vendas porque meu time demora para responder",
        iconName: "Headset Vendas"
      };
    case 'notificacoes':
      return {
        numero: 3,
        nome: "Notificações",
        dor: "Meu time passa o dia respondendo 'onde está meu pedido'",
        iconName: "Sino"
      };
    case 'posvenda':
      return {
        numero: 4,
        nome: "Pós-venda",
        dor: "Tenho muita troca, devolução e reclamação",
        iconName: "Caixa"
      };
    case 'helpdesk':
    default:
      return {
        numero: 5,
        nome: "Helpdesk",
        dor: "Meu atendimento não tem organização, SLA nem métricas",
        iconName: "Headset Suporte"
      };
  }
}

/**
 * Mapeia a dor da P1 para uma Trilha compatível com o banco legível e legado
 */
export function obterTrilhaPorDor(dorValue: string): TrilhaResultado {
  switch (dorValue) {
    case 'captacao':
    case 'vendas':
      return 'Automacao';
    case 'notificacoes':
    case 'posvenda':
      return 'Atendimento';
    case 'helpdesk':
      return 'Enterprise';
    default:
      return 'Controle';
  }
}

/**
 * Regra visual e de CRM de Sinalização de Alerta Comercial:
 * - P2 (Porte): Entre 200 a 500 (Opção C) ou Mais de 500 (Opção D) -> Prioridade comercial
 * - P3 (Volume): Mais de 200 (Opção C) -> Prioridade comercial
 * - P4 (Plataforma): Principalmente marketplaces (ML, Shopee, Magalu) (Opção C) -> Alerta vendedor
 */
export function verificarAlertaComercial(
  cargo: string,
  equipeP2: string,
  volumeP3: string,
  plataformaP4: string
): boolean {
  const cargoClean = cargo ? cargo.toLowerCase().trim() : '';
  const cargosDecisores = [
    'ceo', 'dono', 'proprietario', 'proprietária', 'socio', 'sócio', 
    'comprador', 'compradora', 'diretor', 'diretora', 'director', 
    'gerente', 'manager', 'head', 'coordenador', 'coordenadora', 
    'operacoes', 'operações', 'founder', 'cofounder'
  ];

  const matchesCargo = cargosDecisores.some(keyword => cargoClean && cargoClean.includes(keyword));
  const matchesEquipe = equipeP2 === 'Entre 200 a 500' || equipeP2 === 'Mais de 500';
  const matchesVolume = volumeP3 === 'Mais de 200';
  const matchesPlataforma = plataformaP4 === 'Principalmente marketplaces (ML, Shopee, Magalu)';

  return matchesCargo || matchesEquipe || matchesVolume || matchesPlataforma;
}

// Mantido para compatibilidade, caso outros componentes usem
export function calcularTrilhaOctadesk(respostas: Partial<RespostasQuiz>): TrilhaResultado {
  if (respostas.tamanhoOperacao === 'Mais de 100 colaboradores' || respostas.tamanhoOperacao === 'De 21 a 100 colaboradores') {
    return 'Enterprise';
  }
  return 'Automacao';
}
