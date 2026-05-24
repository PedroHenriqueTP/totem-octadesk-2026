"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePolvo } from "../hooks/usePolvo";
import { db, Lead } from "../data/db";
import { TamanhoOperacao, RespostasQuiz } from "../types/diagnostico";
import AdminPanel from "../components/AdminPanel";
import { PolvoAnimation } from "../components/PolvoAnimation";
import QuizCard from "../components/QuizCard";
import ResultadoTrilha from "../components/ResultadoTrilha";

export default function Page() {
  const { state, processarLead, resetState } = usePolvo();
  
  const [step, setStep] = useState<number>(1);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showSecondQuestion, setShowSecondQuestion] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    atuacao: "",
    email: "",
    contato: "",
    tamanhoOperacao: "" as TamanhoOperacao | "",
    totalFerramentas: "" as 'Apenas 1 (Centralizada)' | 'De 2 a 4 ferramentas' | 'De 5 a 10 ferramentas' | 'Mais de 10 ferramentas (Ecossistema complexo)' | "",
    possuiCarrinhoAbandonado: false,
    possuiIaVendas: false,
    possuiNotificacaoStatus: false,
    possuiIaDuvidasStatus: false,
    possuiEmissaoNotas: false,
    possuiHelpdeskSla: false,
    capturado_via: "Totem",
    sincronizado: 0,
    criado_em: "",
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 5) {
      setProgress(0);
      const startTime = Date.now();
      const duration = 2000;

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(currentProgress);

        if (elapsed >= duration) {
          clearInterval(interval);
          setStep(6);
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    setShowSecondQuestion(false);
    setStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setShowSecondQuestion(true);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isFormValid = 
    (formData.nome?.trim().length ?? 0) >= 2 &&
    isEmailValid(formData.email ?? "") &&
    (formData.contato?.trim().length ?? 0) >= 8 &&
    (formData.empresa?.trim().length ?? 0) >= 2 &&
    (formData.atuacao?.trim().length ?? 0) >= 2;

  const handleSelectOption = (field: keyof typeof formData, value: string, nextAction: "reveal" | "advance") => {
    handleInputChange(field, value);
    
    if (nextAction === "reveal") {
      setTimeout(() => {
        setShowSecondQuestion(true);
      }, 250);
    } else {
      setTimeout(() => {
        handleNextStep();
      }, 400);
    }
  };

  const toggleSolution = (field: keyof typeof formData) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFinishQuiz = async () => {
    setStep(5);

    const respostasQuiz: RespostasQuiz = {
      tamanhoOperacao: formData.tamanhoOperacao as TamanhoOperacao,
      totalFerramentas: formData.totalFerramentas as 'Apenas 1 (Centralizada)' | 'De 2 a 4 ferramentas' | 'De 5 a 10 ferramentas' | 'Mais de 10 ferramentas (Ecossistema complexo)',
      possuiCarrinhoAbandonado: formData.possuiCarrinhoAbandonado,
      possuiIaVendas: formData.possuiIaVendas,
      possuiNotificacaoStatus: formData.possuiNotificacaoStatus,
      possuiIaDuvidasStatus: formData.possuiIaDuvidasStatus,
      possuiEmissaoNotas: formData.possuiEmissaoNotas,
      possuiHelpdeskSla: formData.possuiHelpdeskSla
    };
    
    const perfilCalculado = await processarLead(respostasQuiz);

    await db.leads.add({
      ...(formData as unknown as Lead),
      perfil_bifurcado: perfilCalculado,
      criado_em: new Date().toISOString(),
      sincronizado: 0,
    });
  };

  const handleReset = () => {
    setFormData({
      nome: "",
      empresa: "",
      atuacao: "",
      email: "",
      contato: "",
      tamanhoOperacao: "",
      totalFerramentas: "",
      possuiCarrinhoAbandonado: false,
      possuiIaVendas: false,
      possuiNotificacaoStatus: false,
      possuiIaDuvidasStatus: false,
      possuiEmissaoNotas: false,
      possuiHelpdeskSla: false,
      capturado_via: "Totem",
      sincronizado: 0,
      criado_em: "",
    });
    resetState();
    setProgress(0);
    setShowSecondQuestion(false);
    setStep(1);
  };

  const getMascotStatus = (): 'idle' | 'processing' | 'success' => {
    if (step === 5) return 'processing';
    if (step === 6) return 'success';
    return 'idle';
  };

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" as const } }
  };

  const getButtonClass = (isSelected: boolean) => {
    return `w-full p-4 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer skew-x-[-6deg] ${
      isSelected
        ? 'border-[#00E5FF] bg-white text-[#0F172A] shadow-[0_0_15px_rgba(0,229,255,0.25)] font-bold'
        : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#00E5FF]/50 shadow-sm'
    }`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-slate-800 relative overflow-hidden bg-[#F8FAFC]">
      
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 opacity-15">
          <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
            <path d="M 0 0 C 40 40, 100 20, 140 80 C 160 110, 150 140, 110 160 C 90 170, 70 150, 80 130 C 90 110, 120 120, 110 90 C 100 60, 50 60, 0 0 Z" fill="url(#tentacleGrad)" />
            <defs>
              <linearGradient id="tentacleGrad" x1="0" y1="0" x2="200" y2="200">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="60%" stopColor="#0052CC" />
                <stop offset="100%" stopColor="#0052CC" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 opacity-15 transform scale-x-[-1]">
          <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
            <path d="M 0 0 C 40 40, 100 20, 140 80 C 160 110, 150 140, 110 160 C 90 170, 70 150, 80 130 C 90 110, 120 120, 110 90 C 100 60, 50 60, 0 0 Z" fill="url(#tentacleGrad)" />
          </svg>
        </div>

        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-10 transform scale-y-[-1]">
          <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
            <path d="M 0 0 C 40 40, 100 20, 140 80 C 160 110, 150 140, 110 160 C 90 170, 70 150, 80 130 C 90 110, 120 120, 110 90 C 100 60, 50 60, 0 0 Z" fill="url(#tentacleGrad2)" />
            <defs>
              <linearGradient id="tentacleGrad2" x1="0" y1="0" x2="200" y2="200">
                <stop offset="0%" stopColor="#0052CC" />
                <stop offset="60%" stopColor="#00F0FF" />
                <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10 transform scale-x-[-1] scale-y-[-1]">
          <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
            <path d="M 0 0 C 40 40, 100 20, 140 80 C 160 110, 150 140, 110 160 C 90 170, 70 150, 80 130 C 90 110, 120 120, 110 90 C 100 60, 50 60, 0 0 Z" fill="url(#tentacleGrad2)" />
          </svg>
        </div>
      </div>

      <header className="w-full max-w-4xl flex justify-between items-center z-10 mb-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0052CC] to-[#00E5FF] flex items-center justify-center font-bold text-slate-950 text-lg shadow-[0_0_12px_rgba(0,240,255,0.35)]">
            O
          </div>
          <span className="font-extrabold tracking-wider text-sm uppercase text-slate-900">
            Octadesk <span className="text-[#00E5FF] font-light">Interactive</span>
          </span>
        </div>
      </header>

      <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] shadow-xl p-8 rounded-3xl z-10 relative overflow-hidden transition-all duration-350">
        
        {step !== 1 && step !== 4 && step !== 5 && step !== 6 && (
          <div className="mb-8 flex justify-center">
            <PolvoAnimation status={getMascotStatus()} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center py-8 space-y-8 flex flex-col items-center"
            >
              <div className="space-y-4">
                <span className="text-xs font-bold text-[#00E5FF] uppercase tracking-[0.3em] bg-[#F0FDFA] px-3 py-1.5 rounded-full border border-[#00E5FF]/20">
                  Fórum E-commerce Brasil 2026
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug text-slate-950 max-w-xl mx-auto">
                  Olá parceiro! Seja bem vindo ao estande Octadesk no Fórum Ecommerce Brasil, participe da nossa jornada às profundezas do oceano Octadesk.
                </h1>
              </div>

              <div className="py-2">
                <PolvoAnimation status="idle" />
              </div>

              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(0, 82, 204, 0.35)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNextStep}
                className="w-full max-w-xs py-4 bg-gradient-to-r from-[#0052CC] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-extrabold text-lg rounded-xl shadow-[0_8px_30px_rgba(0,82,204,0.25)] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                Viajar às Profundezas
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="form"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  Quem é você?
                </h2>
                <p className="text-sm text-slate-550">
                  Preencha seus dados para iniciar o diagnóstico da sua empresa.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Seu Nome *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Pedro Silva"
                        className={`w-full p-4 rounded-xl bg-white border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                          formData.nome && formData.nome.trim().length >= 2
                            ? "border-emerald-500/50 focus:ring-emerald-500/20"
                            : "border-[#E2E8F0] focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                        }`}
                        value={formData.nome || ""}
                        onChange={(e) => handleInputChange("nome", e.target.value)}
                      />
                      {formData.nome && formData.nome.trim().length >= 2 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold">✓</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">WhatsApp / Contato *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: (11) 99999-9999"
                        className={`w-full p-4 rounded-xl bg-white border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                          formData.contato && formData.contato.trim().length >= 8
                            ? "border-emerald-500/50 focus:ring-emerald-500/20"
                            : "border-[#E2E8F0] focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                        }`}
                        value={formData.contato || ""}
                        onChange={(e) => handleInputChange("contato", e.target.value)}
                      />
                      {formData.contato && formData.contato.trim().length >= 8 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold">✓</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">E-mail Corporativo *</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Ex: pedro@empresa.com"
                      className={`w-full p-4 rounded-xl bg-white border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                        formData.email && isEmailValid(formData.email)
                          ? "border-emerald-500/50 focus:ring-emerald-500/20"
                          : "border-[#E2E8F0] focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                      }`}
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                    {formData.email && isEmailValid(formData.email) && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold">✓</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Ramo / Nome da Empresa *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Modas / Tech Co."
                        className={`w-full p-4 rounded-xl bg-white border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                          formData.empresa && formData.empresa.trim().length >= 2
                            ? "border-emerald-500/50 focus:ring-emerald-500/20"
                            : "border-[#E2E8F0] focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                        }`}
                        value={formData.empresa || ""}
                        onChange={(e) => handleInputChange("empresa", e.target.value)}
                      />
                      {formData.empresa && formData.empresa.trim().length >= 2 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold">✓</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Seu Cargo / Atuação *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Diretor de E-commerce"
                        className={`w-full p-4 rounded-xl bg-white border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                          formData.atuacao && formData.atuacao.trim().length >= 2
                            ? "border-emerald-500/50 focus:ring-emerald-500/20"
                            : "border-[#E2E8F0] focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                        }`}
                        value={formData.atuacao || ""}
                        onChange={(e) => handleInputChange("atuacao", e.target.value)}
                      />
                      {formData.atuacao && formData.atuacao.trim().length >= 2 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleReset}
                  className="w-1/3 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!isFormValid}
                  className={`w-2/3 py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                    isFormValid
                      ? "bg-[#00E5FF] text-slate-950 hover:bg-[#00d0e6] shadow-[0_0_20px_rgba(0,240,255,0.2)] cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  Continuar para o Quiz
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="quiz1"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  Qual o tamanho da sua operação?
                </h2>
                <p className="text-sm text-slate-550">
                  Responda sobre a volumetria da equipe e ferramentas adotadas.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span>
                  Número de funcionários totais na empresa:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Até 5 colaboradores",
                    "De 6 a 20 colaboradores",
                    "De 21 a 100 colaboradores",
                    "Mais de 100 colaboradores"
                  ].map((option) => (
                    <QuizCard
                      key={option}
                      label={option}
                      isSelected={formData.tamanhoOperacao === option}
                      onClick={() => handleSelectOption("tamanhoOperacao", option, "reveal")}
                      accentColor="cyan"
                    />
                  ))}
                </div>
              </div>

              {showSecondQuestion && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pt-4 border-t border-[#E2E8F0]"
                >
                  <h3 className="text-sm uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span>
                    Quantas ferramentas pagas ou gratuitas sua operação utiliza atualmente?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Apenas 1 (Centralizada)",
                      "De 2 a 4 ferramentas",
                      "De 5 a 10 ferramentas",
                      "Mais de 10 ferramentas (Ecossistema complexo)"
                    ].map((option) => (
                      <QuizCard
                        key={option}
                        label={option}
                        isSelected={formData.totalFerramentas === option}
                        onClick={() => handleSelectOption("totalFerramentas", option, "advance")}
                        accentColor="cyan"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  Voltar
                </button>
                <div className="w-2/3"></div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="quiz2"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  Qual dessas soluções você já possui na sua operação?
                </h2>
                <p className="text-sm text-slate-550">
                  Selecione os nós da sua rede de software operacional.
                </p>
              </div>

              <div className="relative w-full min-h-[460px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 shadow-inner flex items-center justify-center">
                
                <svg className="absolute inset-0 w-full h-full stroke-[#E2E8F0] stroke-2 fill-none pointer-events-none opacity-50">
                  <line x1="16.6%" y1="16.6%" x2="50%" y2="50%" />
                  <line x1="83.3%" y1="16.6%" x2="50%" y2="50%" />
                  <line x1="16.6%" y1="50%" x2="50%" y2="50%" />
                  <line x1="83.3%" y1="50%" x2="50%" y2="50%" />
                  <line x1="16.6%" y1="83.3%" x2="50%" y2="50%" />
                  <line x1="83.3%" y1="83.3%" x2="50%" y2="50%" />
                </svg>

                <div className="grid grid-cols-3 grid-rows-3 gap-x-4 gap-y-8 items-center justify-items-center w-full z-10">
                  
                  <div className="w-full flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSolution("possuiCarrinhoAbandonado")}
                      className={getButtonClass(formData.possuiCarrinhoAbandonado)}
                    >
                      <div className="skew-x-[6deg]">
                        <span className="block font-bold text-[9px] uppercase opacity-60 mb-1">SOLUÇÃO A</span>
                        <span className="text-xs font-bold leading-tight line-clamp-2">Recuperação de Carrinho</span>
                      </div>
                    </motion.button>
                  </div>

                  <div />

                  <div className="w-full flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSolution("possuiIaVendas")}
                      className={getButtonClass(formData.possuiIaVendas)}
                    >
                      <div className="skew-x-[6deg]">
                        <span className="block font-bold text-[9px] uppercase opacity-60 mb-1">SOLUÇÃO B</span>
                        <span className="text-xs font-bold leading-tight line-clamp-2">Agente IA Conversor Vendas</span>
                      </div>
                    </motion.button>
                  </div>

                  <div className="w-full flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSolution("possuiNotificacaoStatus")}
                      className={getButtonClass(formData.possuiNotificacaoStatus)}
                    >
                      <div className="skew-x-[6deg]">
                        <span className="block font-bold text-[9px] uppercase opacity-60 mb-1">SOLUÇÃO C</span>
                        <span className="text-xs font-bold leading-tight line-clamp-2">Notificação Status Vendas</span>
                      </div>
                    </motion.button>
                  </div>

                  <div className="w-full h-full flex items-center justify-center relative overflow-visible scale-[0.55] origin-center">
                    <PolvoAnimation status="processing" />
                  </div>

                  <div className="w-full flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSolution("possuiIaDuvidasStatus")}
                      className={getButtonClass(formData.possuiIaDuvidasStatus)}
                    >
                      <div className="skew-x-[6deg]">
                        <span className="block font-bold text-[9px] uppercase opacity-60 mb-1">SOLUÇÃO D</span>
                        <span className="text-xs font-bold leading-tight line-clamp-2">Agente IA Dúvidas Status</span>
                      </div>
                    </motion.button>
                  </div>

                  <div className="w-full flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSolution("possuiEmissaoNotas")}
                      className={getButtonClass(formData.possuiEmissaoNotas)}
                    >
                      <div className="skew-x-[6deg]">
                        <span className="block font-bold text-[9px] uppercase opacity-60 mb-1">SOLUÇÃO E</span>
                        <span className="text-xs font-bold leading-tight line-clamp-2">Emissão Notas Automática</span>
                      </div>
                    </motion.button>
                  </div>

                  <div />

                  <div className="w-full flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSolution("possuiHelpdeskSla")}
                      className={getButtonClass(formData.possuiHelpdeskSla)}
                    >
                      <div className="skew-x-[6deg]">
                        <span className="block font-bold text-[9px] uppercase opacity-60 mb-1">SOLUÇÃO F</span>
                        <span className="text-xs font-bold leading-tight line-clamp-2">Helpdesk SLA e Logística</span>
                      </div>
                    </motion.button>
                  </div>

                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-[#E2E8F0]">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={handleFinishQuiz}
                  className="w-2/3 py-3.5 rounded-xl font-bold bg-[#00E5FF] text-slate-950 hover:bg-[#00d0e6] shadow-[0_0_20px_rgba(0,240,255,0.2)] text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Analisar Minha Operação
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="analyzing"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center py-10 space-y-8 flex flex-col items-center justify-center"
            >
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-[#00E5FF] glow-text-cyan animate-pulse">
                  Conectando Redes...
                </h2>
                <p className="text-sm text-slate-550 max-w-sm mx-auto">
                  O Polvo da Octadesk está processando sua árvore de decisão e consolidando seus dados offline...
                </p>
              </div>

              <PolvoAnimation status="processing" />

              <div className="w-full max-w-xs bg-slate-200 rounded-full h-3 border border-[#E2E8F0] overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#0052CC] to-[#00E5FF] shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono text-xs text-[#00E5FF] tracking-widest uppercase">
                {Math.round(progress)}% ANALISADO
              </span>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="results"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <div className="mb-4 flex justify-center">
                <PolvoAnimation status="success" />
              </div>
              <ResultadoTrilha 
                trilha={state.replace("trilha_", "") as any} 
                respostas={{
                  tamanhoOperacao: formData.tamanhoOperacao as TamanhoOperacao,
                  totalFerramentas: formData.totalFerramentas as any,
                  possuiCarrinhoAbandonado: formData.possuiCarrinhoAbandonado,
                  possuiIaVendas: formData.possuiIaVendas,
                  possuiNotificacaoStatus: formData.possuiNotificacaoStatus,
                  possuiIaDuvidasStatus: formData.possuiIaDuvidasStatus,
                  possuiEmissaoNotas: formData.possuiEmissaoNotas,
                  possuiHelpdeskSla: formData.possuiHelpdeskSla
                }}
                onReset={handleReset} 
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <footer className="mt-8 text-center z-10">
        <button
          onClick={() => setIsAdminOpen(true)}
          className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-600 hover:border-slate-350 border border-transparent rounded-lg transition-all cursor-pointer"
        >
          [ Painel de Controle ]
        </button>
      </footer>

      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      
    </main>
  );
}
