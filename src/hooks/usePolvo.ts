import { useState, useCallback } from "react";
import { RespostasQuiz, TrilhaResultado } from "../types/diagnostico";
import { calcularTrilhaOctadesk } from "../utils/bifurcation";

export type PolvoState =
  | "idle"
  | "thinking"
  | "trilha_enterprise"
  | "trilha_automacao"
  | "trilha_atendimento"
  | "trilha_controle";

export function usePolvo() {
  const [state, setState] = useState<PolvoState>("idle");

  const resetState = useCallback(() => {
    setState("idle");
  }, []);

  const processarLead = useCallback(async (respostas: RespostasQuiz) => {
    setState("thinking");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const trilha = calcularTrilhaOctadesk(respostas);
    const mappedState = `trilha_${trilha.toLowerCase()}` as PolvoState;
    setState(mappedState);
    return trilha;
  }, []);

  return {
    state,
    setState,
    resetState,
    processarLead,
  };
}
