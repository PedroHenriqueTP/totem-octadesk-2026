"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OctoMascot } from './OctoMascot';
import { db, Lead } from '../../data/db';
import { usePolvo } from '../../hooks/usePolvo';
import { calcularTrilhaOctadesk } from '../../utils/bifurcation';
import { RespostasQuiz, TamanhoOperacao, TrilhaResultado } from '../../types/diagnostico';
import { quizJourneyConfig, QuizQuestion, VERSAO_ATIVA, JornadaVersao } from '../../shared/config/quiz-journey';
import { LocalStorageManager, LeadRegistrado } from '../../infra/local-storage-manager';
import AdminPanel from './AdminPanel';

export default function QuizApp() {
  // 1: Cadastro, 2: Diagnóstico, 3: Quiz, 4: Loading, 5: Veredito
  const [step, setStep] = useState<number>(1); 
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

  // Estados do Polvo e Resultado
  const { state: polvoState, setState: setPolvoState, resetState: resetPolvoState } = usePolvo();
  const [computedResult, setComputedResult] = useState<{
    trilha: TrilhaResultado;
    score: number;
    diagnostico: any;
  } | null>(null);

  // Efeito de animação de progresso do loading (Step 4)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 4) {
      setProgress(0);
      const startTime = Date.now();
      const duration = 2000;

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(currentProgress);

        if (elapsed >= duration) {
          clearInterval(interval);
          setStep(5); // Vai para o resultado final
          if (computedResult) {
            setPolvoState(`trilha_${computedResult.trilha.toLowerCase()}` as any);
          }
        }
      }, 30);
    }
    return () => clearInterval(interval);
  }, [step, computedResult, setPolvoState]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiagChange = (field: keyof typeof diagnosticoData, value: string) => {
    setDiagnosticoData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCanal = (canal: string) => {
    setDiagnosticoData(prev => {
      const canais = prev.canais.includes(canal)
        ? prev.canais.filter(c => c !== canal)
        : [...prev.canais, canal];
      return { ...prev, canais };
    });
  };

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

  // Processa a seleção de opções no quiz com feedback visual reativo
  const handleSelectQuizOption = (option: { text: string; isCorrect: boolean; feedback: string }) => {
    if (selectedOptionText !== null && option.text !== selectedOptionText) {
      const currentQuestion = quizJourneyConfig.questions[currentQuestionIndex];
      const isCorrectSelected = currentQuestion.options.find(o => o.text === selectedOptionText)?.isCorrect;
      if (isCorrectSelected) return;
    }

    setSelectedOptionText(option.text);

    if (option.isCorrect) {
      if (!hasErroredOnCurrentQuestion) {
        setScore((prev) => prev + 1);
      }
      setTimeout(() => {
        setSelectedOptionText(null);
        setHasErroredOnCurrentQuestion(false);
        if (currentQuestionIndex < quizJourneyConfig.questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          saveLeadDataAndTransition();
        }
      }, 600);
    } else {
      setHasErroredOnCurrentQuestion(true);
    }
  };

  // Salva os dados no IndexedDB e no LocalStorage
  const saveLeadDataAndTransition = async () => {
    // Se for Fast Track, como o Passo 2 é ignorado, definimos valores padrão razoáveis
    // para evitar payloads vazios no banco offline Dexie e no LocalStorage
    const finalEquipe = jornadaVersao === 'FAST_TRACK' ? '3 a 5' : (diagnosticoData.equipe || '3 a 5');
    const finalVolume = jornadaVersao === 'FAST_TRACK' ? 'Até 100/mês' : (diagnosticoData.volume || 'Até 100/mês');
    const finalCanais = jornadaVersao === 'FAST_TRACK' ? ['WhatsApp'] : (diagnosticoData.canais.length > 0 ? diagnosticoData.canais : ['WhatsApp']);

    const isMaisDe15 = finalEquipe === 'Mais de 15';
    const isHighVolume = finalVolume === 'Mais de 1000/mês' || finalVolume === 'De 101 a 1000/mês';
    const hasComplexChannels = finalCanais.includes('E-mail') || finalCanais.includes('Telefone') || finalCanais.length >= 3;

    const tamanhoOp = (isMaisDe15 ? 'Mais de 100 colaboradores' : 
                       finalEquipe === '6 a 15' ? 'De 6 a 20 colaboradores' : 
                       'Ate 5 colaboradores') as TamanhoOperacao;

    // Mapeamento dinâmico dos dados reais do Passo 2 para as propriedades da interface RespostasQuiz
    // exigida pelo motor de decisão calcularTrilhaOctadesk
    const respostas: RespostasQuiz = {
      tamanhoOperacao: tamanhoOp,
      totalFerramentas: isMaisDe15 ? 'Mais de 10 ferramentas (Ecossistema complexo)' : isHighVolume ? 'De 5 a 10 ferramentas' : 'De 2 a 4 ferramentas',
      possuiCarrinhoAbandonado: isHighVolume,
      possuiIaVendas: !finalCanais.includes('WhatsApp'), // Se usa WhatsApp, assume-se que precisa de automação/IA de vendas (portanto possuiIaVendas = false)
      possuiNotificacaoStatus: isHighVolume,
      possuiIaDuvidasStatus: false,
      possuiEmissaoNotas: isHighVolume,
      possuiHelpdeskSla: hasComplexChannels,
    };

    const trilha = calcularTrilhaOctadesk(respostas);
    setPolvoState('thinking');

    // Payload final enviado de forma limpa para o db.leads (Dexie/IndexedDB)
    const novoLead: Lead = {
      nome: formData.nome,
      empresa: formData.empresa,
      email: formData.email,
      contato: formData.telefone,
      tamanhoOperacao: finalEquipe,
      volumeVendasMes: finalVolume,
      canais: finalCanais,
      transbordo_urgente: isMaisDe15,
      score_quiz: score,
      capturado_via: 'Quiz de Desafios Totem 2026',
      perfil_bifurcado: trilha,
      sincronizado: 0,
      criado_em: new Date().toISOString()
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
      focoProduto: trilha === 'Enterprise' 
        ? 'Octadesk Enterprise: Atendimento em escala, múltiplos departamentos e roteamento avançado.'
        : trilha === 'Automacao'
        ? 'Integrações nativas com carrinhos, disparos automáticos de PIX e recuperação via WhatsApp.'
        : trilha === 'Atendimento'
        ? 'Painel multiatendente, centralização de números do WhatsApp e dashboards de produtividade em tempo real.'
        : 'Octadesk Bot e automação de canais para otimização de tempo e pós-venda.',
      mensagemInterface: trilha === 'Enterprise'
        ? 'O Polvo identificou uma operação de alta escala! Um consultor especialista foi notificado para te atender aqui no estande agora.'
        : trilha === 'Automacao'
        ? 'Diagnóstico concluído! O Polvo encontrou o vazamento de dinheiro no seu carrinho. Veja como automatizar a recuperação:'
        : trilha === 'Atendimento'
        ? 'Análise concluída! Seu time precisa de centralização e métricas. O Polvo organizou a melhor estrutura para sua equipe:'
        : 'Tudo pronto! O Polvo mapeou sua operação e preparou uma demonstração das ferramentas de automação da Octadesk.',
      brindeQualificado: score === 5 // Exigir score 5/5
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
      scoreQuiz: score
    }, diagnosticoResultado);

    setComputedResult({
      trilha,
      score,
      diagnostico: diagnosticoResultado
    });

    setStep(4); // Transiciona para o loading
  };

  const handleReset = () => {
    // Reset limpo do estado do Totem sem forçar reload da página local
    setStep(1);
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
    setHasErroredOnCurrentQuestion(false);
    setSelectedOptionText(null);
    setComputedResult(null);
    setProgress(0);
    resetPolvoState();
  };

  const getMascotState = (): 'floating' | 'thinking' | 'success' => {
    if (step === 4) return 'thinking';
    if (step === 5) return 'success';
    return 'floating';
  };

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" as const } }
  };

  const currentQuestion = quizJourneyConfig.questions[currentQuestionIndex];
  const isHighScore = computedResult?.score === 5;
  const reward = isHighScore ? quizJourneyConfig.rewards.high_score : quizJourneyConfig.rewards.participation;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Elementos visuais abstratos de fundo adaptados para o fundo claro */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64">
          <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
            <path d="M 0 0 C 40 40, 100 20, 140 80 C 160 110, 150 140, 110 160 C 90 170, 70 150, 80 130 C 90 110, 120 120, 110 90 C 100 60, 50 60, 0 0 Z" fill="url(#tentacleGrad)" />
            <defs>
              <linearGradient id="tentacleGrad" x1="0" y1="0" x2="200" y2="200">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="60%" stopColor="#0052CC" />
                <stop offset="100%" stopColor="#0052CC" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <header className="w-full max-w-4xl flex justify-between items-center z-10 mb-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0052CC] to-[#0EA5E9] flex items-center justify-center font-bold text-white text-lg shadow-[0_0_12px_rgba(14,165,233,0.35)]">
            O
          </div>
          <span className="font-extrabold tracking-wider text-sm uppercase text-zinc-900">
            Octadesk <span className="text-[#0EA5E9] font-light">Interactive</span>
          </span>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border backdrop-blur-sm text-[#0284C7] border-zinc-200/80 bg-white/80 shadow-sm">
          Fórum E-commerce Brasil 2026
        </span>
      </header>

      {/* Contêiner Principal - Tema Claro Premium */}
      <div className="w-full max-w-2xl shadow-2xl p-8 rounded-3xl z-10 relative overflow-hidden transition-all duration-350 bg-white/90 border border-zinc-200/80 text-zinc-900 backdrop-blur-xl">
        
        {/* Renderiza o mascote no topo nas etapas 1, 2 e 3. Na etapa 5, vai para dentro do bloco de sucesso */}
        {step < 4 && (
          <div className="mb-6 flex justify-center">
            <OctoMascot estadoAnimação={getMascotState()} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="cadastro"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-2 text-center md:text-left">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0EA5E9] font-extrabold">
                  Acolhimento Exclusivo
                </span>
                <h1 className="text-2xl font-black text-zinc-900 leading-tight">
                  Bem-vindo à experiência Octadesk. Como podemos te chamar?
                </h1>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Seu Nome *</label>
                    <input
                      type="text"
                      placeholder="Ex: Pedro Silva"
                      className="w-full p-4 rounded-xl bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9]"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">WhatsApp Corporativo *</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full p-4 rounded-xl bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9]"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">E-mail Corporativo *</label>
                  <input
                    type="email"
                    placeholder="Ex: pedro@empresa.com"
                    className="w-full p-4 rounded-xl bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9]"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Nome da Empresa *</label>
                    <input
                      type="text"
                      placeholder="Ex: Tech Co."
                      className="w-full p-4 rounded-xl bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9]"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Seu Cargo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Diretor de Operações"
                      className="w-full p-4 rounded-xl bg-white border border-zinc-200 text-zinc-950 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30 focus:border-[#0EA5E9]"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange("cargo", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(jornadaVersao === 'FAST_TRACK' ? 3 : 2)}
                  disabled={!isStep1Valid}
                  className={`w-full py-4 rounded-2xl font-bold transition-all text-base flex items-center justify-center gap-2 ${
                    isStep1Valid
                      ? "bg-[#0EA5E9] border border-[#0EA5E9] text-white hover:bg-[#0284C7] shadow-[0_4px_15px_rgba(14,165,233,0.2)] cursor-pointer"
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
              className="space-y-6"
            >
              <div className="space-y-2 text-center md:text-left">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0EA5E9] font-extrabold">
                  Diagnóstico Operacional
                </span>
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 leading-tight">
                  Como está estruturada a sua operação hoje?
                </h2>
              </div>

              <div className="space-y-6">
                {/* 1. Tamanho da Equipe */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider text-zinc-600 font-bold block">
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
                          className={`p-3 rounded-xl border text-center text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
                            isSelected 
                              ? "bg-sky-50/70 border-[#0EA5E9] text-[#0284C7] shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                              : "bg-white/80 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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
                  <label className="text-xs uppercase tracking-wider text-zinc-600 font-bold block">
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
                          className={`p-3 rounded-xl border text-center text-sm font-semibold transition-all cursor-pointer backdrop-blur-md ${
                            isSelected 
                              ? "bg-sky-50/70 border-[#0EA5E9] text-[#0284C7] shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                              : "bg-white/80 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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
                  <label className="text-xs uppercase tracking-wider text-zinc-600 font-bold block">
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
                          className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all cursor-pointer backdrop-blur-md flex items-center gap-2 ${
                            isSelected 
                              ? "bg-sky-50/70 border-[#0EA5E9] text-[#0284C7] shadow-[0_0_10px_rgba(14,165,233,0.15)]"
                              : "bg-white/80 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 transition-colors text-sm cursor-pointer"
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
                  className={`px-8 py-3 rounded-xl font-bold transition-all text-base flex items-center justify-center gap-2 ${
                    isStep2Valid
                      ? "bg-[#0EA5E9] border border-[#0EA5E9] text-white hover:bg-[#0284C7] shadow-[0_4px_15px_rgba(14,165,233,0.2)] cursor-pointer"
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
              key="quiz"
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
                  background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.8), transparent);
                  box-shadow: 0 0 15px rgba(14, 165, 233, 0.5), 0 0 5px rgba(14, 165, 233, 0.7);
                  animation: scanline 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                  pointer-events: none;
                  z-index: 0;
                }
              `}</style>
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl -mx-8 -my-8 px-8 py-8 z-0">
                <div className="sonda-scanner" />
              </div>

              {currentQuestionIndex === 0 && (
                <div className="pb-4 mb-4 border-b border-zinc-200/80">
                  <h3 className="text-center font-bold text-[#0284C7] tracking-wider text-sm">
                    "Agora vamos ver se sua operação atingiu as profundezas da automação!"
                  </h3>
                </div>
              )}

              <div className="space-y-1.5 relative z-10">
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#0EA5E9] font-bold block">
                  Desafio {currentQuestionIndex + 1} de {quizJourneyConfig.questions.length}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 leading-snug">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="space-y-3.5 relative z-10">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOptionText === option.text;
                  const isIncorrect = isSelected && !option.isCorrect;
                  const isCorrect = isSelected && option.isCorrect;

                  let pillStyle = "border-zinc-200/60 bg-white/80 hover:bg-zinc-50/90 text-zinc-800 shadow-sm backdrop-blur-md";
                  if (isSelected) {
                    if (isCorrect) {
                      pillStyle = "border-[#0EA5E9] bg-sky-50/50 text-[#0284C7] shadow-[0_0_15px_rgba(14,165,233,0.2)]";
                    } else {
                      pillStyle = "border-red-400 bg-red-50/30 text-red-700 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
                    }
                  }

                  return (
                    <div key={idx} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleSelectQuizOption(option)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 backdrop-blur-md cursor-pointer ${pillStyle}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-base pr-4">{option.text}</span>
                          <div className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected && isCorrect ? "bg-[#0EA5E9] border-transparent text-white" :
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
                          className="p-3.5 bg-red-55/80 border border-red-200 rounded-xl text-red-800 text-sm mt-1 leading-relaxed shadow-sm"
                        >
                          <strong>Explicação:</strong> {option.feedback}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-zinc-200/80 relative z-10">
                <button
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex((prev) => prev - 1);
                      setSelectedOptionText(null);
                      setHasErroredOnCurrentQuestion(false);
                    } else {
                      setStep(jornadaVersao === 'FAST_TRACK' ? 1 : 2);
                    }
                  }}
                  className="px-5 py-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 transition-colors text-sm cursor-pointer"
                >
                  Voltar
                </button>
                <div className="text-xs text-zinc-500 font-mono">
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
              className="text-center py-8 space-y-8 flex flex-col items-center justify-center"
            >
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-[#0EA5E9] animate-pulse">
                  Mergulhando nos Dados...
                </h2>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Calculando seu nível de automação e preparando sua recompensa...
                </p>
              </div>

              <div className="w-full max-w-xs bg-zinc-100 rounded-full h-3 border border-zinc-200/60 overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                <motion.div
                  className="h-full bg-[#0EA5E9] shadow-[0_0_10px_rgba(14,165,233,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono text-xs text-[#0EA5E9] tracking-widest uppercase font-bold">
                {Math.round(progress)}% PROCESSADO
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
              className="text-center space-y-6 py-2 flex flex-col items-center"
            >
              <div className="space-y-2">
                <span 
                  className="text-[10px] uppercase font-mono tracking-[0.35em] px-4 py-1.5 rounded-full border font-bold"
                  style={{ 
                    color: computedResult.score === 5 ? '#0284C7' : '#15803D', 
                    borderColor: `${reward.badgeColor}aa`, 
                    backgroundColor: `${reward.badgeColor}15` 
                  }}
                >
                  {reward.title}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 leading-tight">
                  Score Alcançado: <span style={{ color: computedResult.score === 5 ? '#0284C7' : '#15803D' }}>{computedResult.score}/5</span>
                </h2>
              </div>

              {/* Bloco de Sucesso do Brinde com polvo unicamente dentro e aura neon ciano para Kit Premium */}
              <div 
                className="p-8 rounded-2xl bg-white/90 border-2 w-full max-w-xl flex flex-col items-center space-y-4 shadow-md"
                style={{ 
                  borderColor: computedResult.score === 5 ? '#0EA5E9' : '#22C55E',
                  boxShadow: computedResult.score === 5 
                    ? '0 0 35px rgba(14, 165, 233, 0.25), inset 0 0 20px rgba(14, 165, 233, 0.05)' 
                    : '0 0 25px rgba(34, 197, 94, 0.1)'
                }}
              >
                <div className="py-2 scale-110">
                  <OctoMascot estadoAnimação="success" />
                </div>
                
                <h3 className="text-xl font-bold text-zinc-800 uppercase tracking-wider">Você Conquistou!</h3>
                <h4 
                  className="text-2xl font-black uppercase tracking-tight text-center"
                  style={{ 
                    color: computedResult.score === 5 ? '#0284C7' : '#15803D'
                  }}
                >
                  {reward.brinde}
                </h4>
                
                <p className="text-zinc-650 text-sm leading-relaxed max-w-md font-medium text-center">
                  {computedResult.diagnostico.mensagemInterface}
                </p>

              </div>

              <div className="w-full max-w-sm pt-4">
                <button
                  onClick={handleReset}
                  className="w-full py-5 text-xl font-black rounded-2xl tracking-wide uppercase bg-[#0EA5E9] border border-[#0EA5E9] text-white hover:bg-[#0284C7] shadow-[0_4px_20px_rgba(14,165,233,0.25)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer block"
                >
                  Finalizar e Retirar Brinde
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <footer className="mt-8 text-center z-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="px-4 py-2 text-xs font-mono border border-transparent rounded-lg transition-colors cursor-pointer uppercase tracking-wider text-zinc-400 hover:text-zinc-700"
          >
            [ Painel de Controle ]
          </button>
          
          <button
            onClick={() => setIsVersaoMenuOpen(prev => !prev)}
            className="px-4 py-2 text-xs font-mono border border-transparent rounded-lg transition-colors cursor-pointer uppercase tracking-wider text-zinc-400 hover:text-zinc-700 flex items-center gap-1.5"
          >
            ⚙️ <span className="underline decoration-dotted">{jornadaVersao === 'CONSULTIVA' ? 'Modo Consultivo' : jornadaVersao === 'FAST_TRACK' ? 'Modo Fast Track' : 'Modo Arcade'}</span>
          </button>
        </div>

        {isVersaoMenuOpen && (
          <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xl flex flex-col gap-2 w-64 backdrop-blur-md relative z-50">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#0EA5E9] mb-1">Selecione o Modo da Jornada</span>
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
                    ? "bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0284C7]" 
                    : "bg-zinc-50 text-zinc-750 hover:bg-zinc-100 border border-transparent"
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
