"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OctoMascot } from './OctoMascot';
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

  // Salva os dados no IndexedDB e no LocalStorage
  const saveLeadDataAndTransition = useCallback(async () => {
    // Calcula as pontuações finais
    const finalScores = { ...quizToolScores };
    const prioridade = obterFerramentaPrioritaria(finalScores);
    const tempoJornadaSegundos = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    const ans1 = (quizAnswers[1] as string) || '';
    const ans2 = (quizAnswers[2] as string) || '';
    const ans3 = (quizAnswers[3] as string[]) || [];
    const ans4 = (quizAnswers[4] as string) || '';

    const finalEquipe = ans1 || '2 a 5';
    const finalVolume = ans2 || 'Até 100';
    const finalCanais = ans3.length > 0 ? ans3 : ['WhatsApp'];

    const isMaisDe15 = finalEquipe === 'Mais de 15' || finalEquipe === '6 a 15';
    const isHighVolume = finalVolume === 'Mais de 1000' || finalVolume === '501 a 1000';
    const hasComplexChannels = finalCanais.includes('E-mail') || finalCanais.includes('Telefone') || finalCanais.length >= 3;

    const tamanhoOp = (finalEquipe === 'Mais de 15' ? 'Mais de 100 colaboradores' : 
                       finalEquipe === '6 a 15' ? 'De 6 a 20 colaboradores' : 
                       'Ate 5 colaboradores') as TamanhoOperacao;

    // Mapeamento dinâmico dos dados para as propriedades da interface RespostasQuiz
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

    const trilha = calcularTrilhaOctadesk(respostas);
    setPolvoState('thinking');

    // Lógica MQL: 4 fatores críticos
    const funcionariosValidos = finalEquipe === "1 (Eu sozinho)" || finalEquipe === "2 a 5";
    const volumeValido = finalVolume === "101 a 500" || finalVolume === "501 a 1000" || finalVolume === "Mais de 1000";
    const automacaoValida = ans4 === "100% Manual";
    const isPotential = funcionariosValidos && volumeValido && automacaoValida;

    // Payload final enviado de forma limpa para o db.leads (Dexie/IndexedDB)
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
      console.error("Erro ao salvar no Dexie IndexedDB:", error);
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

    // Salvar no LocalStorage para redundância offline
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

    setProgress(0); // Reseta progresso antes de entrar no efeito de contagem
    setStep(4); // Transiciona para o loading
  }, [formData, score, quizToolScores, startTime, quizAnswers, setPolvoState, prejuizoOperacional]);

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
    <main className="min-h-screen w-full flex flex-col justify-between items-center py-8 px-4 md:px-8 bg-[#FFFFFF]">
      
      <header className="w-full max-w-5xl flex justify-between items-center z-10 mb-8 px-4">
        <div className="flex items-center gap-3">
          {/* Isotipo Squircle Oficial */}
          {/* Mascote DeepDive Oficial com Headset (image_0.png) */}
          <svg className="w-9 h-9 flex-shrink-0" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="octaBrandGradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D1A0" />
                <stop offset="100%" stopColor="#00E5FF" />
              </linearGradient>
            </defs>
            <rect x="30" y="30" width="180" height="180" rx="44" fill="#001B3D" stroke="rgba(0, 229, 255, 0.08)" strokeWidth="1" />
            <path 
              d="M 120,65 C 147.6,65 170,87.4 170,115 C 170,142.6 147.6,165 120,165 C 111,165 102.5,162.7 95,158.5 L 75,168 L 81,148 C 71,139.5 65,128 65,115 C 65,87.4 87.4,65 120,65 Z" 
              fill="url(#octaBrandGradHeader)" 
            />
            <circle cx="103" cy="110" r="4.5" fill="#001B3D" />
            <circle cx="137" cy="110" r="4.5" fill="#001B3D" />
            <path d="M 108 126 Q 120 135, 132 126" stroke="#001B3D" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <span className="font-extrabold tracking-tight text-xl lowercase text-[#001B3D]">
            octadesk <span className="font-light text-[#00D1A0]">deepdive</span>
          </span>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full border backdrop-blur-sm text-[#001B3D] border-zinc-300 bg-white/90 shadow-sm">
          Fórum E-commerce Brasil 2026
        </span>
      </header>

      {/* Contêiner Principal Otimizado para Tablet & Desktop (w-full max-w-5xl com flex-col justify-between) */}
      <div className="w-full max-w-5xl bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col justify-between z-10 relative overflow-hidden transition-all duration-350 text-[#001B3D] backdrop-blur-xl">
        
        {/* Renderiza o mascote no topo nas etapas de 1 a 3 */}
        {step < 4 && (
          <div className="mb-8 flex justify-center">
            <OctoMascot estadoAnimação={getMascotState()} />
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
              className="text-center space-y-8 py-8 flex flex-col items-center"
            >
              <div className="space-y-4">
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#001B3D] font-black block">
                  Diagnóstico Operacional Executivo
                </span>
                <h1 className="text-4xl font-black text-[#001B3D] leading-tight max-w-2xl mx-auto">
                  Sua Operação está no topo ou perdendo dinheiro?
                </h1>
                <p className="text-slate-500 text-base max-w-lg mx-auto leading-relaxed">
                  Descubra o nível de eficiência e automação dos seus canais em menos de 2 minutos e obtenha a prioridade tática para seu negócio.
                </p>
              </div>

              <div className="w-full max-w-md pt-4">
                <button
                  onClick={() => { setStep(1); setStartTime(Date.now()); }}
                  className="w-full py-5 text-xl font-black rounded-2xl tracking-wide uppercase bg-[#001B3D] text-white active:scale-[0.98] active:bg-[#3E4C64] shadow-lg transition-all duration-150 cursor-pointer block text-center"
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
              className="space-y-8"
            >
              <div className="space-y-2 text-center md:text-left">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 font-extrabold">
                  Etapa 1: Acolhimento
                </span>
                <h1 className="text-3xl font-black text-[#001B3D] leading-tight">
                  Bem-vindo ao DeepDive. Como podemos te chamar?
                </h1>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-550 font-bold">Seu Nome *</label>
                    <input
                      type="text"
                      placeholder="Ex: Pedro Silva"
                      className="w-full p-5 rounded-2xl bg-slate-50 border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-base focus:outline-none focus:ring-2 focus:ring-[#001B3D]/20 focus:border-[#001B3D] transition-all"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-550 font-bold">WhatsApp Corporativo *</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full p-5 rounded-2xl bg-slate-50 border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-base focus:outline-none focus:ring-2 focus:ring-[#001B3D]/20 focus:border-[#001B3D] transition-all"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-slate-550 font-bold">E-mail Corporativo *</label>
                  <input
                    type="email"
                    placeholder="Ex: pedro@empresa.com"
                    className="w-full p-5 rounded-2xl bg-slate-50 border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-base focus:outline-none focus:ring-2 focus:ring-[#001B3D]/20 focus:border-[#001B3D] transition-all"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-550 font-bold">Nome da Empresa *</label>
                    <input
                      type="text"
                      placeholder="Ex: Tech Co."
                      className="w-full p-5 rounded-2xl bg-slate-50 border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-base focus:outline-none focus:ring-2 focus:ring-[#001B3D]/20 focus:border-[#001B3D] transition-all"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-550 font-bold">Seu Cargo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Diretor de Operações"
                      className="w-full p-5 rounded-2xl bg-slate-50 border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-base focus:outline-none focus:ring-2 focus:ring-[#001B3D]/20 focus:border-[#001B3D] transition-all"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange("cargo", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(3)}
                  disabled={!isStep1Valid}
                  className={`w-full py-5 rounded-2xl font-bold transition-all text-lg flex items-center justify-center gap-2 ${
                    isStep1Valid
                      ? "bg-[#001B3D] text-white active:scale-[0.98] active:bg-[#3E4C64] shadow-md cursor-pointer"
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                  }`}
                >
                  Avançar
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="space-y-8"
            >
              <div className="space-y-2 text-center md:text-left">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 font-extrabold">
                  Etapa 2: Diagnóstico
                </span>
                <h2 className="text-3xl font-black text-[#001B3D] leading-tight">
                  Como está estruturada a sua operação hoje?
                </h2>
              </div>

              <div className="space-y-8">
                {/* 1. Tamanho da Equipe */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-slate-550 font-bold block">
                    Quantas mentes comandam o seu atendimento hoje?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Eu + 1', '3 a 5', '6 a 15', 'Mais de 15'].map((opt) => {
                      const isSelected = diagnosticoData.equipe === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleDiagChange('equipe', opt)}
                          className={`p-4 rounded-xl border text-center text-sm font-semibold transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-slate-100 border-[#001B3D] text-[#001B3D] font-bold shadow-md"
                              : "bg-white border-zinc-200 text-zinc-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Fluxo Financeiro/Notas */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-slate-550 font-bold block">
                    Qual o volume mensal de vendas / notas fiscais?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['Até 100/mês', 'De 101 a 1000/mês', 'Mais de 1000/mês'].map((opt) => {
                      const isSelected = diagnosticoData.volume === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleDiagChange('volume', opt)}
                          className={`p-4 rounded-xl border text-center text-sm font-semibold transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-slate-100 border-[#001B3D] text-[#001B3D] font-bold shadow-md"
                              : "bg-white border-zinc-200 text-zinc-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Canais */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-slate-550 font-bold block">
                    Por quais canais seus clientes chegam com mais frequência?
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['WhatsApp', 'Instagram', 'E-mail', 'Chat no Site', 'Telefone'].map((opt) => {
                      const isSelected = diagnosticoData.canais.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleCanal(opt)}
                          className={`px-5 py-3 rounded-full border text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected 
                              ? "bg-slate-100 border-[#001B3D] text-[#001B3D] font-bold shadow-md"
                              : "bg-white border-zinc-200 text-zinc-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-4 rounded-2xl border border-zinc-200 text-zinc-700 font-bold active:scale-[0.98] active:bg-slate-100 transition-all text-base cursor-pointer"
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
                  className={`px-10 py-4 rounded-2xl font-bold transition-all text-base flex items-center justify-center gap-2 ${
                    isStep2Valid
                      ? "bg-[#001B3D] text-white active:scale-[0.98] active:bg-[#3E4C64] shadow-md cursor-pointer"
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                  }`}
                >
                  {jornadaVersao === 'CONSULTIVA' ? 'Concluir Diagnóstico' : 'Iniciar Desafio'}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="space-y-6 relative"
            >
              {/* Sonda Educativa Scanner Animation */}
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
                  background: linear-gradient(90deg, transparent, rgba(44, 54, 71, 0.2), transparent);
                  box-shadow: 0 0 12px rgba(44, 54, 71, 0.1);
                  animation: scanline 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                  pointer-events: none;
                  z-index: 0;
                }
              `}</style>
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl -mx-8 -my-8 px-8 py-8 z-0">
                <div className="sonda-scanner" />
              </div>

              {currentQuestionIndex === 0 && (
                <div className="pb-4 mb-4 border-b border-zinc-200">
                  <h3 className="text-center font-bold text-[#001B3D] tracking-wider text-sm">
                    &quot;Vamos avaliar as suas dores e mapear a inteligência do seu negócio.&quot;
                  </h3>
                </div>
              )}

              <div className="space-y-2 relative z-10">
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#001B3D] font-bold block">
                  Desafio {currentQuestionIndex + 1} de {quizJourneyConfig.questions.length}
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#001B3D] leading-snug">
                  {currentQuestion.question}
                </h2>
              </div>

              {currentQuestion.id === 3 ? (
                <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = selectedChannels.includes(option.text);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedChannels(prev => 
                              prev.includes(option.text) 
                                ? prev.filter(c => c !== option.text)
                                : [...prev, option.text]
                            );
                          }}
                          className={`p-5 rounded-2xl border text-center text-lg md:text-xl font-bold transition-all cursor-pointer active:scale-[0.98] active:bg-slate-100 ${
                            isSelected 
                              ? "bg-slate-100 border-[#001B3D] text-[#001B3D] shadow-md scale-[1.02]"
                              : "bg-white border-zinc-200 text-zinc-700"
                          }`}
                        >
                          {option.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOptionText === option.text;
                    const isIncorrect = isSelected && !option.isCorrect;
                    const isCorrect = isSelected && option.isCorrect;

                    let pillStyle = "border-zinc-200 bg-white active:bg-slate-100 active:scale-[0.98] text-slate-800 shadow-sm transition-all duration-150";
                    if (isSelected) {
                      if (isCorrect) {
                        pillStyle = "border-[#001B3D] bg-slate-100 text-[#001B3D] shadow-[0_0_15px_rgba(44,54,71,0.1)]";
                      } else {
                        pillStyle = "border-red-400 bg-red-50/50 text-red-700 shadow-sm";
                      }
                    }

                    return (
                      <div key={idx} className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectQuizOption(option)}
                          className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${pillStyle}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg md:text-xl pr-4">{option.text}</span>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected && isCorrect ? "bg-[#001B3D] border-transparent text-white" :
                              isSelected && isIncorrect ? "bg-red-500 border-transparent text-white" :
                              "border-zinc-300 bg-transparent"
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
                            className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm mt-1 leading-relaxed shadow-sm"
                          >
                            <strong>Explicação:</strong> {option.feedback}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-zinc-200 relative z-10 mt-8">
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
                  className="px-8 py-4 rounded-2xl border border-zinc-200 text-[#001B3D] font-bold active:scale-[0.98] active:bg-slate-100 transition-all text-base cursor-pointer"
                >
                  Voltar
                </button>
                
                <div className="text-sm text-slate-400 font-mono font-bold">
                  Pontos: {score}/{quizJourneyConfig.questions.length}
                </div>

                {currentQuestion.id === 3 && (
                  <button
                    type="button"
                    disabled={selectedChannels.length === 0}
                    onClick={() => {
                      // Salva os canais escolhidos em quizAnswers e avança
                      setQuizAnswers(prev => ({ ...prev, 3: selectedChannels }));
                      
                      // Calcula pontuações de canais
                      let canalPrejuizo = 0;
                      setQuizToolScores(prev => {
                        const next = { ...prev };
                        selectedChannels.forEach(chan => {
                          const opt = currentQuestion.options.find(o => o.text === chan);
                          if (opt) {
                            if (opt.scores) {
                              if (opt.scores.faq) next.faq += opt.scores.faq;
                              if (opt.scores.sales) next.sales += opt.scores.sales;
                              if (opt.scores.info) next.info += opt.scores.info;
                              if (opt.scores.cart) next.cart += opt.scores.cart;
                            }
                            if (opt.prejuizo !== undefined) {
                              canalPrejuizo += opt.prejuizo;
                            }
                          }
                        });
                        return next;
                      });

                      setPrejuizoOperacional(prev => prev + canalPrejuizo);
                      setCurrentQuestionIndex((prev) => prev + 1);
                    }}
                    className={`px-8 py-4 rounded-2xl font-black text-base tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
                      selectedChannels.length > 0
                        ? "bg-[#001B3D] text-white active:scale-[0.98] active:bg-[#3E4C64] shadow-md cursor-pointer"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                    }`}
                  >
                    Avançar
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
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
                <h2 className="text-3xl font-black text-[#001B3D] animate-pulse">
                  Mergulhando nos Dados...
                </h2>
                <p className="text-base text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Processando suas respostas e formulando o diagnóstico de inteligência operacional...
                </p>
              </div>

              <div className="w-full max-w-md bg-zinc-100 rounded-full h-4 border border-zinc-200 overflow-hidden relative shadow-inner">
                <motion.div
                  className="h-full bg-[#001B3D]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono text-xs text-[#001B3D] tracking-widest uppercase font-bold">
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
              className="text-center space-y-8 py-2 flex flex-col items-center"
            >
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-[0.3em] px-5 py-2 rounded-full border font-bold text-[#001B3D] border-[#001B3D]/30 bg-slate-100">
                  Diagnóstico Concluído
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-[#001B3D] leading-tight">
                  SEU DIAGNÓSTICO DE EFICIÊNCIA OPERACIONAL ESTÁ PRONTO!
                </h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Com base no perfil da sua equipe e nas respostas do quiz, o motor identificou a sua prioridade técnica de automação.
                </p>
              </div>

              {/* Card de Diagnóstico do Polvo minimalista com aura suave */}
              <div 
                className="p-10 rounded-3xl bg-white border border-slate-200 w-full max-w-2xl flex flex-col items-center space-y-6 shadow-xl relative"
                style={{ 
                  boxShadow: '0 10px 40px rgba(44, 54, 71, 0.05), 0 0 25px rgba(0, 229, 255, 0.02)'
                }}
              >
                <div className="scale-110 mb-2">
                  <OctoMascot estadoAnimação="success" />
                </div>
                
                <div className="space-y-2 text-center">
                  <span className="text-xs uppercase font-mono tracking-widest text-[#001B3D] font-bold">prioridade identificada</span>
                  <h3 className="text-2xl font-black text-[#001B3D] tracking-tight">
                    {TOOLS_CONFIG[computedResult.prioridadeFerramenta].name}
                  </h3>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-650 text-sm leading-relaxed max-w-lg text-center font-medium">
                  {computedResult.diagnostico.mensagemInterface}
                </div>

                {/* Bloco de Prejuízo Operacional */}
                <div className="w-full max-w-lg bg-red-50/75 border border-red-200/50 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 block">Prejuízo Operacional Estimado</span>
                    <span className="text-2xl font-black text-red-950">
                      R$ {((computedResult.prejuizoOperacional || 0) * 1250).toLocaleString('pt-BR')}/mês
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nível de Vazamento</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                      computedResult.prejuizoOperacional > 15 
                        ? "bg-red-200 text-red-700" 
                        : computedResult.prejuizoOperacional > 8 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {computedResult.prejuizoOperacional > 15 ? 'Crítico (Alto)' : computedResult.prejuizoOperacional > 8 ? 'Médio' : 'Baixo'}
                    </span>
                  </div>
                </div>

                {/* Dashboard de Scores do DeepDive */}
                <div className="w-full max-w-lg border-t border-slate-200 pt-6 text-left space-y-3">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">Relatório de Relevância por Pilar:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "Atendimento Automatizado (FAQ)", val: computedResult.toolScores.faq, key: 'faq' },
                      { label: "Agente de Automação (Vendas)", val: computedResult.toolScores.sales, key: 'sales' },
                      { label: "Sistema de Notificação", val: computedResult.toolScores.info, key: 'info' },
                      { label: "Recuperação de Carrinho", val: computedResult.toolScores.cart, key: 'cart' },
                    ].map((item) => {
                      const isWinner = computedResult.prioridadeFerramenta === item.key;
                      return (
                        <div 
                          key={item.key} 
                          className={`flex items-center justify-between text-xs p-3 rounded-xl border ${
                            isWinner 
                              ? 'bg-slate-100 border-[#001B3D] font-bold text-[#001B3D] shadow-sm' 
                              : 'bg-white border-slate-100 text-slate-400'
                          }`}
                        >
                          <span className="truncate pr-2">{isWinner ? '★ ' : ''}{item.label}</span>
                          <span className="font-mono flex-shrink-0">{item.val} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bloco Dinâmico: Solução Recomendada de I.A. */}
                {(computedResult.prioridadeFerramenta === 'sales' || computedResult.prioridadeFerramenta === 'cart') && (
                  <div className="w-full max-w-lg border-t border-slate-200 pt-6 text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-mono tracking-wider text-emerald-600 font-extrabold flex items-center gap-1">
                        ⚡ Solução Recomendada de I.A.
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
                        Imediato
                      </span>
                    </div>
                    
                    {computedResult.prioridadeFerramenta === 'sales' ? (
                      <div className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/30 flex flex-col gap-2 shadow-sm relative overflow-hidden">
                        <h5 className="font-extrabold text-base text-[#001B3D] flex items-center gap-1.5">
                          🤖 Agente de I.A. para Vendas Octadesk
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          Qualifica leads automaticamente do WhatsApp e Instagram 24/7. Responde instantaneamente às intenções de compra, aquece o lead e encaminha apenas os leads qualificados (MQLs) diretamente para o funil dos seus vendedores.
                        </p>
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 pt-2 border-t border-emerald-500/10 mt-1">
                          <span>🚀 Redução de Tempo de Resposta: -95%</span>
                          <span>📈 Conversão Média: +30%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/30 flex flex-col gap-2 shadow-sm relative overflow-hidden">
                        <h5 className="font-extrabold text-base text-[#001B3D] flex items-center gap-1.5">
                          🛒 Recuperador de Carrinho Abandonado via WhatsApp
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          Detecta desistências no checkout em tempo real. Dispara fluxos dinâmicos e conversacionais personalizados com ofertas e cupons via WhatsApp para reengajar e resgatar o cliente no momento crítico da compra.
                        </p>
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 pt-2 border-t border-emerald-500/10 mt-1">
                          <span>💰 Recuperação Média: 15% a 25%</span>
                          <span>⏱️ Tempo de Resgate: Tempo Real</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="w-full max-w-md pt-4">
                <button
                  onClick={handleReset}
                  className="w-full py-5 text-xl font-black rounded-2xl tracking-wide uppercase bg-[#001B3D] text-white active:scale-[0.98] active:bg-[#3E4C64] shadow-lg transition-all duration-150 cursor-pointer block"
                >
                  Finalizar DeepDive
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Régua de Navegação Livre para Validação e Testes */}
        <div className="mt-8 pt-4 border-t border-zinc-200/80 w-full flex flex-wrap justify-center gap-1.5 z-20">
           <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block w-full text-center mb-1">
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
               className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                 step === item.val
                   ? "bg-[#001B3D] text-white shadow-sm"
                   : "bg-zinc-100 text-zinc-650 hover:bg-zinc-200 border border-zinc-200"
               }`}
             >
               {item.label}
             </button>
           ))}
         </div>

      </div>

      <footer className="mt-8 text-center z-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="px-4 py-2 text-xs font-mono border border-transparent rounded-lg transition-colors cursor-pointer uppercase tracking-wider text-slate-400 hover:text-[#001B3D]"
          >
            [ Painel de Controle ]
          </button>
          
          <button
            onClick={() => setIsVersaoMenuOpen(prev => !prev)}
            className="px-4 py-2 text-xs font-mono border border-transparent rounded-lg transition-colors cursor-pointer uppercase tracking-wider text-slate-400 hover:text-[#001B3D] flex items-center gap-1.5"
          >
            ⚙️ <span className="underline decoration-dotted">{jornadaVersao === 'CONSULTIVA' ? 'Modo Consultivo' : jornadaVersao === 'FAST_TRACK' ? 'Modo Fast Track' : 'Modo Arcade'}</span>
          </button>
        </div>

        {isVersaoMenuOpen && (
          <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xl flex flex-col gap-2 w-64 backdrop-blur-md relative z-50">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#001B3D] mb-1">Selecione o Modo da Jornada</span>
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
                    ? "bg-[#001B3D]/10 border border-[#001B3D]/30 text-[#001B3D]" 
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-transparent"
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
