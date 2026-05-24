"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OctoMascot } from './OctoMascot';
import { LeadData, DiagnosticoResultado, processarDiagnosticoLead } from '../../core/quiz-bifurcation';
import { LocalStorageManager } from '../../infra/local-storage-manager';
import QuizCard from '../../components/QuizCard';
import AdminPanel from './AdminPanel';

export default function QuizApp() {
  const [step, setStep] = useState<number>(1);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState<LeadData>({
    nome: "",
    empresa: "",
    email: "",
    telefone: "",
    faturamentoMensal: "ate_50k", // Valor padrão para compatibilidade com o motor
    volumeVendasMes: "ate_100", // Valor padrão
    equipeAtendimento: "" as any,
    canalPrincipal: "" as any,
    maiorGargalo: "" as any,
    dorFinanceira: "" as any
  });

  const [diagnostico, setDiagnostico] = useState<DiagnosticoResultado | null>(null);

  // Efeito de animação de progresso do loading (Step 6)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 6) {
      setProgress(0);
      const startTime = Date.now();
      const duration = 2000;

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(currentProgress);

        if (elapsed >= duration) {
          clearInterval(interval);
          setStep(7); // Vai para o resultado final
        }
      }, 30);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleInputChange = (field: keyof LeadData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isFormValid =
    formData.nome.trim().length >= 2 &&
    formData.empresa.trim().length >= 2 &&
    isEmailValid(formData.email) &&
    formData.telefone.trim().length >= 8;

  // Processa a seleção das opções no Quiz (Q1 e Q2 avançam, Q3 calcula e finaliza)
  const handleSelectOption = (field: keyof LeadData, value: string) => {
    handleInputChange(field, value);
    setTimeout(() => {
      handleNextStep();
    }, 300);
  };

  const handleSelectQ3 = (optionValue: 'automacao_vendas' | 'centralizar' | 'metricas' | 'escala') => {
    setFormData((prev) => {
      const updated = { ...prev };
      
      // Mapeamento lógico de soluções positivas para alimentar as chaves internas do motor de triagem
      if (optionValue === 'automacao_vendas') {
        updated.maiorGargalo = 'demora_whatsapp';
        updated.dorFinanceira = 'abandono_carrinho';
        updated.canalPrincipal = 'ecommerce'; // Força para acionar a trilha de automação ecommerce
      } else if (optionValue === 'centralizar') {
        updated.maiorGargalo = 'centralizar_numero';
        updated.dorFinanceira = 'saida_chat';
      } else if (optionValue === 'metricas') {
        updated.maiorGargalo = 'falta_metricas';
        updated.dorFinanceira = 'pos_venda';
      } else if (optionValue === 'escala') {
        updated.maiorGargalo = 'perda_historico';
        updated.dorFinanceira = 'pos_venda';
        updated.equipeAtendimento = 'mais_15'; // Força para acionar transbordo urgente comercial
        updated.faturamentoMensal = 'acima_500k'; // Força comercial urgente
      }

      // Se nas perguntas anteriores o usuário selecionou uma equipe de mais de 15 pessoas, força comercial urgente
      if (updated.equipeAtendimento === 'mais_15') {
        updated.faturamentoMensal = 'acima_500k';
      }

      const updatedLead = updated as LeadData;
      const result = processarDiagnosticoLead(updatedLead);
      setDiagnostico(result);
      LocalStorageManager.salvarLeadLocal(updatedLead, result);
      
      return updated;
    });

    setTimeout(() => {
      setStep(6); // VAI PARA O LOADING
    }, 300);
  };

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      setFormData({
        nome: "",
        empresa: "",
        email: "",
        telefone: "",
        faturamentoMensal: "ate_50k",
        volumeVendasMes: "ate_100",
        equipeAtendimento: "" as any,
        canalPrincipal: "" as any,
        maiorGargalo: "" as any,
        dorFinanceira: "" as any
      });
      setDiagnostico(null);
      setProgress(0);
      setStep(1);
    }
  };

  const getMascotState = (): 'floating' | 'thinking' | 'success' => {
    if (step === 6) return 'thinking';
    if (step === 7) return 'success';
    return 'floating';
  };

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" as const } }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 transition-all duration-1000 ease-in-out relative overflow-hidden bg-[#F8FAFC]">
      
      {/* Elementos visuais abstratos de fundo (Originais e estáveis) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-15">
        <div className="absolute top-0 left-0 w-64 h-64">
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

        <div className="absolute top-0 right-0 w-64 h-64 transform scale-x-[-1]">
          <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
            <path d="M 0 0 C 40 40, 100 20, 140 80 C 160 110, 150 140, 110 160 C 90 170, 70 150, 80 130 C 90 110, 120 120, 110 90 C 100 60, 50 60, 0 0 Z" fill="url(#tentacleGrad)" />
          </svg>
        </div>

        <div className="absolute bottom-0 left-0 w-64 h-64 transform scale-y-[-1]">
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

        <div className="absolute bottom-0 right-0 w-64 h-64 transform scale-x-[-1] scale-y-[-1]">
          <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
            <path d="M 0 0 C 40 40, 100 20, 140 80 C 160 110, 150 140, 110 160 C 90 170, 70 150, 80 130 C 90 110, 120 120, 110 90 C 100 60, 50 60, 0 0 Z" fill="url(#tentacleGrad2)" />
          </svg>
        </div>
      </div>

      <header className="w-full max-w-4xl flex justify-between items-center z-10 mb-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0052CC] to-[#00E5FF] flex items-center justify-center font-bold text-slate-955 text-lg shadow-[0_0_12px_rgba(0,240,255,0.35)]">
            O
          </div>
          <span className="font-extrabold tracking-wider text-sm uppercase text-slate-900">
            Octadesk <span className="text-[#00E5FF] font-light">Interactive</span>
          </span>
        </div>
        <span className="text-xs font-bold text-[#00E5FF] uppercase tracking-[0.2em] bg-[#F0FDFA] px-3 py-1.5 rounded-full border border-[#00E5FF]/20">
          Fórum E-commerce Brasil 2026
        </span>
      </header>

      {/* Contêiner de cartão principal com estilo de vidro claro e estável */}
      <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] shadow-xl p-8 rounded-3xl z-10 relative overflow-hidden transition-all duration-350">
        
        {step !== 6 && (
          <div className="mb-6 flex justify-center">
            <OctoMascot estadoAnimação={getMascotState()} />
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
              className="text-center py-6 space-y-8 flex flex-col items-center"
            >
              <div className="space-y-4">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug text-slate-955 max-w-xl mx-auto">
                  Olá parceiro! Seja bem vindo ao estande Octadesk no Fórum Ecommerce Brasil, participe da nossa jornada às profundezas do oceano Octadesk.
                </h1>
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
                          formData.telefone && formData.telefone.trim().length >= 8
                            ? "border-emerald-500/50 focus:ring-emerald-500/20"
                            : "border-[#E2E8F0] focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
                        }`}
                        value={formData.telefone || ""}
                        onChange={(e) => handleInputChange("telefone", e.target.value)}
                      />
                      {formData.telefone && formData.telefone.trim().length >= 8 && (
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

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Nome da Empresa *</label>
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
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-3.5 rounded-xl border border-slate-350 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
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
              key="equipe"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1 text-center md:text-left">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0052CC] font-bold">Passo 1 de 3</span>
                <h2 className="text-2xl font-black text-slate-900">Tamanho da Equipe</h2>
                <p className="text-sm text-slate-500">Quantas pessoas atuam diretamente no seu atendimento?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'eu_mais_um', label: 'Eu + 1 colaborador' },
                  { value: '3_5', label: '3 a 5 colaboradores' },
                  { value: '6_15', label: '6 a 15 colaboradores' },
                  { value: 'mais_15', label: 'Mais de 15 colaboradores' },
                ].map((opt) => (
                  <QuizCard
                    key={opt.value}
                    label={opt.label}
                    isSelected={formData.equipeAtendimento === opt.value}
                    onClick={() => handleSelectOption('equipeAtendimento', opt.value)}
                    accentColor="cyan"
                  />
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="canal"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1 text-center md:text-left">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0052CC] font-bold">Passo 2 de 3</span>
                <h2 className="text-2xl font-black text-slate-900">Canais de Atendimento Principais</h2>
                <p className="text-sm text-slate-500">Por onde seus clientes entram em contato com mais frequência?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'whatsapp_instagram', label: 'WhatsApp & Instagram' },
                  { value: 'ecommerce', label: 'E-commerce' },
                  { value: 'loja_fisica', label: 'Omnichannel' },
                  { value: 'b2b', label: 'Corporativo' },
                ].map((opt) => (
                  <QuizCard
                    key={opt.value}
                    label={opt.label}
                    isSelected={formData.canalPrincipal === opt.value}
                    onClick={() => handleSelectOption('canalPrincipal', opt.value)}
                    accentColor="cyan"
                  />
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="ferramenta"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="space-y-1 text-center md:text-left">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0052CC] font-bold">Passo 3 de 3</span>
                <h2 className="text-2xl font-black text-slate-900">Objetivo de Otimização</h2>
                <p className="text-sm text-slate-500">O que você gostaria de otimizar ou implementar na sua operação hoje?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'automacao_vendas', label: 'Automação de fluxos' },
                  { value: 'centralizar', label: 'Centralização de números' },
                  { value: 'metricas', label: 'Relatórios e dashboards' },
                  { value: 'escala', label: 'Atendimento em escala' },
                ].map((opt) => (
                  <QuizCard
                    key={opt.value}
                    label={opt.label}
                    isSelected={
                      opt.value === 'automacao_vendas' ? formData.dorFinanceira === 'abandono_carrinho' :
                      opt.value === 'centralizar' ? formData.maiorGargalo === 'centralizar_numero' :
                      opt.value === 'metricas' ? formData.maiorGargalo === 'falta_metricas' :
                      formData.equipeAtendimento === 'mais_15' && formData.faturamentoMensal === 'acima_500k'
                    }
                    onClick={() => handleSelectQ3(opt.value as any)}
                    accentColor="cyan"
                  />
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="loading"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center py-8 space-y-8 flex flex-col items-center justify-center"
            >
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-[#0052CC] animate-pulse">
                  Conectando Redes...
                </h2>
                <p className="text-sm text-slate-550 max-w-sm mx-auto">
                  O Polvo da Octadesk está processando sua árvore de decisão e salvando seus dados localmente...
                </p>
              </div>

              <div className="py-2">
                <OctoMascot estadoAnimação="thinking" />
              </div>

              <div className="w-full max-w-xs bg-slate-200 rounded-full h-3 border border-[#E2E8F0] overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#0052CC] to-[#00E5FF] shadow-[0_0_10px_rgba(0,82,204,0.3)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono text-xs text-[#0052CC] tracking-widest uppercase font-bold">
                {Math.round(progress)}% ANALISADO
              </span>
            </motion.div>
          )}

          {step === 7 && diagnostico && (
            <motion.div
              key="results"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center space-y-8 py-4 flex flex-col items-center"
            >
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-[0.35em] text-[#00E5FF] border border-[#00E5FF]/20 bg-[#F0FDFA] px-3 py-1 rounded-full">
                  Decisão Concluída
                </span>
                <h2 className="text-3xl font-black text-slate-900">
                  Sua Estação Recomendada
                </h2>
              </div>

              <div className="py-2">
                <OctoMascot estadoAnimação="success" />
              </div>

              {/* Card Premium de Destaque com Borda Brilhante Ciano Neon */}
              <div className="p-8 rounded-2xl bg-white border-2 border-[#00E5FF] w-full max-w-xl shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col items-center">
                <span className="text-5xl mb-4">
                  {diagnostico.destino === 'TRANSBORDO_COMERCIAL_URGENTE' && '👑'}
                  {diagnostico.destino === 'TRILHA_AUTOMACAO_ECOMMERCE' && '⚡'}
                  {diagnostico.destino === 'TRILHA_GESTAO_WHATSAPP' && '💬'}
                  {diagnostico.destino === 'TRIAGEM_PADRAO' && '🛡️'}
                </span>
                <h3 className="text-3xl font-black text-[#0052CC] tracking-tight uppercase mb-4">
                  {diagnostico.destino.replace("TRILHA_", "").replace("TRIAGEM_", "").replace(/_/g, " ")}
                </h3>
                
                <p className="text-lg text-slate-700 leading-relaxed font-semibold mb-4">
                  Olá parceiro! Obrigado por participar do nosso diagnóstico! {diagnostico.mensagemInterface}
                </p>

                <p className="text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-4 w-full text-left">
                  <span className="font-extrabold text-slate-700 block mb-1 uppercase tracking-wider text-xs">FOCO DA FERRAMENTA:</span>
                  {diagnostico.focoProduto}
                </p>

                {diagnostico.brindeQualificado ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-2 mt-6 w-full">
                    <span className="text-lg animate-bounce">🎁</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      BRINDE ADICIONAL QUALIFICADO! RETIRE NO BALCÃO!
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0] flex items-center justify-center gap-2 mt-6 w-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
                      DADOS SALVOS OFFLINE COM SEGURANÇA! OBRIGADO POR PARTICIPAR!
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full max-w-lg">
                <button
                  onClick={handleReset}
                  className="w-full md:w-3/4 py-6 text-2xl font-black rounded-2xl tracking-wide uppercase bg-[#00E5FF] text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 mx-auto block mt-8 cursor-pointer"
                >
                  Novo Atendimento
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <footer className="mt-8 text-center z-10">
        <button
          onClick={() => setIsAdminOpen(true)}
          className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-650 border border-transparent rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
        >
          [ Painel de Controle ]
        </button>
      </footer>

      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      
    </main>
  );
}
