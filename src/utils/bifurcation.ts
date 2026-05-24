import { RespostasQuiz, TrilhaResultado } from "../types/diagnostico";

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
