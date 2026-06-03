"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { db, Lead } from '../../data/db';
import { usePolvo, PolvoState } from '../../hooks/usePolvo';
import { calcularTrilhaOctadesk, calcularPontosDiagnostico, obterFerramentaPrioritaria } from '../../utils/bifurcation';
import { RespostasQuiz, TamanhoOperacao, TrilhaResultado, ToolScores } from '../../types/diagnostico';
import { quizJourneyConfig, QuizQuestion, VERSAO_ATIVA, JornadaVersao, TOOLS_CONFIG } from '../../shared/config/quiz-journey';
import { LocalStorageManager } from '../../infra/local-storage-manager';
import AdminPanel from './AdminPanel';

export default function QuizApp() {
  // 0: Recepção, 1: Cadastro, 2: Diagnóstico, 3: Quiz, 4: Loading, 5: Veredito
  const [step, setStep] = useState<number>(0); 
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  // Estados de controle de versão (Feature Toggle)
  const [jornadaVersao, setJornadaVersao] = useState<JornadaVersao>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('@octadesk-hub:jornada-versao');
      if (saved === 'CONSULTIVA' || saved === 'ARCADE_COMPLETO' || saved === 'FAST_TRACK') {
        return saved;
      }
    }
    return VERSAO_ATIVA;
  });


  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
      (window as any).exportLeads = () => {
        console.log(localStorage.getItem('octadesk_totem_leads'));
      };
    }
  }, []);

  // Estados do formulário de cadastro (Step 1)
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    email: "",
    telefone: "",
    cargo: "",
  });

  // Estados do Diagnóstico (Step 2)
  const [diagnosticoData, setDiagnosticoData] = useState({
    equipe: "",
    volume: "",
    canais: [] as string[]
  });

  // Estados do Quiz (Step 3)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasErroredOnCurrentQuestion, setHasErroredOnCurrentQuestion] = useState(false);
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);

  // DeepDive: Rastreamento de tempo de jornada e pontuação das ferramentas
  const [startTime, setStartTime] = useState<number | null>(null);
  const [quizToolScores, setQuizToolScores] = useState<ToolScores>({
    faq: 0,
    sales: 0,
    info: 0,
    cart: 0
  });
  const [hasClickedCurrentQuestion, setHasClickedCurrentQuestion] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string | string[]>>({});
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const [prejuizoOperacional, setPrejuizoOperacional] = useState<number>(0);

  // Estados do Polvo e Resultado
  const { state: polvoState, setState: setPolvoState, resetState: resetPolvoState } = usePolvo();
  const [computedResult, setComputedResult] = useState<{
    trilha: TrilhaResultado;
    score: number;
    diagnostico: {
      destino: string;
      focoProduto: string;
      mensagemInterface: string;
      brindeQualificado: boolean;
    };
    toolScores: ToolScores;
    prioridadeFerramenta: 'faq' | 'sales' | 'info' | 'cart';
    prejuizoOperacional: number;
  } | null>(null);

  const seedRandomResult = useCallback(() => {
    const scenarios = ['max', 'mod', 'critical'] as const;
    const chosenScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const randomScores = {
      faq: Math.floor(Math.random() * 6),
      sales: Math.floor(Math.random() * 6),
      info: Math.floor(Math.random() * 6),
      cart: Math.floor(Math.random() * 6)
    };
    const prioridade = obterFerramentaPrioritaria(randomScores);
    let prejuizo = 0;
    let finalScore = 5;
    let trilha: TrilhaResultado = 'Controle';
    if (chosenScenario === 'max') {
      prejuizo = 0;
      finalScore = 5;
      trilha = Math.random() > 0.5 ? 'Controle' : 'Enterprise';
    } else if (chosenScenario === 'mod') {
      prejuizo = Math.floor(Math.random() * 5) + 1;
      finalScore = Math.floor(Math.random() * 3) + 3;
      trilha = Math.random() > 0.5 ? 'Automacao' : 'Atendimento';
    } else {
      prejuizo = Math.floor(Math.random() * 10) + 6;
      finalScore = Math.floor(Math.random() * 3);
      trilha = Math.random() > 0.5 ? 'Controle' : 'Automacao';
    }
    let destino: 'TRANSBORDO_COMERCIAL_URGENTE' | 'TRILHA_AUTOMACAO_ECOMMERCE' | 'TRILHA_GESTAO_WHATSAPP' | 'TRIAGEM_PADRAO' = 'TRIAGEM_PADRAO';
    if (trilha === 'Enterprise') destino = 'TRANSBORDO_COMERCIAL_URGENTE';
    else if (trilha === 'Automacao') destino = 'TRILHA_AUTOMACAO_ECOMMERCE';
    else if (trilha === 'Atendimento') destino = 'TRILHA_GESTAO_WHATSAPP';
    const mockResult = {
      trilha,
      score: finalScore,
      diagnostico: {
        destino,
        focoProduto: TOOLS_CONFIG[prioridade].name,
        mensagemInterface: TOOLS_CONFIG[prioridade].defense,
        brindeQualificado: finalScore === 5
      },
      toolScores: randomScores,
      prioridadeFerramenta: prioridade,
      prejuizoOperacional: prejuizo
    };
    setComputedResult(mockResult);
    setPolvoState(`trilha_${trilha.toLowerCase()}` as PolvoState);
  }, [setPolvoState]);

  useEffect(() => {
    if (step !== 4) return;
    setProgress(0);
    const duration = 3000;
    const effectStartTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - effectStartTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);
    }, 16);
    const timer = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      if (!computedResult) {
        seedRandomResult();
      }
      setStep(5);
    }, duration);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [step, computedResult, seedRandomResult]);

  useEffect(() => {
    if (step === 5 && computedResult) {
      setPolvoState(`trilha_${computedResult.trilha.toLowerCase()}` as PolvoState);
    }
  }, [step, computedResult, setPolvoState]);

  const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDiagChange = useCallback((field: keyof typeof diagnosticoData, value: string) => {
    setDiagnosticoData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleCanal = useCallback((canal: string) => {
    setDiagnosticoData(prev => {
      const canais = prev.canais.includes(canal)
        ? prev.canais.filter(c => c !== canal)
        : [...prev.canais, canal];
      return { ...prev, canais };
    });
  }, []);

  const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isStep1Valid =
    formData.nome.trim().length >= 2 &&
    formData.empresa.trim().length >= 2 &&
    isEmailValid(formData.email) &&
    formData.telefone.trim().length >= 8 &&
    formData.cargo.trim().length >= 2;

  const isStep2Valid = 
    diagnosticoData.equipe !== "" && 
    diagnosticoData.volume !== "" && 
    diagnosticoData.canais.length > 0;

  const saveLeadDataAndTransition = useCallback(async () => {
    const finalScores = { ...quizToolScores };
    const prioridade = obterFerramentaPrioritaria(finalScores);
    const tempoJornadaSegundos = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    let finalEquipe = '';
    let finalVolume = '';
    let finalCanais: string[] = [];

    if (jornadaVersao === 'CONSULTIVA') {
      finalEquipe = diagnosticoData.equipe;
      finalVolume = diagnosticoData.volume;
      finalCanais = diagnosticoData.canais;
    } else {
      finalEquipe = '3 a 5';
      finalVolume = 'De 101 a 1000/mês';
      finalCanais = ['WhatsApp'];
    }

    const isMaisDe15 = finalEquipe === 'Mais de 15' || finalEquipe === '6 a 15';
    const isHighVolume = finalVolume === 'Mais de 1000' || finalVolume === '501 a 1000' || finalVolume === 'Mais de 1000/mês' || finalVolume === 'De 101 a 1000/mês';
    const hasComplexChannels = finalCanais.includes('E-mail') || finalCanais.includes('Telefone') || finalCanais.length >= 3;

    const tamanhoOp = (finalEquipe === 'Mais de 15' ? 'Mais de 100 colaboradores' : 
                       finalEquipe === '6 a 15' ? 'De 6 a 20 colaboradores' : 
                       'Ate 5 colaboradores') as TamanhoOperacao;

    const respostas: RespostasQuiz = {
      tamanhoOperacao: tamanhoOp,
      totalFerramentas: isMaisDe15 ? 'Mais de 10 ferramentas (Ecossistema complexo)' : isHighVolume ? 'De 5 a 10 ferramentas' : 'De 2 a 4 ferramentas',
      possuiCarrinhoAbandonado: isHighVolume || finalCanais.includes('WhatsApp'),
      possuiIaVendas: !finalCanais.includes('WhatsApp'), 
      possuiNotificacaoStatus: isHighVolume,
      possuiIaDuvidasStatus: false,
      possuiEmissaoNotas: isHighVolume,
      possuiHelpdeskSla: hasComplexChannels,
    };

    let trilha = calcularTrilhaOctadesk(respostas);
    if (jornadaVersao !== 'CONSULTIVA') {
      if (prejuizoOperacional === 0) {
        trilha = 'Controle';
      } else if (prioridade === 'sales' || prioridade === 'cart') {
        trilha = 'Automacao';
      } else if (prioridade === 'faq') {
        trilha = 'Atendimento';
      } else {
        trilha = 'Controle';
      }
    }

    setPolvoState('thinking');

    const isPotential = prejuizoOperacional > 4 || (jornadaVersao === 'CONSULTIVA' && (finalEquipe === '3 a 5' || finalEquipe === '6 a 15'));

    const novoLead: Lead & { prejuizo_operacional?: number } = {
      nome: formData.nome,
      empresa: formData.empresa,
      email: formData.email,
      contato: formData.telefone,
      tamanhoOperacao: finalEquipe,
      volumeVendasMes: finalVolume,
      canais: finalCanais,
      transbordo_urgente: isMaisDe15,
      score_quiz: score,
      capturado_via: 'Quiz DeepDive Tablet 2026',
      perfil_bifurcado: trilha,
      sincronizado: 0,
      criado_em: new Date().toISOString(),
      toolScores: finalScores,
      prioridade_ferramenta: prioridade,
      tempo_jornada_segundos: tempoJornadaSegundos,
      isPotentialLead: isPotential,
      prejuizo_operacional: prejuizoOperacional
    };

    try {
      await db.leads.add(novoLead);
    } catch (error) {
      console.error(error);
    }

    let destino: 'TRANSBORDO_COMERCIAL_URGENTE' | 'TRILHA_AUTOMACAO_ECOMMERCE' | 'TRILHA_GESTAO_WHATSAPP' | 'TRIAGEM_PADRAO' = 'TRIAGEM_PADRAO';
    if (trilha === 'Enterprise') destino = 'TRANSBORDO_COMERCIAL_URGENTE';
    else if (trilha === 'Automacao') destino = 'TRILHA_AUTOMACAO_ECOMMERCE';
    else if (trilha === 'Atendimento') destino = 'TRILHA_GESTAO_WHATSAPP';
    else if (trilha === 'Controle') destino = 'TRIAGEM_PADRAO';

    const diagnosticoResultado = {
      destino,
      focoProduto: TOOLS_CONFIG[prioridade].name,
      mensagemInterface: TOOLS_CONFIG[prioridade].defense,
      brindeQualificado: score === 5
    };

    LocalStorageManager.salvarLeadLocal({
      nome: formData.nome,
      empresa: formData.empresa,
      email: formData.email,
      telefone: formData.telefone,
      tamanhoOperacao: finalEquipe,
      volumeVendasMes: finalVolume,
      canais: finalCanais,
      transbordoUrgente: isMaisDe15,
      scoreQuiz: score,
      toolScores: finalScores,
      prioridadeFerramenta: prioridade,
      tempoJornadaSegundos: tempoJornadaSegundos,
      isPotentialLead: isPotential,
      prejuizoOperacional: prejuizoOperacional
    }, diagnosticoResultado);

    setComputedResult({
      trilha,
      score,
      diagnostico: diagnosticoResultado,
      toolScores: finalScores,
      prioridadeFerramenta: prioridade,
      prejuizoOperacional
    });

    setProgress(0);
    setStep(4);
  }, [formData, score, quizToolScores, startTime, setPolvoState, prejuizoOperacional, jornadaVersao, diagnosticoData]);

  // Processa a seleção de opções no quiz com feedback visual reativo
  const handleSelectQuizOption = useCallback((option: { 
    text: string; 
    isCorrect: boolean; 
    feedback: string;
    scores?: { faq?: number; sales?: number; info?: number; cart?: number };
    prejuizo?: number;
  }) => {
    if (selectedOptionText !== null && option.text !== selectedOptionText) {
      const currentQuestion = quizJourneyConfig.questions[currentQuestionIndex];
      const isCorrectSelected = currentQuestion.options.find(o => o.text === selectedOptionText)?.isCorrect;
      if (isCorrectSelected) return;
    }

    // Registra a pontuação apenas na primeira resposta a esta pergunta
    if (!hasClickedCurrentQuestion) {
      setHasClickedCurrentQuestion(true);
      setQuizAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.text }));
      
      // Acumula Prejuízo Operacional
      if (option.prejuizo !== undefined) {
        setPrejuizoOperacional((prev) => prev + option.prejuizo!);
      }

      setQuizToolScores((prev) => {
        const next = { ...prev };
        if (option.scores) {
          if (option.scores.faq) next.faq += option.scores.faq;
          if (option.scores.sales) next.sales += option.scores.sales;
          if (option.scores.info) next.info += option.scores.info;
          if (option.scores.cart) next.cart += option.scores.cart;
        }
        return next;
      });
    }

    setSelectedOptionText(option.text);

    if (option.isCorrect) {
      if (!hasErroredOnCurrentQuestion) {
        setScore((prev) => prev + 1);
      }
      setTimeout(() => {
        setSelectedOptionText(null);
        setHasErroredOnCurrentQuestion(false);
        setHasClickedCurrentQuestion(false); // Reset para a próxima pergunta
        if (currentQuestionIndex < quizJourneyConfig.questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          saveLeadDataAndTransition();
        }
      }, 600);
    } else {
      setHasErroredOnCurrentQuestion(true);
    }
  }, [selectedOptionText, currentQuestionIndex, hasClickedCurrentQuestion, hasErroredOnCurrentQuestion, saveLeadDataAndTransition]);

  const handleReset = useCallback(() => {
    // Reset limpo do estado do Totem sem forçar reload da página local
    setStep(0);
    setFormData({
      nome: "",
      empresa: "",
      email: "",
      telefone: "",
      cargo: "",
    });
    setDiagnosticoData({
      equipe: "",
      volume: "",
      canais: []
    });
    setCurrentQuestionIndex(0);
    setScore(0);
    setPrejuizoOperacional(0);
    setHasErroredOnCurrentQuestion(false);
    setSelectedOptionText(null);
    setComputedResult(null);
    setProgress(0);
    setStartTime(null);
    setQuizToolScores({ faq: 0, sales: 0, info: 0, cart: 0 });
    setHasClickedCurrentQuestion(false);
    setQuizAnswers({});
    setSelectedChannels([]);
    resetPolvoState();
  }, [resetPolvoState]);

  const getMascotState = useCallback((): 'floating' | 'thinking' | 'success' => {
    if (step === 4) return 'thinking';
    if (step === 5) return 'success';
    return 'floating';
  }, [step]);

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" as const } }
  };

  const currentQuestion = quizJourneyConfig.questions[currentQuestionIndex];

  return (
    <main className="relative min-h-screen md:h-screen w-full flex flex-col justify-center items-center px-4 md:px-6 bg-[#2D354D] md:overflow-hidden select-none">
      
      <header className="absolute top-2 md:top-4 left-0 right-0 mx-auto w-full max-w-4xl flex justify-between items-center z-30 px-4">
        <div className="flex items-center">
          <Image 
            src="/assets/octadesk-logo-white.svg" 
            alt="Octadesk" 
            width={120} 
            height={26} 
            className="h-6 w-auto select-none"
            priority 
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/10 bg-[#1F2538]/80 text-zinc-300 shadow-sm">
            Fórum E-commerce Brasil 2026
          </span>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-2 rounded-lg border border-white/10 bg-[#1F2538]/80 text-zinc-300 hover:text-white hover:bg-[#272F47] transition-all cursor-pointer text-lg shadow-sm flex items-center justify-center w-10 h-10"
            title="Painel de Controle"
          >
            📊
          </button>
        </div>
      </header>

      <div className="w-full max-w-4xl bg-[#1F2538] border border-[#2d62ff]/30 rounded-3xl pt-2.5 pb-4 px-4 md:pt-3 md:pb-4.5 md:px-5 shadow-xl flex flex-col justify-between z-10 relative overflow-y-auto max-h-[calc(100vh-100px)] md:max-h-[calc(100vh-140px)] transition-all duration-350 text-white backdrop-blur-xl">
        
        {step < 4 && (
          <div className="mb-2 flex justify-center">
            <Image 
              src="/assets/octadesk-octopus-white.svg" 
              alt="Octadesk Icon" 
              width={48} 
              height={48} 
              className={`${step > 0 ? 'h-8 w-8' : 'h-12 w-12'} w-auto select-none`}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="recepcao"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center space-y-3 py-1 flex flex-col items-center"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#2d62ff] font-black block">
                  Diagnóstico Operacional Executivo
                </span>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-white leading-tight max-w-2xl mx-auto">
                  Sua Operação está no topo ou perdendo dinheiro?
                </h1>
                <p className="text-zinc-300 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
                  Descubra o nível de eficiência e automação dos seus canais em menos de 2 minutos e obtenha a prioridade tática para seu negócio.
                </p>
              </div>

              <div className="w-full max-w-md pt-3.5 pb-1 mb-6">
                <button
                  onClick={() => { setStep(1); setStartTime(Date.now()); }}
                  className="w-full py-3.5 text-base font-black rounded-xl tracking-wide uppercase bg-gradient-to-r from-[#00D1A0] to-[#00B58A] text-[#1F2538] hover:from-[#00E5BC] hover:to-[#00D1A0] active:scale-[0.98] shadow-lg shadow-green-900/10 transition-all duration-150 cursor-pointer block text-center"
                >
                  Iniciar DeepDive
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="cadastro"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-3"
            >
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2d62ff] font-extrabold">
                  Etapa 1: Acolhimento
                </span>
                <h1 className="text-lg md:text-xl font-extrabold text-white leading-tight">
                  Bem-vindo ao DeepDive. Como podemos te chamar?
                </h1>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">Seu Nome *</label>
                    <input
                      type="text"
                      placeholder="Ex: Reinaldo Alves"
                      autoComplete="off"
                      className="w-full p-2.5 rounded-xl bg-[#1F2538]/70 backdrop-blur-md border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">WhatsApp Corporativo *</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      autoComplete="off"
                      className="w-full p-2.5 rounded-xl bg-[#1F2538]/70 backdrop-blur-md border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">E-mail Corporativo *</label>
                  <input
                    type="email"
                    placeholder="Ex: pedro@empresa.com"
                    autoComplete="off"
                    className="w-full p-2.5 rounded-xl bg-[#1F2538]/70 backdrop-blur-md border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">Nome da Empresa *</label>
                    <input
                      type="text"
                      placeholder="Ex: Tech Co."
                      autoComplete="off"
                      className="w-full p-2.5 rounded-xl bg-[#1F2538]/70 backdrop-blur-md border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">Seu Cargo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Marketing, Diretoria ou Vendas"
                      autoComplete="off"
                      className="w-full p-2.5 rounded-xl bg-[#1F2538]/70 backdrop-blur-md border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange("cargo", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    try {
                      const saved = localStorage.getItem('octadesk_totem_leads');
                      const leads = saved ? JSON.parse(saved) : [];
                      const novoLead = {
                        nome: formData.nome,
                        whatsapp: formData.telefone,
                        email: formData.email,
                        empresa: formData.empresa,
                        cargo: formData.cargo,
                        data: new Date().toISOString()
                      };
                      leads.push(novoLead);
                      localStorage.setItem('octadesk_totem_leads', JSON.stringify(leads));
                    } catch (e) {
                      console.error(e);
                    }
                    if (jornadaVersao === 'CONSULTIVA') {
                      setStep(2);
                    } else {
                      setStep(3);
                    }
                  }}
                  disabled={!isStep1Valid}
                  className={`w-full py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${
                    isStep1Valid
                      ? "bg-gradient-to-r from-[#00D1A0] to-[#00B58A] text-[#1F2538] hover:from-[#00E5BC] hover:to-[#00D1A0] active:scale-[0.98] shadow-md shadow-green-900/10 cursor-pointer"
                      : "bg-[#252c3f] text-zinc-500 border border-zinc-700 cursor-not-allowed"
                  }`}
                >
                  Avançar
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="diagnostico"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-3"
            >
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2d62ff] font-extrabold">
                  Etapa 2: Diagnóstico
                </span>
                <h2 className="text-lg md:text-xl font-extrabold text-white leading-tight">
                  Como está estruturada a sua operação hoje?
                </h2>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold block">
                    Quantas mentes comandam o seu atendimento hoje?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Eu + 1', '3 a 5', '6 a 15', 'Mais de 15'].map((opt) => {
                      const isSelected = diagnosticoData.equipe === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleDiagChange('equipe', opt)}
                          className={`py-2 px-3 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-[#2d62ff] border-[#2d62ff] text-white font-bold shadow-md shadow-blue-500/10"
                              : "bg-[#1F2538] border-white/10 text-zinc-300 hover:bg-[#272F47]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold block">
                    Qual o volume mensal de vendas / notas fiscais?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {['Até 100/mês', 'De 101 a 1000/mês', 'Mais de 1000/mês'].map((opt) => {
                      const isSelected = diagnosticoData.volume === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleDiagChange('volume', opt)}
                          className={`py-2 px-3 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-[#2d62ff] border-[#2d62ff] text-white font-bold shadow-md shadow-blue-500/10"
                              : "bg-[#1F2538] border-white/10 text-zinc-300 hover:bg-[#272F47]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold block">
                    Por quais canais seus clientes chegam com mais frequência?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['WhatsApp', 'Instagram', 'E-mail', 'Chat no Site', 'Telefone'].map((opt) => {
                      const isSelected = diagnosticoData.canais.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleCanal(opt)}
                          className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected 
                              ? "bg-[#2d62ff] border-[#2d62ff] text-white font-bold shadow-md shadow-blue-500/10"
                              : "bg-[#1F2538] border-white/10 text-zinc-300 hover:bg-[#272F47]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-bold active:scale-[0.98] active:bg-[#1F2538] transition-all text-xs cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    if (jornadaVersao === 'CONSULTIVA') {
                      saveLeadDataAndTransition();
                    } else {
                      setStep(3);
                    }
                  }}
                  disabled={!isStep2Valid}
                  className={`px-8 py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${
                    isStep2Valid
                      ? "bg-gradient-to-r from-[#00D1A0] to-[#00B58A] text-[#1F2538] hover:from-[#00E5BC] hover:to-[#00D1A0] active:scale-[0.98] shadow-md shadow-green-900/10 cursor-pointer"
                      : "bg-[#252c3f] text-zinc-500 border border-zinc-700 cursor-not-allowed"
                  }`}
                >
                  {jornadaVersao === 'CONSULTIVA' ? 'Concluir Diagnóstico' : 'Iniciar Desafio'}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && currentQuestion && (
            <motion.div
              key={`quiz-question-${currentQuestionIndex}`}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-3 relative"
            >
              <style>{`
                @keyframes scanline {
                  0% { top: 0%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 100%; opacity: 0; }
                }
                .sonda-scanner {
                  position: absolute;
                  left: -20px;
                  right: -20px;
                  height: 2px;
                  background: linear-gradient(90deg, transparent, rgba(45, 98, 255, 0.2), transparent);
                  box-shadow: 0 0 12px rgba(45, 98, 255, 0.1);
                  animation: scanline 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                  pointer-events: none;
                  z-index: 0;
                }
              `}</style>
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl -mx-8 -my-8 px-8 py-8 z-0">
                <div className="sonda-scanner" />
              </div>

              {currentQuestionIndex === 0 && (
                <div className="pb-2 mb-2 border-b border-[#2d62ff]/20">
                  <h3 className="text-center font-bold text-[#2d62ff] tracking-wider text-xs">
                    &quot;Vamos avaliar as suas dores e mapear a inteligência do seu negócio.&quot;
                  </h3>
                </div>
              )}

              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#2d62ff] font-bold block">
                  Desafio {currentQuestionIndex + 1} de {quizJourneyConfig.questions.length}
                </span>
                <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold text-white leading-snug">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-2 relative z-10">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOptionText === option.text;
                  const isIncorrect = isSelected && !option.isCorrect;
                  const isCorrect = isSelected && option.isCorrect;

                  let pillStyle = "border-white/10 bg-[#1F2538] text-white hover:bg-[#272F47] hover:border-white/20 active:scale-[0.98] transition-all duration-150 shadow-sm";
                  if (isSelected) {
                    if (isCorrect) {
                      pillStyle = "border-[#114e0b] bg-[#cef5ca] text-[#114e0b] shadow-[0_0_15px_rgba(206,245,202,0.15)]";
                    } else {
                      pillStyle = "border-red-500 bg-[#f8e4e4] text-[#7f1d1d]";
                    }
                  }

                  return (
                    <div key={idx} className="flex flex-col gap-1.5">
                       <button
                        type="button"
                        onClick={() => handleSelectQuizOption(option)}
                        className={`w-full text-left py-3 px-4 rounded-xl border transition-all duration-200 cursor-pointer ${pillStyle}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs md:text-sm pr-4">{option.text}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected && isCorrect ? "bg-[#114e0b] border-transparent text-[#cef5ca]" :
                            isSelected && isIncorrect ? "bg-[#7f1d1d] border-transparent text-[#f8e4e4]" :
                            "border-zinc-500 bg-transparent"
                          }`}>
                            {isSelected && (isCorrect || isIncorrect) && (
                              <span className="text-[10px] font-black">{isCorrect ? "✓" : "✗"}</span>
                            )}
                          </div>
                        </div>
                      </button>
                      {isIncorrect && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-[#f8e4e4] border border-red-500/20 text-[#7f1d1d] text-xs mt-0.5 leading-relaxed shadow-sm"
                        >
                          <strong>Explicação:</strong> {option.feedback}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#2d62ff]/10 relative z-10 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex((prev) => prev - 1);
                      setSelectedOptionText(null);
                      setHasErroredOnCurrentQuestion(false);
                      setHasClickedCurrentQuestion(false);
                    } else {
                      setStep(1);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 font-bold active:scale-[0.98] active:bg-[#1F2538] transition-all text-xs cursor-pointer"
                >
                  Voltar
                </button>
                
                <div className="text-xs text-[#2d62ff] font-mono font-bold">
                  Pontos: {score}/{quizJourneyConfig.questions.length}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="loading"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center py-8 space-y-6 flex flex-col items-center justify-center min-h-[280px]"
            >
              <div className="flex items-center justify-center mb-2">
                <Image 
                  src="/assets/octadesk-octopus-white.svg" 
                  alt="Octadesk Octopus" 
                  width={40} 
                  height={40} 
                  className="h-10 w-10 mx-auto select-none animate-pulse"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Mergulhando nos Dados...
                </h3>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                  Analisando métricas de eficiência da sua operação...
                </p>
              </div>

              <div className="w-full max-w-xs bg-[#1F2538] rounded-full h-2 border border-white/10 overflow-hidden relative shadow-inner">
                <motion.div
                  className="h-full bg-[#2d62ff]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono text-[10px] text-[#2d62ff] tracking-widest uppercase font-bold">
                {Math.round(progress)}% Processado
              </span>
            </motion.div>
          )}

          {step === 5 && computedResult && (() => {
            const isMax = computedResult.prejuizoOperacional === 0;
            const isMod = computedResult.prejuizoOperacional > 0 && computedResult.score >= 3;
            
            let title = "";
            let message = "";
            let recommendation = "";
            let ctaText = "";
            let titleClass = "";
            let badgeClass = "";
            
            if (isMax) {
              title = `🏆 PARABÉNS, ${(formData.nome || "VISITANTE").toUpperCase()}!`;
              message = `A ${formData.empresa || "sua empresa"} opera no topo do mercado com R$ 0 de prejuízo. Que tal escalar esses resultados com uma parceria estratégica exclusiva?`;
              recommendation = "Parceria Estratégica com a Octadesk";
              ctaText = "Firmar Parceria com Octadesk 🚀";
              titleClass = "bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent";
              badgeClass = "text-yellow-400 bg-yellow-400/10 border-yellow-400/25";
            } else if (isMod) {
              title = "DIAGNÓSTICO DE EFICIÊNCIA CONCLUÍDO";
              message = `${formData.nome || "Visitante"}, identificamos pontos cegos na ${formData.empresa || "sua empresa"}. Vamos otimizar sua margem?`;
              recommendation = TOOLS_CONFIG[computedResult.prioridadeFerramenta].name;
              ctaText = "Otimizar Canais Operacionais 📈";
              titleClass = "text-white";
              badgeClass = "text-[#00D1A0] bg-[#00D1A0]/10 border-[#00D1A0]/20";
            } else {
              title = "DIAGNÓSTICO DE EFICIÊNCIA CONCLUÍDO";
              message = `${formData.nome || "Visitante"}, a ${formData.empresa || "sua empresa"} está deixando dinheiro na mesa. Ative o plano de resgate imediato.`;
              recommendation = TOOLS_CONFIG[computedResult.prioridadeFerramenta].name;
              ctaText = "Iniciar Plano de Resgate 🚨";
              titleClass = "text-red-400";
              badgeClass = "text-red-400 bg-red-400/10 border-red-400/20";
            }

            return (
              <motion.div
                key="success"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.4,
                      staggerChildren: 0.12,
                      delayChildren: 0.1
                    }
                  },
                  exit: { opacity: 0, y: -15, transition: { duration: 0.25 } }
                }}
                className="text-center space-y-2 py-0.5 flex flex-col items-center w-full max-w-2xl mx-auto"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: -15 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                  }}
                  className="space-y-1 flex flex-col items-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Image
                      src="/assets/octadesk-octopus-white.svg"
                      alt="Octadesk"
                      width={40}
                      height={40}
                      className="h-10 w-10 mx-auto select-none animate-pulse"
                    />
                  </div>
                  <h1 className={`text-lg md:text-xl font-black tracking-tight leading-tight uppercase ${titleClass}`}>
                    {title}
                  </h1>
                  {!isMax && (
                    <>
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Recomendação Estratégica
                      </p>
                      <h2 className={`text-xs md:text-sm font-extrabold tracking-tight uppercase px-3 py-1 rounded-full border shadow-sm ${badgeClass}`}>
                        {recommendation}
                      </h2>
                    </>
                  )}
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.97 },
                    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
                  }}
                  className="w-full grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <div className={`bg-[#1F2538]/60 border rounded-2xl py-2.5 px-4 flex flex-col justify-between items-center space-y-1 text-center shadow-lg relative overflow-hidden backdrop-blur-md max-h-[130px] ${isMax ? 'border-emerald-500/25' : 'border-red-500/25'}`}>
                    <div className={`absolute top-0 left-0 w-full h-[3px] ${isMax ? 'bg-emerald-500/50' : 'bg-red-500/50'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isMax ? 'text-emerald-400' : 'text-red-400'}`}>Vazamento Financeiro</span>
                    <span className={`text-xl md:text-2xl font-black tracking-tight my-0.5 ${isMax ? 'text-emerald-400' : 'text-red-500'}`}>
                      R$ {((computedResult.prejuizoOperacional || 0) * 1250).toLocaleString('pt-BR')}/mês
                    </span>
                    <span className="text-[10px] text-zinc-400 leading-normal">desperdício operacional acumulado</span>
                    <span className={`text-[10px] font-black px-3 py-0.5 rounded-full uppercase border mt-1 ${
                      isMax
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : computedResult.prejuizoOperacional > 10
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : computedResult.prejuizoOperacional > 5
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-green-500/20 text-green-400 border-green-500/30"
                    }`}>
                      Risco {isMax ? 'Zero' : computedResult.prejuizoOperacional > 10 ? 'Crítico' : computedResult.prejuizoOperacional > 5 ? 'Médio' : 'Baixo'}
                    </span>
                  </div>

                  <div className="bg-[#1F2538]/60 border border-white/10 rounded-2xl py-2.5 px-4 flex flex-col justify-between space-y-2 shadow-lg backdrop-blur-md max-h-[130px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 text-center">Desempenho por Pilar</span>
                    <div className="space-y-1 text-left">
                      {[
                        { label: "Atendimento (FAQ)", key: 'faq' },
                        { label: "Automação de Vendas", key: 'sales' },
                        { label: "Status de Pedidos", key: 'info' },
                        { label: "Carrinho Abandonado", key: 'cart' },
                      ].map((item) => {
                        const scoreVal = computedResult.toolScores[item.key as keyof typeof computedResult.toolScores] || 0;
                        const isWinner = computedResult.prioridadeFerramenta === item.key;
                        return (
                          <div key={item.key} className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className={isWinner ? "text-[#00D1A0]" : "text-zinc-300"}>
                                {isWinner ? "★ " : ""}{item.label}
                              </span>
                              <span className="font-mono text-zinc-400">{scoreVal} pts</span>
                            </div>
                            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((scoreVal / 6) * 100, 100)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${isWinner ? 'bg-[#00D1A0]' : 'bg-blue-500/50'}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

              {!isMax && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                  }}
                  className="w-full max-w-xl bg-[#1F2538]/60 border border-white/10 rounded-2xl py-2 px-4 shadow-xl text-center backdrop-blur-md relative"
                >
                  <p className="text-xs md:text-sm text-zinc-200 leading-relaxed font-semibold">
                    {message}
                  </p>
                </motion.div>
              )}

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                }}
                className="w-full max-w-md pt-0.5"
              >
                <button
                  onClick={handleReset}
                  className="w-full py-3 text-xs md:text-sm font-black rounded-xl tracking-wider uppercase bg-gradient-to-r from-[#00D1A0] to-[#00B58A] text-[#1F2538] hover:from-[#00E5BC] hover:to-[#00D1A0] active:scale-[0.96] shadow-xl shadow-green-950/20 hover:shadow-green-900/30 transition-all duration-200 cursor-pointer block text-center"
                >
                  {ctaText}
                </button>
              </motion.div>
            </motion.div>
            );
          })()}
        </AnimatePresence>

        <div className="mt-3 pt-2 border-t border-white/5 w-full flex flex-wrap justify-center gap-1 z-20">
           <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 block w-full text-center mb-0.5">
             Depuração: Navegação Livre entre Telas
           </span>
           {[
             { label: "0: Recepção", val: 0 },
             { label: "1: Cadastro", val: 1 },
             { label: "2: Diagnóstico", val: 2 },
             { label: "3: Quiz", val: 3 },
             { label: "4: Processando", val: 4 },
             { label: "5: Veredito", val: 5 }
           ].map((item) => (
             <button
               key={item.val}
               type="button"
                onClick={() => {
                  if (item.val === 5) {
                    seedRandomResult();
                  } else if (item.val === 4) {
                    setComputedResult(null);
                  }
                  setStep(item.val);
                }}
               className={`py-1 px-2 rounded text-[9px] font-bold transition-all cursor-pointer ${
                 step === item.val
                   ? "bg-[#00D1A0] text-[#1F2538] shadow-sm"
                   : "bg-[#1F2538] text-zinc-300 hover:bg-[#272F47] border border-zinc-700"
               }`}
             >
               {item.label}
             </button>
           ))}
         </div>

      </div>

      <footer className="absolute bottom-2 left-0 right-0 mx-auto w-full text-center z-30">
      </footer>

      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      
    </main>
  );
}
