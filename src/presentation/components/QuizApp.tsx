"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { db, Lead } from '../../data/db';
import { usePolvo, PolvoState } from '../../hooks/usePolvo';
import { 
  obterEtapaRecomendada, 
  obterTrilhaPorDor, 
  verificarAlertaComercial,
  EtapaDirecionamento 
} from '../../utils/bifurcation';
import { RespostasQuiz, TrilhaResultado, ToolScores } from '../../types/diagnostico';
import { 
  quizJourneyConfig, 
  QuizQuestion, 
  ETAPAS_PAREDE, 
  EtapaParedeConfig 
} from '../../shared/config/quiz-journey';
import { LocalStorageManager } from '../../infra/local-storage-manager';
import { HubSpotClient } from '../../infra/hubspot';
import AdminPanel from './AdminPanel';
import OctoMascot from './OctoMascot';
import { setupAutoSync, subscribeToSyncChanges } from '../../infra/sync-middleware';

interface ScreenThemeConfig {
  bgStyle: React.CSSProperties;
  textColorClass: string;
  subTextColorClass: string;
  pillClass: string;
  cardBgClass: string;
  buttonClass: string;
  logoType: 'blue' | 'white';
}

function getThemeForScore(score: number): ScreenThemeConfig {
  if (score <= 1) {
    return {
      bgStyle: { backgroundColor: '#FFFFFF' },
      textColorClass: 'text-[#1F2538]',
      subTextColorClass: 'text-slate-500',
      pillClass: 'bg-[#2D62FF]/10 text-[#2D62FF] border border-[#2D62FF]/20',
      cardBgClass: 'bg-slate-50 border border-slate-200/80',
      buttonClass: 'bg-[#2D62FF] text-white hover:bg-[#1A4ED9]',
      logoType: 'blue'
    };
  } else if (score <= 4) {
    return {
      bgStyle: { backgroundColor: '#F0F5FF' },
      textColorClass: 'text-[#1F2538]',
      subTextColorClass: 'text-slate-500',
      pillClass: 'bg-[#2D62FF]/15 text-[#2D62FF] border border-[#2D62FF]/20',
      cardBgClass: 'bg-white border border-blue-100/50 shadow-sm',
      buttonClass: 'bg-[#2D62FF] text-white hover:bg-[#1A4ED9]',
      logoType: 'blue'
    };
  } else if (score <= 7) {
    return {
      bgStyle: { backgroundColor: '#D6E4FF' },
      textColorClass: 'text-[#1F2538]',
      subTextColorClass: 'text-slate-600',
      pillClass: 'bg-[#2D62FF]/20 text-[#1D4ED8] border border-[#2D62FF]/30 font-extrabold',
      cardBgClass: 'bg-white border border-blue-200 shadow-sm',
      buttonClass: 'bg-[#2D62FF] text-white hover:bg-[#1A4ED9]',
      logoType: 'blue'
    };
  } else if (score <= 9) {
    return {
      bgStyle: { backgroundColor: '#2D62FF' },
      textColorClass: 'text-white',
      subTextColorClass: 'text-blue-100',
      pillClass: 'bg-white/20 text-white border border-white/25',
      cardBgClass: 'bg-white/10 border border-white/20 backdrop-blur-sm',
      buttonClass: 'bg-white text-slate-900 hover:bg-slate-50',
      logoType: 'white'
    };
  } else {
    return {
      bgStyle: { backgroundColor: '#001B3D' },
      textColorClass: 'text-white',
      subTextColorClass: 'text-slate-300',
      pillClass: 'bg-white/10 text-white border border-white/20',
      cardBgClass: 'bg-white/10 border border-white/15 backdrop-blur-sm',
      buttonClass: 'bg-white text-slate-900 hover:bg-slate-50',
      logoType: 'white'
    };
  }
}

function calcularPontosLead(answers: Record<number, string>, cargo: string): number {
  let score = 0;
  
  const p2 = answers[2];
  if (p2 === "Entre 50 e 200") score += 1;
  else if (p2 === "Entre 200 a 500") score += 2;
  else if (p2 === "Mais de 500") score += 3;
  
  const p3 = answers[3];
  if (p3 === "Entre 50 e 200") score += 1;
  else if (p3 === "Mais de 200") score += 2;
  
  const p4 = answers[4];
  if (p4 === "Shopify") score += 1;
  else if (p4 === "Tray, VTEX, Nuvemshop ou outra plataforma com site próprio") score += 1;
  else if (p4 === "Principalmente marketplaces (ML, Shopee, Magalu)") score += 3;
  
  const cargoClean = cargo ? cargo.toLowerCase().trim() : '';
  const cargosDecisores = [
    'ceo', 'dono', 'proprietario', 'proprietária', 'socio', 'sócio', 
    'comprador', 'compradora', 'diretor', 'diretora', 'director', 
    'gerente', 'manager', 'head', 'coordenador', 'coordenadora', 
    'operacoes', 'operações', 'founder', 'cofounder'
  ];
  const isDecisor = cargosDecisores.some(keyword => cargoClean.includes(keyword));
  if (isDecisor) score += 2;
  
  return score;
}

