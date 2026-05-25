import { RespostasQuiz, TrilhaResultado, ToolScores } from "../types/diagnostico";

export function calcularTrilhaOctadesk(respostas: RespostasQuiz): TrilhaResultado {
  const isGrandeEmpresa = 
    respostas.tamanhoOperacao === 'De 21 a 100 colaboradores' || 
    respostas.tamanhoOperacao === 'Mais de 100 colaboradores';

  if (!respostas.possuiIaVendas) {
    if (isGrandeEmpresa) {
      return 'Enterprise';
    } else {
      return 'Automacao';
    }
  }

  if (isGrandeEmpresa) {
    return 'Enterprise';
  }

  if (respostas.possuiHelpdeskSla || respostas.possuiEmissaoNotas) {
    return 'Atendimento';
  }

  return 'Controle';
}

export function calcularPontosDiagnostico(
  equipe: string, 
  volume: string, 
  canais: string[]
): ToolScores {
  const scores: ToolScores = { faq: 0, sales: 0, info: 0, cart: 0 };
  
  // Pontuação por Equipe
  if (equipe === 'Eu + 1') {
    scores.faq += 1;
  } else if (equipe === '3 a 5') {
    scores.faq += 2;
    scores.sales += 1;
  } else if (equipe === '6 a 15') {
    scores.faq += 3;
    scores.sales += 2;
    scores.info += 1;
  } else if (equipe === 'Mais de 15') {
    scores.faq += 4;
    scores.sales += 2;
    scores.info += 3;
    scores.cart += 1;
  }

  // Pontuação por Volume
  if (volume === 'Até 100/mês') {
    scores.sales += 2;
    scores.faq += 1;
  } else if (volume === 'De 101 a 1000/mês') {
    scores.cart += 3;
    scores.info += 2;
    scores.faq += 2;
  } else if (volume === 'Mais de 1000/mês') {
    scores.cart += 5;
    scores.info += 4;
    scores.faq += 3;
  }

  // Pontuação por Canais
  canais.forEach(canal => {
    if (canal === 'WhatsApp') {
      scores.sales += 2;
      scores.faq += 2;
    } else if (canal === 'Instagram') {
      scores.sales += 2;
    } else if (canal === 'E-mail') {
      scores.info += 2;
      scores.faq += 1;
    } else if (canal === 'Chat no Site') {
      scores.faq += 2;
      scores.sales += 1;
    } else if (canal === 'Telefone') {
      scores.info += 1;
    }
  });

  return scores;
}

export function obterFerramentaPrioritaria(scores: ToolScores): 'faq' | 'sales' | 'info' | 'cart' {
  const priorities: Array<'faq' | 'sales' | 'info' | 'cart'> = ['cart', 'sales', 'faq', 'info'];
  let maxKey: 'faq' | 'sales' | 'info' | 'cart' = 'cart';
  let maxVal = -1;
  
  for (const key of priorities) {
    if (scores[key] > maxVal) {
      maxVal = scores[key];
      maxKey = key;
    }
  }
  return maxKey;
}
