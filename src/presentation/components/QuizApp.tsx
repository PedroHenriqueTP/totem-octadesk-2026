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
  const [isVersaoMenuOpen, setIsVersaoMenuOpen] = useState(false);

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

  // Efeito de animação de progresso do loading (Step 4)
  useEffect(() => {
    if (step !== 4) return;
    const effectStartTime = Date.now();
    const duration = 2000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - effectStartTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        setStep(5); // Vai para o resultado final
        if (computedResult) {
          setPolvoState(`trilha_${computedResult.trilha.toLowerCase()}` as PolvoState);
        }
      }
    }, 30);
    return () => clearInterval(interval);
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
    <main className="min-h-screen md:h-screen w-full flex flex-col justify-between items-center pt-2 pb-4 px-4 md:px-6 bg-[#2D354D] md:overflow-hidden select-none">
      
      <header className="w-full max-w-4xl flex justify-between items-center z-10 pt-6 md:pt-8 mb-1.5 px-4">
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
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/10 bg-[#1F2538]/80 text-zinc-300 shadow-sm">
          Fórum E-commerce Brasil 2026
        </span>
      </header>

      <div className="w-full max-w-4xl bg-[#1F2538] border border-[#2d62ff]/30 rounded-3xl pt-3 pb-5 px-4 md:pt-4 md:pb-6 md:px-5 shadow-xl flex flex-col justify-between z-10 relative overflow-hidden shrink-0 h-fit transition-all duration-350 text-white backdrop-blur-xl">
        
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
                      placeholder="Ex: Pedro Silva"
                      className="w-full p-2.5 rounded-xl bg-[#1F2538] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">WhatsApp Corporativo *</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full p-2.5 rounded-xl bg-[#1F2538] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
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
                    className="w-full p-2.5 rounded-xl bg-[#1F2538] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
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
                      className="w-full p-2.5 rounded-xl bg-[#1F2538] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">Seu Cargo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Diretor de Operações"
                      className="w-full p-2.5 rounded-xl bg-[#1F2538] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#2d62ff]/30 focus:border-[#2d62ff] transition-all"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange("cargo", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
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
              className="text-center py-10 space-y-8 flex flex-col items-center justify-center"
            >
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-[#2d62ff] animate-pulse">
                  Mergulhando nos Dados...
                </h2>
                <p className="text-base text-zinc-300 max-w-sm mx-auto leading-relaxed">
                  Processando suas respostas e formulando o diagnóstico de inteligência operacional...
                </p>
              </div>

              <div className="w-full max-w-md bg-[#1F2538] rounded-full h-4 border border-white/10 overflow-hidden relative shadow-inner">
                <motion.div
                  className="h-full bg-[#2d62ff]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono text-xs text-[#2d62ff] tracking-widest uppercase font-bold">
                {Math.round(progress)}% DIAGNOSTICADO
              </span>
            </motion.div>
          )}

          {step === 5 && computedResult && (
            <motion.div
              key="success"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center space-y-4 py-1 flex flex-col items-center"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] px-3.5 py-1.5 rounded-full border font-bold text-[#2d62ff] border-[#2d62ff]/30 bg-[#1F2538]">
                  Diagnóstico Concluído
                </span>
                <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold text-white leading-tight">
                  SEU DIAGNÓSTICO DE EFICIÊNCIA OPERACIONAL ESTÁ PRONTO!
                </h2>
                <p className="text-zinc-300 text-xs max-w-md mx-auto">
                  Com base no perfil da sua equipe e nas respostas do quiz, o motor identificou a sua prioridade técnica de automação.
                </p>
              </div>

              <div 
                className="p-3 md:p-4 rounded-2xl bg-[#1F2538] border border-[#2d62ff]/20 w-full max-w-2xl flex flex-col items-center space-y-2.5 shadow-2xl relative"
                style={{ 
                  boxShadow: '0 10px 40px rgba(45, 98, 255, 0.05)'
                }}
              >
                <div className="scale-100 mb-1">
                  <Image 
                    src="/assets/octadesk-octopus-white.svg" 
                    alt="Octadesk Icon" 
                    width={40} 
                    height={40} 
                    className="h-10 w-10 select-none"
                  />
                </div>
                
                <div className="space-y-1 text-center">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#2d62ff] font-bold">prioridade identificada</span>
                  <h3 className="text-base md:text-lg font-extrabold text-[#2d62ff] tracking-tight">
                    {TOOLS_CONFIG[computedResult.prioridadeFerramenta].name}
                  </h3>
                </div>

                <div className="p-3 rounded-xl bg-[#272F47] border border-white/5 text-zinc-200 text-xs leading-relaxed max-w-lg text-center font-medium">
                  {computedResult.diagnostico.mensagemInterface}
                </div>

                <div className="w-full max-w-lg bg-[#f8e4e4] border border-red-500/20 py-1.5 px-3 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-[#7f1d1d] block">Prejuízo Operacional Estimado</span>
                    <span className="text-base md:text-lg font-black text-[#7f1d1d]">
                      R$ {((computedResult.prejuizoOperacional || 0) * 1250).toLocaleString('pt-BR')}/mês
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-[#7f1d1d] block font-semibold">Nível de Vazamento</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                      computedResult.prejuizoOperacional > 10 
                        ? "bg-[#f8e4e4] text-[#7f1d1d] border-red-400/30" 
                        : computedResult.prejuizoOperacional > 5 
                          ? "bg-[#fcf8d8] text-[#5e5515] border-yellow-400/30" 
                          : "bg-[#cef5ca] text-[#114e0b] border-green-400/30"
                    }`}>
                      {computedResult.prejuizoOperacional > 10 ? 'Crítico' : computedResult.prejuizoOperacional > 5 ? 'Médio' : 'Baixo'}
                    </span>
                  </div>
                </div>

                <div className="w-full max-w-lg border-t border-white/5 pt-2 text-left space-y-1">
                  <h4 className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 font-bold text-center">Pontuação por Pilar:</h4>
                  <div className="flex flex-row flex-wrap justify-center gap-x-4 gap-y-1 text-[10px]">
                    {[
                      { label: "FAQ", val: computedResult.toolScores.faq, key: 'faq' },
                      { label: "Vendas", val: computedResult.toolScores.sales, key: 'sales' },
                      { label: "Notificação", val: computedResult.toolScores.info, key: 'info' },
                      { label: "Carrinho", val: computedResult.toolScores.cart, key: 'cart' },
                    ].map((item) => {
                      const isWinner = computedResult.prioridadeFerramenta === item.key;
                      return (
                        <span 
                          key={item.key} 
                          className={`font-semibold ${isWinner ? 'text-[#00D1A0] font-black' : 'text-zinc-400'}`}
                        >
                          {item.label}: <span className="font-mono">{item.val} pts</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {(computedResult.prioridadeFerramenta === 'sales' || computedResult.prioridadeFerramenta === 'cart' || computedResult.prioridadeFerramenta === 'faq') && (
                  <div className="w-full max-w-lg border-t border-white/5 pt-2.5 text-left space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white font-extrabold flex items-center gap-1">
                        ⚡ Solução Recomendada de I.A.
                      </span>
                      <span className="text-[9px] bg-[#2d62ff]/20 text-[#2d62ff] border border-[#2d62ff]/30 font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
                        Imediato
                      </span>
                    </div>
                    
                    {computedResult.prioridadeFerramenta === 'sales' ? (
                      <div className="p-2.5 rounded-xl border border-white/10 bg-[#272F47]/40 flex flex-col gap-1 shadow-sm relative overflow-hidden">
                        <h5 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                          🤖 Agente de I.A. para Vendas Octadesk
                        </h5>
                        <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                          Qualifica leads, atende a intenções de compra e fecha vendas no WhatsApp e Instagram 24/7, repassando contatos quentes ao time.
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-bold text-[#2d62ff] pt-1.5 border-t border-white/5 mt-0.5">
                          <span>🚀 Tempo de Resposta: -95%</span>
                          <span>📈 Conversão Média: +30%</span>
                        </div>
                      </div>
                    ) : computedResult.prioridadeFerramenta === 'cart' ? (
                      <div className="p-2.5 rounded-xl border border-white/10 bg-[#272F47]/40 flex flex-col gap-1 shadow-sm relative overflow-hidden">
                        <h5 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                          🛒 Recuperador de Carrinho Abandonado via WhatsApp
                        </h5>
                        <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                          Detecta abandono de checkout e dispara fluxos conversacionais automáticos no WhatsApp com cupons de resgate.
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-bold text-[#2d62ff] pt-1.5 border-t border-white/5 mt-0.5">
                          <span>💰 Recuperação Média: 15% a 25%</span>
                          <span>⏱️ Resgate: Tempo Real</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl border border-white/10 bg-[#272F47]/40 flex flex-col gap-1 shadow-sm relative overflow-hidden">
                        <h5 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                          🤖 Agente de I.A. para Dúvidas Frequentes Octadesk
                        </h5>
                        <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                          Responde dúvidas sobre manuais, fretes e políticas de forma instantânea e natural no WhatsApp e chat 24/7.
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-bold text-[#2d62ff] pt-1.5 border-t border-white/5 mt-0.5">
                          <span>🚀 Redução de FAQ: -80%</span>
                          <span>⏱️ Resposta: Instantânea</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="w-full max-w-lg pt-3">
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 text-xs font-black rounded-xl tracking-wide uppercase bg-gradient-to-r from-[#00D1A0] to-[#00B58A] text-[#1F2538] hover:from-[#00E5BC] hover:to-[#00D1A0] active:scale-[0.98] shadow-lg shadow-green-900/10 transition-all duration-150 cursor-pointer block text-center"
                  >
                    Finalizar Diagnóstico
                  </button>
                </div>
              </div>
            </motion.div>
          )}
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
                 if (item.val === 5 && !computedResult) {
                   const dummyScores = { faq: 5, sales: 4, info: 3, cart: 2 };
                   setComputedResult({
                     trilha: 'Automacao',
                     score: 5,
                     diagnostico: {
                       destino: 'TRILHA_AUTOMACAO_ECOMMERCE',
                       focoProduto: TOOLS_CONFIG.faq.name,
                       mensagemInterface: TOOLS_CONFIG.faq.defense,
                       brindeQualificado: true
                     },
                     toolScores: dummyScores,
                     prioridadeFerramenta: 'faq',
                     prejuizoOperacional: 12
                   });
                   setPolvoState('trilha_automacao');
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

      <footer className="mt-3 mb-2 pb-2 text-center z-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="px-3 py-1.5 text-[10px] font-mono border border-transparent rounded-lg transition-colors cursor-pointer uppercase tracking-wider text-slate-400 hover:text-white"
          >
            [ Painel de Controle ]
          </button>
          
          <button
            onClick={() => setIsVersaoMenuOpen(prev => !prev)}
            className="px-3 py-1.5 text-[10px] font-mono border border-transparent rounded-lg transition-colors cursor-pointer uppercase tracking-wider text-slate-400 hover:text-white flex items-center gap-1"
          >
            ⚙️ <span className="underline decoration-dotted">{jornadaVersao === 'CONSULTIVA' ? 'Modo Consultivo' : jornadaVersao === 'FAST_TRACK' ? 'Modo Fast Track' : 'Modo Arcade'}</span>
          </button>
        </div>

        {isVersaoMenuOpen && (
          <div className="p-4 bg-[#1F2538] border border-[#2d62ff]/20 rounded-2xl shadow-2xl flex flex-col gap-2 w-64 backdrop-blur-md relative z-50 text-white">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#2d62ff] mb-1">Selecione o Modo da Jornada</span>
            {(['CONSULTIVA', 'ARCADE_COMPLETO', 'FAST_TRACK'] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setJornadaVersao(v);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('@octadesk-hub:jornada-versao', v);
                  }
                  setIsVersaoMenuOpen(false);
                }}
                className={`py-2 px-3 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                  jornadaVersao === v 
                    ? "bg-[#2d62ff]/10 border border-[#2d62ff] text-[#2d62ff]" 
                    : "bg-[#1F2538] text-zinc-300 hover:bg-[#272F47] border border-transparent"
                }`}
              >
                {v === 'CONSULTIVA' ? '🟢 Modo Consultivo (Vendas)' : 
                 v === 'ARCADE_COMPLETO' ? '🔵 Modo Arcade (Completo)' : 
                 '🟠 Modo Fast Track (Volume)'}
              </button>
            ))}
          </div>
        )}
      </footer>

      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      
    </main>
  );
}