export default function QuizApp() {
  // 0: Recepção, 1: Cadastro, 2: Dor Principal (P1), 3: Qualificação (P2-P4), 4: Processando, 5: Direcionamento, 6: Relatório, 7: Obrigado
  const [step, setStep] = useState<number>(0); 
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDevHubVisible, setIsDevHubVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Estados do formulário de cadastro (Step 1)
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    email: "",
    telefone: "",
    cargo: "",
  });

  // Respostas coletadas ao longo do Quiz
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Lógica do Mascote Polvo
  const { state: polvoState, setState: setPolvoState, resetState: resetPolvoState } = usePolvo();

  // Resultado Calculado
  const [computedResult, setComputedResult] = useState<{
    leadId?: number;
    dorPrincipal: string;
    dorValue: string;
    tamanhoEmpresa: string;
    volumeAtendimentos: string;
    plataforma: string;
    etapaRecomendada: EtapaDirecionamento;
    isDecisor: boolean;
    sincronizado: boolean;
    score: number;
  } | null>(null);

  // Click tracking for logo to reveal debug tools (easter egg)
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Estados de conectividade e sincronização PWA
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      const newClicks = logoClicks + 1;
      setLogoClicks(newClicks);
      if (newClicks >= 5) {
        setIsDevHubVisible(prev => !prev);
        setLogoClicks(0);
      }
    } else {
      setLogoClicks(1);
    }
    setLastClickTime(now);
  };

  // Monitoramento do estado da conexão e fila de sincronização offline
  useEffect(() => {
    if (typeof window !== "undefined") {
      Promise.resolve().then(() => {
        setIsOnline(navigator.onLine);
      });
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSyncChanges((count) => {
      setPendingSyncCount(count);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const cleanup = setupAutoSync();
    return cleanup;
  }, []);

  const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);


  const isPhoneValid = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    return clean.length === 10 || clean.length === 11;
  };
  const formatarTelefone = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 2) return cleanValue;
    if (cleanValue.length <= 6) {
      return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
    }
    if (cleanValue.length <= 10) {
      return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 6)}-${cleanValue.slice(6)}`;
    }
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
  };

  const isStep1Valid =
    formData.nome.trim().length >= 2 &&
    formData.empresa.trim().length >= 2 &&
    formData.cargo.trim().length >= 2 &&
    isPhoneValid(formData.telefone);

  const nomeError = formData.nome !== "" && formData.nome.trim().length < 2;
  const phoneError = formData.telefone !== "" && !isPhoneValid(formData.telefone);
  const empresaError = formData.empresa !== "" && formData.empresa.trim().length < 2;
  const cargoError = formData.cargo !== "" && formData.cargo.trim().length < 2;

  const getInputClass = (hasError: boolean, value: string, isValid: boolean) => {
    const baseClass = "w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border text-[#1F2538] placeholder-slate-400 text-sm focus:outline-none transition-all";
    if (hasError) {
      return `${baseClass} border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50`;
    }
    if (value !== "" && isValid) {
      return `${baseClass} border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/50`;
    }
    return `${baseClass} border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-[#2D62FF] focus:bg-white`;
  };

  // Simula a barra de progresso no processamento (Step 4)
  useEffect(() => {
    if (step !== 4) return;
    const duration = 2500;
    
    // Anima a barra de 0 a 100 via CSS sem causar re-renders insanos
    const t1 = setTimeout(() => {
      setProgress(100);
    }, 50);

    const timer = setTimeout(() => {
      setStep(5);
    }, duration);

    return () => {
      clearTimeout(t1);
      clearTimeout(timer);
    };
  }, [step]);



  // Salva o diagnóstico localmente (Dexie) e dispara integração com o HubSpot
  const saveLeadDataAndTransition = useCallback(async (finalAnswers: Record<number, string>) => {
    setPolvoState('thinking');

    const dorVal = finalAnswers[1];
    const equipeP2 = finalAnswers[2];
    const volumeP3 = finalAnswers[3];
    const plataformaP4 = finalAnswers[4];

    const totalScore = calcularPontosLead(finalAnswers, formData.cargo);

    const etapaRec = obterEtapaRecomendada(dorVal, volumeP3, plataformaP4);
    const trilhaCompativel = obterTrilhaPorDor(dorVal);
    const isDecisor = verificarAlertaComercial(formData.cargo, equipeP2, volumeP3, plataformaP4);
    const tempoJornadaSegundos = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    // Geração de e-mail fallback único se estiver em branco e cargo padrão "Participante"
    const cleanPhone = formData.telefone.replace(/\D/g, "");
    const generatedEmail = formData.email.trim() || `${cleanPhone || Date.now()}@octadeskevent.com.br`;
    const defaultCargo = formData.cargo.trim() || "Participante";

    // Dados estruturados para o HubSpot & Dexie DB
    const leadData = {
      nome: formData.nome,
      empresa: formData.empresa,
      email: generatedEmail,
      telefone: formData.telefone,
      cargo: defaultCargo,
      dorPrincipal: ETAPAS_PAREDE[dorVal]?.dor || dorVal,
      tamanhoEmpresa: equipeP2,
      volumeAtendimentos: volumeP3,
      plataforma: plataformaP4,
      etapaIndicada: `Etapa ${etapaRec.numero}: ${etapaRec.nome}`,
      isDecisor,
      prioridadeFerramenta: dorVal,
      tempoJornadaSegundos
    };

    // 1. Tenta envio direto para o HubSpot
    const sincronizado = await HubSpotClient.enviarFormulario(leadData);

    // 2. Persiste no IndexedDB local para backup offline de contingência
    const novoLead: Lead = {
      nome: formData.nome,
      empresa: formData.empresa,
      email: generatedEmail,
      contato: formData.telefone,
      cargo: defaultCargo,
      tamanhoOperacao: equipeP2,
      volumeVendasMes: volumeP3,
      canais: [plataformaP4],
      transbordo_urgente: isDecisor,
      score_quiz: 4, // 4 perguntas preenchidas
      capturado_via: 'Quiz Tablet Fórum 2026',
      perfil_bifurcado: trilhaCompativel,
      sincronizado: sincronizado ? 1 : 0,
      criado_em: new Date().toISOString(),

      // Novos campos do Ecossistema
      dor_principal: leadData.dorPrincipal,
      tamanho_empresa: equipeP2,
      volume_atendimentos: volumeP3,
      plataforma: plataformaP4,
      etapa_indicada: leadData.etapaIndicada,
      is_decisor: isDecisor,
      prioridade_ferramenta: dorVal,
      tempo_jornada_segundos: tempoJornadaSegundos,
      isPotentialLead: isDecisor
    };

    let savedId: number | undefined;
    try {
      savedId = await db.leads.add(novoLead);
    } catch (error) {
      console.error("[Database] Erro ao gravar localmente:", error);
    }

    // 3. Salva no localStorage legado para compatibilidade do hook legado
    const diagnosticoResultado = {
      destino: (isDecisor ? 'TRANSBORDO_COMERCIAL_URGENTE' : 'TRIAGEM_PADRAO') as 'TRANSBORDO_COMERCIAL_URGENTE' | 'TRIAGEM_PADRAO',
      focoProduto: etapaRec.nome,
      mensagemInterface: ETAPAS_PAREDE[dorVal]?.description || "",
      brindeQualificado: isDecisor
    };

    LocalStorageManager.salvarLeadLocal({
      nome: formData.nome,
      empresa: formData.empresa,
      email: generatedEmail,
      telefone: formData.telefone,
      tamanhoOperacao: equipeP2,
      volumeVendasMes: volumeP3,
      canais: [plataformaP4],
      transbordoUrgente: isDecisor,
      scoreQuiz: 4,
      tempoJornadaSegundos,
      isPotentialLead: isDecisor
    }, diagnosticoResultado);

    setComputedResult({
      leadId: savedId,
      dorPrincipal: leadData.dorPrincipal,
      dorValue: dorVal,
      tamanhoEmpresa: equipeP2,
      volumeAtendimentos: volumeP3,
      plataforma: plataformaP4,
      etapaRecomendada: etapaRec,
      isDecisor,
      sincronizado,
      score: totalScore
    });

    setPolvoState(`trilha_${trilhaCompativel.toLowerCase()}` as PolvoState);
    setProgress(0);
    setStep(4); // Vai para a tela de processamento
  }, [formData, startTime, setPolvoState]);

  // Trata a seleção de opções nas perguntas do Quiz
  const handleSelectOption = useCallback((optionValue: string) => {
    const activeQuestion = quizJourneyConfig.questions[currentQuestionIndex];
    const newAnswers = { ...answers, [activeQuestion.id]: optionValue };
    setAnswers(newAnswers);

    if (currentQuestionIndex < quizJourneyConfig.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      // Se era a P1 (índice 0), avança para a Etapa 3 (Perguntas de qualificação)
      if (currentQuestionIndex === 0) {
        setStep(3);
      }
    } else {
      saveLeadDataAndTransition(newAnswers);
    }
  }, [currentQuestionIndex, answers, saveLeadDataAndTransition]);

  const handleReset = useCallback(() => {
    setStep(0);
    setFormData({
      nome: "",
      empresa: "",
      email: "",
      telefone: "",
      cargo: "",
    });
    setAnswers({});
    setCurrentQuestionIndex(0);
    setComputedResult(null);
    setProgress(0);
    setStartTime(null);
    resetPolvoState();
  }, [resetPolvoState]);

  // Helper para obter a letra da opção selecionada (A, B, C, D, E)
  const obterLetraOpcao = useCallback((questionIndex: number, valor: string): string => {
    const question = quizJourneyConfig.questions[questionIndex];
    if (!question) return '';
    const optIndex = question.options.findIndex(opt => opt.value === valor);
    if (optIndex === -1) return '';
    return String.fromCharCode(65 + optIndex);
  }, []);

  // Força um resultado aleatório para propósitos de simulação/debug no rodapé
  const seedRandomResult = useCallback(() => {
    const dores = ['captacao', 'vendas', 'notificacoes', 'posvenda', 'helpdesk'];
    const equipes = ['Menos de 50', 'Entre 50 e 200', 'Entre 200 a 500', 'Mais de 500'];
    const volumes = ['Menos de 50', 'Entre 50 e 200', 'Mais de 200', 'Não sei / não acompanho esse número'];
    const plataformas = ['Shopify', 'Tray, VTEX, Nuvemshop ou outra plataforma com site próprio', 'Principalmente marketplaces (ML, Shopee, Magalu)', 'Ainda não tenho loja online'];

    const chosenDor = dores[Math.floor(Math.random() * dores.length)];
    const chosenEquipe = equipes[Math.floor(Math.random() * equipes.length)];
    const chosenVolume = volumes[Math.floor(Math.random() * volumes.length)];
    const chosenPlat = plataformas[Math.floor(Math.random() * plataformas.length)];

    const mockAnswers = {
      1: chosenDor,
      2: chosenEquipe,
      3: chosenVolume,
      4: chosenPlat
    };

    setAnswers(mockAnswers);
    saveLeadDataAndTransition(mockAnswers);
  }, [saveLeadDataAndTransition]);

  // Redireciona automaticamente da tela de Obrigado (Obrigado) ou da tela de Direcionamento (Etapa Recomendada) para o Início após um tempo
  useEffect(() => {
    if (step !== 5 && step !== 7) return;
    const timeoutDuration = step === 5 ? 20000 : 8000; // 20s para a tela final (Direcionamento), 8s para Obrigado
    const timer = setTimeout(() => {
      handleReset();
    }, timeoutDuration);
    return () => clearTimeout(timer);
  }, [step, handleReset]);

  const slideVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3, ease: "easeIn" } }
  } as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05
      }
    },
    exit: { opacity: 0, transition: { duration: 0.25 } }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  } as const;

  const activeQuestion = quizJourneyConfig.questions[currentQuestionIndex];

  const getSubheading = (id: number) => {
    switch (id) {
      case 1:
        return "Escolha a que mais te incomoda.";
      case 2:
      case 3:
        return "Ajuda a entender o porte da operação.";
      case 4:
      default:
        return "Selecione a plataforma onde realiza suas vendas.";
    }
  };

  const renderProgressHeader = (questionNum: number) => {
    return (
      <div className="w-full flex flex-col items-center mb-3 space-y-2.5 z-10 select-none">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#2D62FF]">
          PERGUNTA {questionNum} DE 4
        </span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                num === questionNum
                  ? "bg-[#2D62FF]"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  const leadScore = computedResult?.score ?? 0;
  let currentTheme = getThemeForScore(leadScore);
  if (computedResult?.isDecisor) {
    currentTheme = {
      bgStyle: { background: 'linear-gradient(160deg, #001B3D 0%, #0D2E6B 55%, #001B3D 100%)' },
      textColorClass: 'text-white',
      subTextColorClass: 'text-blue-200',
      pillClass: 'bg-[#2D62FF]/30 text-[#7EAAFF] border border-[#2D62FF]/50 font-extrabold shadow-[0_0_18px_rgba(45,98,255,0.25)]',
      cardBgClass: 'bg-white/8 border border-[#2D62FF]/30 backdrop-blur-md shadow-[0_0_40px_rgba(45,98,255,0.20)]',
      buttonClass: 'bg-[#2D62FF] text-white hover:bg-[#1A4ED9] shadow-[0_8px_24px_rgba(45,98,255,0.35)]',
      logoType: 'white'
    };
  }
  const isDarkStep = step >= 5 && currentTheme.logoType === 'white';


  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] w-full p-0 select-none overflow-hidden">
      {/* Viewport Container */}
      <div 
        className="totem-viewport-container transition-all duration-300 relative flex flex-col justify-between overflow-hidden shadow-2xl"
        style={step >= 5 ? { ...currentTheme.bgStyle, color: currentTheme.logoType === 'white' ? '#FFFFFF' : '#1F2538' } as React.CSSProperties : { backgroundColor: '#FFFFFF', color: '#1F2538' }}
      >
        {/* Navy Ambient Background for High-Potential Leads — CSS only, no JS loops */}
        {step >= 5 && computedResult?.isDecisor && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#2D62FF]/15 blur-[80px] animate-pulse-slow" />
            <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#0D3FA6]/20 blur-[80px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(45,98,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(45,98,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px] opacity-50" />
          </div>
        )}

        {/* Soft Watermark decoration for steps 1-4 */}
        {(step >= 1 && step <= 4) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <svg 
              className="absolute -right-20 -bottom-20 w-80 h-80 text-blue-500/8 transform rotate-12" 
              fill="currentColor" 
              viewBox="0 0 100 100"
            >
              <path d="M0,50 C20,35 40,35 60,50 C80,65 90,65 100,50 L100,100 L0,100 Z" />
            </svg>
            <svg 
              className="absolute -left-16 -top-16 w-64 h-64 text-blue-500/5 transform -rotate-45" 
              fill="currentColor" 
              viewBox="0 0 100 100"
            >
              <path d="M0,50 C20,35 40,35 60,50 C80,65 90,65 100,50 L100,100 L0,100 Z" />
            </svg>
          </div>
        )}

        {/* Content wrapper */}
        <div className="flex-1 flex flex-col justify-between p-6 relative z-10 w-full overflow-hidden">
          {/* Common Header */}
          <header className="w-full flex justify-center mb-4 pt-2 cursor-pointer z-25 shrink-0" onClick={handleLogoClick}>
            <Image 
              src={isDarkStep ? "/assets/octadesk-logo-white.svg" : "/assets/octadesk-logo.svg"} 
              alt="Octadesk Logo" 
              width={120} 
              height={26} 
              style={{ width: 'auto', height: '26px' }}
              className="select-none"
              priority 
            />
          </header>

          <AnimatePresence mode="wait">
            {/* STEP 0: RECEPÇÃO */}
            {step === 0 && (
              <motion.div
                key="recepcao"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="py-10 text-center flex flex-col justify-between items-center flex-1 h-full w-full max-w-md mx-auto"
              >
                {/* Premium Clean Card with dynamic Octopus Mascot */}
                <div className="relative w-36 h-36 bg-slate-50/50 rounded-[32px] flex items-center justify-center border border-slate-100 p-2 my-2 shadow-[0_16px_36px_rgba(31,41,55,0.05)]">
                  <OctoMascot state={polvoState} size={120} />
                </div>

                <div className="flex-1 flex flex-col justify-center items-center gap-y-6 my-auto max-w-sm">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#2D62FF] bg-[#2D62FF]/10 px-4 py-2 rounded-full border border-[#2D62FF]/15">
                    Diagnóstico Operacional Executivo
                  </span>
                  <h1 className="text-2xl md:text-3xl font-black text-[#1F2538] leading-tight max-w-md mx-auto">
                    Sua Operação está no <span className="text-[#2D62FF]">topo</span> ou <span className="text-red-500">perdendo dinheiro</span>?
                  </h1>
                  <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto leading-relaxed font-medium">
                    Descubra o nível de eficiência e automação dos seus canais em menos de 2 minutos e obtenha a prioridade tática para seu negócio.
                  </p>
                </div>

                <div className="w-full max-w-sm mt-4">
                  <button
                    onClick={() => { setStep(1); setStartTime(Date.now()); }}
                    className="w-full py-4 text-sm font-black rounded-2xl tracking-wider uppercase bg-[#2D62FF] text-white hover:bg-[#1A4ED9] active:scale-[0.98] shadow-[0_12px_24px_rgba(45,98,255,0.22)] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Iniciar Diagnóstico
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: CADASTRO */}
            {step === 1 && (
              <motion.div
                key="cadastro"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="py-6 flex flex-col justify-between flex-1 h-full w-full max-w-md mx-auto"
              >
                <div className="space-y-3 text-center flex flex-col items-center">
                  <h2 className="text-xl md:text-2xl font-black text-[#1F2538] leading-tight">
                    Qual sua principal <span className="text-[#2D62FF]">dor</span> em atendimento e vendas hoje?
                  </h2>
                  <div className="flex flex-col items-center justify-center select-none">
                    <svg className="w-4 h-4 text-[#2D62FF]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                    </svg>
                    <div className="w-8 h-0.5 bg-[#2D62FF]/60 mt-0.5 rounded-full" />
                  </div>
                </div>

                <div className="space-y-4.5 my-auto py-4">
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Nome"
                      autoComplete="off"
                      className={getInputClass(nomeError, formData.nome, formData.nome.trim().length >= 2)}
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                    />
                    {nomeError && <p className="text-[10px] text-red-500 font-semibold mt-0.5 ml-4">Mínimo de 2 caracteres</p>}
                  </div>

                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Empresa"
                      autoComplete="off"
                      className={getInputClass(empresaError, formData.empresa, formData.empresa.trim().length >= 2)}
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                    />
                    {empresaError && <p className="text-[10px] text-red-500 font-semibold mt-0.5 ml-4">Mínimo de 2 caracteres</p>}
                  </div>

                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Contato"
                      autoComplete="off"
                      className={getInputClass(phoneError, formData.telefone, isPhoneValid(formData.telefone))}
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", formatarTelefone(e.target.value))}
                    />
                    {phoneError && <p className="text-[10px] text-red-500 font-semibold mt-0.5 ml-4">DDD + número inválido</p>}
                  </div>

                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Cargo (ex: CEO, Comprador, Diretor)"
                      autoComplete="off"
                      className={getInputClass(cargoError, formData.cargo, formData.cargo.trim().length >= 2)}
                      value={formData.cargo}
                      onChange={(e) => handleInputChange("cargo", e.target.value)}
                    />
                    {cargoError && <p className="text-[10px] text-red-500 font-semibold mt-0.5 ml-4">Mínimo de 2 caracteres</p>}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setStartTime(Date.now());
                      setCurrentQuestionIndex(0);
                      setStep(2);
                    }}
                    disabled={!isStep1Valid}
                    className={`w-full py-4 rounded-2xl font-black transition-all text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer ${
                      isStep1Valid
                        ? "bg-[#2D62FF] text-white hover:bg-[#1A4ED9] active:scale-[0.98] shadow-[0_12px_24px_rgba(45,98,255,0.18)]"
                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    }`}
                  >
                    Participe e descubra soluções!
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: PERGUNTA 1 - DOR PRINCIPAL */}
            {step === 2 && (
              <motion.div
                key="dor-principal"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="py-6 flex flex-col justify-between flex-1 h-full w-full max-w-md mx-auto"
              >
                <div>
                  {renderProgressHeader(1)}
                  <div className="space-y-2 text-center mt-2">
                    <h2 className="text-xl font-black text-[#1F2538] leading-tight">
                      Qual situação mais acontece na sua operação hoje?
                    </h2>
                    <p className="text-slate-500 text-xs font-semibold">{getSubheading(1)}</p>
                  </div>
                </div>

                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3.5 flex flex-col my-auto py-6"
                >
                  {quizJourneyConfig.questions[0].options.map((option, index) => {
                    const letter = String.fromCharCode(65 + index);
                    return (
                      <motion.button
                        variants={itemVariants}
                        key={option.value}
                        type="button"
                        onClick={() => handleSelectOption(option.value)}
                        className="w-full text-left py-4 px-5 rounded-2xl border border-slate-200 bg-white text-[#1F2538] hover:bg-slate-50 hover:border-blue-400/50 active:scale-[0.98] transition-all duration-150 flex items-center gap-4 text-xs md:text-sm font-bold cursor-pointer shadow-[0_4px_12px_rgba(31,41,55,0.03)]"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#2D62FF] text-white flex items-center justify-center font-black text-xs shrink-0 select-none shadow-sm">
                          {letter}
                        </div>
                        <span className="flex-1 leading-tight">{option.text}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>

                <div className="pt-2 flex justify-start">
                  <button
                    onClick={() => setStep(1)}
                    className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all text-xs cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: QUALIFICAÇÃO DO LEAD (P2 A P4) */}
            {step === 3 && activeQuestion && (
              <motion.div
                key={`question-${activeQuestion.id}`}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="py-6 flex flex-col justify-between flex-1 h-full w-full max-w-md mx-auto"
              >
                <div>
                  {renderProgressHeader(currentQuestionIndex + 1)}
                  <div className="space-y-2 text-center mt-2">
                    <h2 className="text-xl font-black text-[#1F2538] leading-tight">
                      {activeQuestion.question}
                    </h2>
                    <p className="text-slate-500 text-xs font-semibold">{getSubheading(activeQuestion.id)}</p>
                  </div>
                </div>

                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3.5 flex flex-col my-auto py-6"
                >
                  {activeQuestion.options.map((option, index) => {
                    const letter = String.fromCharCode(65 + index);
                    return (
                      <motion.button
                        variants={itemVariants}
                        key={option.value}
                        type="button"
                        onClick={() => handleSelectOption(option.value)}
                        className="w-full text-left py-4 px-5 rounded-2xl border border-slate-200 bg-white text-[#1F2538] hover:bg-slate-50 hover:border-blue-400/50 active:scale-[0.98] transition-all duration-150 flex items-center gap-4 text-xs md:text-sm font-bold cursor-pointer shadow-[0_4px_12px_rgba(31,41,55,0.03)]"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#2D62FF] text-white flex items-center justify-center font-black text-xs shrink-0 select-none shadow-sm">
                          {letter}
                        </div>
                        <span className="flex-1 leading-tight">{option.text}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>

                <div className="pt-2 flex justify-start">
                  <button
                    onClick={() => {
                      if (currentQuestionIndex > 1) {
                        setCurrentQuestionIndex((prev) => prev - 1);
                      } else {
                        setStep(2);
                        setCurrentQuestionIndex(0);
                      }
                    }}
                    className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all text-xs cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PROCESSING / LOADING */}
            {step === 4 && (
              <motion.div
                key="loading"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="py-10 text-center flex flex-col justify-between items-center flex-1 h-full w-full max-w-md mx-auto"
              >
                {/* dynamic thinking Octopus Mascot */}
                <div className="relative w-36 h-36 bg-slate-50/50 rounded-[32px] flex items-center justify-center border border-slate-100 p-2 my-2 shadow-[0_16px_36px_rgba(31,41,55,0.05)]">
                  <OctoMascot state={polvoState} size={120} />
                </div>

                <div className="space-y-3 my-auto py-4">
                  <h3 className="text-xl font-black text-[#1F2538] uppercase tracking-wide">
                    Processando Informações
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Consolidando as respostas para estruturar as recomendações ideais...
                  </p>
                </div>

                <div className="w-full max-w-xs flex flex-col items-center gap-y-3 mt-4">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/65 relative">
                    <div
                      className="h-full bg-gradient-to-r from-[#2D62FF] to-blue-400 transition-all duration-[2500ms] ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-[#2D62FF] tracking-wider font-extrabold animate-pulse">
                    Processando...
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 5: TELA DE DIRECIONAMENTO (RESULTADO RECOMENDADO) */}
            {step === 5 && computedResult && (
              <motion.div
                key="direccionamento"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="pt-2 pb-4 text-center flex flex-col justify-between items-center w-full flex-1 max-w-md mx-auto relative overflow-hidden gap-3"
              >

                {/* Header: Obrigado + Alert Badge */}
                <motion.div variants={itemVariants} className="text-center flex flex-col items-center w-full gap-1">
                  <p className={`text-[11px] font-medium tracking-wide ${currentTheme.textColorClass === 'text-white' ? 'text-white/70' : 'text-slate-400'}`}>
                    Obrigado pela sua participação
                  </p>
                  {computedResult.isDecisor && (
                    <div className="animate-badge-pulse bg-gradient-to-r from-[#2D62FF] to-[#0D3FA6] text-white font-black text-[9px] tracking-[0.2em] uppercase px-5 py-1.5 rounded-full border border-[#2D62FF]/40 shadow-[0_4px_16px_rgba(45,98,255,0.4)] shrink-0 select-none">
                      ⚠️ MARKETPLACE • ACIONAR VENDEDOR
                    </div>
                  )}
                </motion.div>

                {/* Stage Label + Title */}
                <motion.div variants={itemVariants} className="text-center flex flex-col items-start w-full px-1 gap-0.5">
                  <p className={`text-[11px] font-semibold tracking-wide ${currentTheme.textColorClass === 'text-white' ? 'text-white/60' : 'text-slate-400'}`}>
                    Comece pela Etapa {computedResult.etapaRecomendada.numero}
                  </p>
                  <h2 className={`text-4xl font-black leading-tight tracking-tight ${computedResult.isDecisor ? 'text-[#7EAAFF]' : 'text-[#2D62FF]'}`}>
                    {computedResult.etapaRecomendada.nome}
                  </h2>
                </motion.div>

                {/* Illustration Card */}
                <motion.div 
                  variants={itemVariants} 
                  className={`w-full rounded-[28px] flex items-center justify-center overflow-hidden flex-1 ${
                    computedResult.isDecisor 
                      ? currentTheme.cardBgClass 
                      : 'bg-[#EEF4FF] border border-[#D6E4FF]/60'
                  }`}
                  style={{ minHeight: '180px', maxHeight: '260px' }}
                >
                  <div className="animate-float flex items-center justify-center p-4 select-none w-full h-full">
                    <Image 
                      src={ETAPAS_PAREDE[computedResult.dorValue]?.imagePath} 
                      alt={computedResult.etapaRecomendada.nome} 
                      width={260} 
                      height={220} 
                      style={{ width: 'auto', height: '100%', maxHeight: '220px', objectFit: 'contain' }}
                      className="select-none drop-shadow-xl"
                      priority
                    />
                  </div>
                </motion.div>

                {/* Bottom Kiosk Dotted Curve with 3 Brand Icons */}
                <motion.div 
                  variants={itemVariants} 
                  className="w-full relative flex items-end justify-center select-none shrink-0 h-10"
                >
                  {/* Dotted curve behind icons */}
                  <svg 
                    className={`absolute inset-x-4 bottom-1 h-8 ${computedResult.isDecisor ? 'text-[#2D62FF]/30' : 'text-[#2D62FF]/20'}`} 
                    viewBox="0 0 120 24" 
                    fill="none" 
                    preserveAspectRatio="none"
                  >
                    <path d="M4,18 Q60,4 116,18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" fill="none" strokeLinecap="round"/>
                  </svg>
                  {/* Icons on the curve */}
                  <div className="flex justify-between items-end w-full max-w-[260px] relative z-10 px-2">
                    {/* Chat bubble — left, high */}
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-md translate-y-[-14px] ${
                      computedResult.isDecisor 
                        ? 'bg-[#0D2E6B] border-[#2D62FF]/50 text-[#7EAAFF]' 
                        : 'bg-white border-slate-200 text-[#2D354D]'
                    }`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {/* Node/org-tree — center, low (bottom of curve) */}
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-md translate-y-[0px] ${
                      computedResult.isDecisor 
                        ? 'bg-[#0D2E6B] border-[#2D62FF]/50 text-[#7EAAFF]' 
                        : 'bg-white border-slate-200 text-[#2D354D]'
                    }`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 000-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {/* Bot/robot — right, high */}
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-md translate-y-[-14px] ${
                      computedResult.isDecisor 
                        ? 'bg-[#0D2E6B] border-[#2D62FF]/50 text-[#7EAAFF]' 
                        : 'bg-white border-slate-200 text-[#2D354D]'
                    }`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1h3a2 2 0 012 2v2a1 1 0 011 1v4a1 1 0 01-1 1v2a2 2 0 01-2 2h-3v1a1 1 0 11-2 0v-1H6a2 2 0 01-2-2v-2a1 1 0 01-1-1V9a1 1 0 011-1V6a2 2 0 012-2h3V3a1 1 0 011-1zm-3 8a1 1 0 100-2 1 1 0 000 2zm6-1a1 1 0 112 0 1 1 0 01-2 0z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div variants={itemVariants} className="w-full shrink-0">
                  <button
                    onClick={handleReset}
                    className={`w-full py-4 rounded-2xl font-black transition-all text-xs tracking-wider uppercase active:scale-[0.98] cursor-pointer block text-center shadow-md ${
                      computedResult.isDecisor 
                        ? 'bg-[#2D62FF] text-white hover:bg-[#1A4ED9] shadow-[0_8px_24px_rgba(45,98,255,0.4)]'
                        : currentTheme.textColorClass === 'text-white' 
                          ? 'bg-white text-[#1F2538] hover:bg-slate-50' 
                          : 'bg-[#2D62FF] text-white hover:bg-[#1A4ED9]'
                    }`}
                  >
                    Novo Diagnóstico
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 6: RELATÓRIO DO PARTICIPANTE (COM ALERTA COMERCIAL) */}
            {step === 6 && computedResult && (
              <motion.div
                key="relatorio"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="py-4 flex flex-col justify-between flex-1 h-full w-full max-w-md mx-auto"
              >
                <motion.div variants={itemVariants} className="space-y-1 text-center flex flex-col items-center">
                  {computedResult.isDecisor && (
                    <span className="animate-badge-pulse inline-block text-[10px] font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-[#2D62FF] to-[#0D3FA6] border border-[#2D62FF]/50 px-4.5 py-1.5 rounded-full w-fit mx-auto shadow-[0_0_18px_rgba(45,98,255,0.35)] mb-1.5 select-none">
                      ★ CLIENTE FOCO • ABORDAGEM IMEDIATA ★
                    </span>
                  )}
                  <h2 className={`text-lg font-extrabold leading-tight ${currentTheme.textColorClass}`}>
                    Resumo do seu Diagnóstico
                  </h2>
                </motion.div>

                {/* Ficha Técnica de Respostas compactada para não precisar de scroll */}
                <motion.div 
                  variants={itemVariants}
                  className={`border rounded-2xl p-3.5 space-y-2.5 text-xs transition-colors ${
                    currentTheme.textColorClass === 'text-white'
                      ? 'bg-white/10 border-white/20 text-white'
                      : computedResult.isDecisor
                        ? 'bg-[#EEF4FF] border border-[#2D62FF]/20 text-[#1F2538] shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-[#1F2538]'
                  }`}
                >
                  {/* Dor Principal */}
                  <div className="space-y-0.5">
                    <span className={`font-bold block uppercase text-[8px] tracking-wider ${currentTheme.textColorClass === 'text-white' ? 'text-white/60' : 'text-slate-400'}`}>
                      Seu maior desafio atual ({obterLetraOpcao(0, computedResult.dorValue)})
                    </span>
                    <div className={`p-2 rounded-xl font-medium text-[11px] leading-snug border ${currentTheme.textColorClass === 'text-white' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                      {computedResult.dorPrincipal}
                    </div>
                  </div>

                  {/* Tamanho da Empresa e Volume Diário */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-0.5">
                      <span className={`font-bold block uppercase text-[8px] tracking-wider ${currentTheme.textColorClass === 'text-white' ? 'text-white/60' : 'text-slate-400'}`}>Tamanho da equipe</span>
                      <div className={`p-2 rounded-xl text-[11px] flex flex-col gap-1 min-h-[52px] justify-between border ${currentTheme.textColorClass === 'text-white' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                        <div>
                          <span className={`text-[9px] block ${currentTheme.textColorClass === 'text-white' ? 'text-white/70' : 'text-slate-500'}`}>Colaboradores:</span>
                          <span className={`font-extrabold text-[11px] leading-tight block ${currentTheme.textColorClass === 'text-white' ? 'text-white' : 'text-slate-900'}`}>{computedResult.tamanhoEmpresa}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className={`font-bold block uppercase text-[8px] tracking-wider ${currentTheme.textColorClass === 'text-white' ? 'text-white/60' : 'text-slate-400'}`}>Atendimentos diários</span>
                      <div className={`p-2 rounded-xl text-[11px] flex flex-col gap-1 min-h-[52px] justify-between border ${currentTheme.textColorClass === 'text-white' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                        <div>
                          <span className={`text-[9px] block ${currentTheme.textColorClass === 'text-white' ? 'text-white/70' : 'text-slate-500'}`}>Atendimentos/dia:</span>
                          <span className={`font-extrabold text-[11px] leading-tight block ${currentTheme.textColorClass === 'text-white' ? 'text-white' : 'text-slate-900'}`}>{computedResult.volumeAtendimentos}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plataforma */}
                  <div className="space-y-0.5">
                    <span className={`font-bold block uppercase text-[8px] tracking-wider ${currentTheme.textColorClass === 'text-white' ? 'text-white/60' : 'text-slate-400'}`}>Plataforma de e-commerce</span>
                    <div className={`p-2 rounded-xl text-[11px] flex flex-col gap-0.5 border ${currentTheme.textColorClass === 'text-white' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                      <span className="font-extrabold">{computedResult.plataforma}</span>
                    </div>
                  </div>

                  {/* Ponto de Entrada */}
                  <div className="space-y-0.5">
                    <span className={`font-bold block uppercase text-[8px] tracking-wider ${currentTheme.textColorClass === 'text-white' ? 'text-white/60' : 'text-slate-400'}`}>Direcionamento recomendado</span>
                    <div className={`p-2 rounded-xl text-center flex flex-col items-center justify-center border ${currentTheme.textColorClass === 'text-white' ? 'bg-white/20 border-white/20' : 'bg-blue-50/50 border-blue-200/60'}`}>
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest ${currentTheme.textColorClass === 'text-white' ? 'text-white' : 'text-[#2D62FF]'}`}>
                        Etapa {computedResult.etapaRecomendada.numero}
                      </span>
                      <span className={`text-sm font-black ${currentTheme.textColorClass === 'text-white' ? 'text-white' : 'text-[#1F2538]'}`}>
                        {computedResult.etapaRecomendada.nome}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-0.5 space-y-2">
                  <button
                    onClick={() => setStep(7)}
                    className={`w-full py-3.5 text-xs md:text-sm font-black rounded-2xl tracking-wider uppercase active:scale-[0.96] transition-all duration-200 cursor-pointer block text-center shadow-md ${currentTheme.textColorClass === 'text-white' ? 'bg-white text-[#1F2538] hover:bg-slate-50' : 'bg-[#1F2538] text-white hover:bg-[#2C3647]'}`}
                  >
                    Concluir Diagnóstico
                  </button>

                  {/* Assinatura Corporativa */}
                  <div className="flex items-center justify-center gap-1.5 opacity-65 scale-90 mt-1">
                    <Image 
                      src={currentTheme.logoType === 'white' ? "/assets/octadesk-squircle-white.svg" : "/assets/octadesk-squircle.svg?v=2"} 
                      alt="Octadesk Logo" 
                      width={16} 
                      height={16} 
                      className="h-4 w-4 select-none"
                    />
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${currentTheme.textColorClass === 'text-white' ? 'text-white/60' : 'text-slate-500'}`}>
                      Plataforma Oficial Octadesk
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 7: OBRIGADO! */}
            {step === 7 && (
              <motion.div
                key="obrigado"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="py-10 text-center flex flex-col justify-between items-center flex-1 h-full w-full max-w-md mx-auto relative"
              >
                {/* Ambient Glows */}
                <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-slow ${currentTheme.textColorClass === 'text-white' ? 'bg-[#2D62FF]/15' : 'bg-[#2D62FF]/5'}`} />

                {/* Logo Oficial Squircle/Polvo da Octadesk */}
                <motion.div 
                  variants={itemVariants}
                  className="relative z-10 my-2"
                >
                  <motion.div 
                    className={`relative w-36 h-36 rounded-[32px] flex items-center justify-center shadow-inner p-2 border ${currentTheme.textColorClass === 'text-white' ? 'bg-white/10 border-white/10' : 'bg-blue-50/50 border-blue-100/50'}`}
                  >
                    {/* Glowing ring */}
                    <div className={`absolute inset-0 rounded-[32px] blur-lg opacity-80 animate-pulse-slow ${currentTheme.textColorClass === 'text-white' ? 'bg-[#2D62FF]/20' : 'bg-[#2D62FF]/5'}`} />
                    <OctoMascot state={polvoState} size={120} className="relative z-10" />
                  </motion.div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3 relative z-10 my-auto py-4">
                  <h1 className={`text-3xl font-black tracking-wider ${currentTheme.textColorClass}`}>
                    OBRIGADO!
                  </h1>
                  <p className={`text-xs md:text-sm max-w-xs mx-auto leading-relaxed ${currentTheme.textColorClass === 'text-white' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Seu diagnóstico foi concluído com sucesso.
                  </p>
                  {computedResult?.isDecisor && (
                    <div className="animate-badge-pulse bg-gradient-to-r from-[#2D62FF] to-[#0D3FA6] text-white font-black text-[9px] tracking-[0.25em] uppercase px-5 py-2 rounded-full border border-[#2D62FF]/40 shadow-[0_4px_20px_rgba(45,98,255,0.45)] mt-3 mx-auto w-fit select-none">
                      ⚠️ ACIONAR VENDEDOR AGORA
                    </div>
                  )}
                </motion.div>

                {/* Badge com Logo Octadesk */}
                <div className="w-full flex flex-col items-center gap-y-4 relative z-10">
                  <motion.div variants={itemVariants} className={`border rounded-2xl py-3.5 px-10 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm ${currentTheme.textColorClass === 'text-white' ? 'bg-[#2C3647]/80 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                    <Image 
                      src={currentTheme.logoType === 'white' ? "/assets/octadesk-logo-white.svg" : "/assets/octadesk-logo.svg"} 
                      alt="Octadesk" 
                      width={100} 
                      height={22} 
                      className="h-5.5 w-auto select-none"
                      priority 
                    />
                  </motion.div>

                  {/* Indicador de Auto-redirect */}
                  <motion.div variants={itemVariants} className={`pt-1.5 flex items-center gap-2 text-[9px] font-mono tracking-wider justify-center ${currentTheme.textColorClass === 'text-white' ? 'text-slate-300' : 'text-slate-500'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Retornando ao início...
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Graphic with 3 Icons Connected by a dashed line */}
          {(step >= 1 && step <= 5) && (
            <div className={`w-full flex flex-col items-center justify-center mt-3 pt-3 border-t select-none shrink-0 relative z-10 ${isDarkStep ? 'border-white/10' : 'border-slate-100/50'}`}>
              <div className="flex items-center justify-between w-full max-w-[240px] relative px-2">
                {/* Dashed Line */}
                <div className={`absolute top-1/2 left-6 right-6 h-[2px] border-t-2 border-dashed -translate-y-1/2 z-0 ${isDarkStep ? 'border-white/20' : 'border-blue-400/40'}`} />
                
                {/* Icon 1: Speech Bubble */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 shadow-sm ${isDarkStep ? 'bg-white/10 border border-white/10 text-white' : 'bg-blue-50 border border-blue-100/60 text-[#2D62FF]'}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Icon 2: Branching Diagram */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 shadow-sm ${isDarkStep ? 'bg-white/10 border border-white/10 text-white' : 'bg-blue-50 border border-blue-100/60 text-[#2D62FF]'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.667v-3.5a2 2 0 00-2-2h-3.667v-3.5a2 2 0 00-2-2H5.667m0 0l2 2m-2-2l2-2" />
                    <circle cx="18" cy="18.667" r="1.5" fill="currentColor" />
                    <circle cx="5.667" cy="7.667" r="1.5" fill="currentColor" />
                    <circle cx="12.333" cy="13.167" r="1.5" fill="currentColor" />
                  </svg>
                </div>

                {/* Icon 3: Chatbot Face */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 shadow-sm ${isDarkStep ? 'bg-white/10 border border-white/10 text-white' : 'bg-blue-50 border border-blue-100/60 text-[#2D62FF]'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="3" y="6" width="18" height="12" rx="3" />
                    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="12" r="1.5" fill="currentColor" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15h.01" />
                    <path d="M12 6V3" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Network and Sync Status Badge */}
          <div
            className={`absolute bottom-3.5 left-3.5 z-30 select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all duration-300 backdrop-blur-sm shadow-sm ${
              isDarkStep
                ? "bg-white/5 border-white/10 text-white/70"
                : "bg-slate-50/80 border-slate-200/60 text-slate-500"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? "bg-emerald-400" : "bg-amber-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? "bg-emerald-500" : "bg-amber-500"
              }`}></span>
            </span>
            <span>
              {isOnline
                ? pendingSyncCount > 0
                  ? `Sincronizando (${pendingSyncCount})`
                  : "Online"
                : pendingSyncCount > 0
                ? `Fila Offline (${pendingSyncCount})`
                : "Offline"}
            </span>
          </div>

          {/* Discrete Dashboard/Settings trigger inside the Kiosk Viewport */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className={`absolute bottom-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm z-30 transition-all cursor-pointer select-none border ${
              isDarkStep 
                ? "bg-white/10 hover:bg-white/25 border-white/10 text-white/50 hover:text-white/80" 
                : "bg-slate-100/50 hover:bg-slate-200/80 border-slate-200/40 text-slate-400 hover:text-slate-650"
            }`}
            title="Painel de Controle (Dashboard)"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 4. Barra de Depuração no Rodapé (Navegação Livre e Debug rápido para promotores) */}
      {process.env.NODE_ENV !== 'production' && isDevHubVisible && (
        <div className="fixed bottom-16 right-4 max-w-[400px] flex flex-wrap justify-center gap-1.5 z-40 bg-white/95 border border-slate-200 rounded-2xl p-3 shadow-lg px-4">
          <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400 block w-full text-center mb-0.5">
            Depuração Stand: Ir para Etapa
          </span>
          {[
            { label: "1: Cadastro", stepVal: 1, indexVal: 0 },
            { label: "2: Dor (P1)", stepVal: 2, indexVal: 0 },
            { label: "3: Porte (P2)", stepVal: 3, indexVal: 1 },
            { label: "4: Vol. (P3)", stepVal: 3, indexVal: 2 },
            { label: "5: Plat. (P4)", stepVal: 3, indexVal: 3 },
            { label: "6: Direc.", stepVal: 5, indexVal: 0 },
            { label: "7: Relatório", stepVal: 6, indexVal: 0 },
            { label: "8: Obrigado", stepVal: 7, indexVal: 0 }
          ].map((item) => {
            const isActive = 
              item.stepVal === 5 
                ? step === 5
                : item.stepVal === 6
                  ? step === 6
                  : item.stepVal === 7
                    ? step === 7
                    : (step === item.stepVal && (step !== 3 || currentQuestionIndex === item.indexVal));

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.stepVal === 5) {
                    seedRandomResult();
                  } else if (item.stepVal === 6) {
                    if (!computedResult) {
                      seedRandomResult();
                    }
                    setStep(6);
                  } else if (item.stepVal === 7) {
                    if (!computedResult) {
                      seedRandomResult();
                    }
                    setStep(7);
                  } else {
                    setStep(item.stepVal);
                    if (item.stepVal <= 2) {
                      setCurrentQuestionIndex(0);
                    } else if (item.stepVal === 3) {
                      setCurrentQuestionIndex(item.indexVal);
                    }
                  }
                }}
                className={`py-1 px-1.5 rounded text-[8px] font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#2D62FF] text-white shadow-sm"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      
    </main>
  );
}
