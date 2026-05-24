"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OctoMascot } from './OctoMascot';
import { LeadData, DiagnosticoResultado, processarDiagnosticoLead } from '../../core/quiz-bifurcation';
import { LocalStorageManager } from '../../infra/local-storage-manager';
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
    faturamentoMensal: "" as any,
    volumeVendasMes: "" as any,
    equipeAtendimento: "" as any,
    maiorGargalo: "" as any,
    canalPrincipal: "" as any,
    dorFinanceira: "" as any
  });

  const [diagnostico, setDiagnostico] = useState<DiagnosticoResultado | null>(null);

  // Animação de loading no passo 9
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 9) {
      setProgress(0);
      const startTime = Date.now();
      const duration = 2000;

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(currentProgress);

        if (elapsed >= duration) {
          clearInterval(interval);
          setStep(10);
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

  const handleSelectOption = (field: keyof LeadData, value: string) => {
    handleInputChange(field, value);
    
    // Se for a última pergunta do quiz, processa o diagnóstico e salva
    if (field === 'dorFinanceira') {
      const updatedData = { ...formData, [field]: value } as LeadData;
      const result = processarDiagnosticoLead(updatedData);
      setDiagnostico(result);
      LocalStorageManager.salvarLeadLocal(updatedData, result);
      setTimeout(() => {
        setStep(9); // Tela de processamento
      }, 300);
    } else {
      setTimeout(() => {
        handleNextStep();
      }, 300);
    }
  };

  const handleReset = () => {
    setFormData({
      nome: "",
      empresa: "",
      email: "",
      telefone: "",
      faturamentoMensal: "" as any,
      volumeVendasMes: "" as any,
      equipeAtendimento: "" as any,
      maiorGargalo: "" as any,
      canalPrincipal: "" as any,
      dorFinanceira: "" as any
    });
    setDiagnostico(null);
    setProgress(0);
    setStep(1);
  };

  const getMascotState = (): 'floating' | 'thinking' | 'success' => {
    if (step === 9) return 'thinking';
    if (step === 10) return 'success';
    return 'floating';
  };

  const slideVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.25, ease: "easeIn" as const } }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-white relative overflow-hidden bg-[#001B3D]">
      
      {/* Elementos visuais abstratos de fundo */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#0077FF] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#002B5C] blur-[120px]" />
      </div>

      <header className="w-full max-w-4xl flex justify-between items-center z-10 mb-8 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0052CC] to-[#0077FF] flex items-center justify-center font-black text-white text-xl shadow-[0_0_15px_rgba(0,119,255,0.4)]">
            O
          </div>
          <span className="font-extrabold tracking-wider text-base uppercase">
            Octadesk <span className="text-[#0077FF] font-light">Interactive</span>
          </span>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-[#8CA3C7] font-semibold bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          Fórum E-commerce Brasil 2026
        </div>
      </header>

      <div className="w-full max-w-3xl bg-[#002B5C]/80 border border-white/10 backdrop-blur-md p-8 md:p-12 rounded-3xl z-10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] min-h-[500px] flex flex-col justify-center">
        
        {/* Renderização do Polvo no topo quando não estiver carregando ou no resultado */}
        {step < 9 && (
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
                <span className="text-xs font-bold text-[#0077FF] uppercase tracking-[0.3em] bg-[#0077FF]/10 px-4 py-2 rounded-full border border-[#0077FF]/20">
                  Deep Dive Diagnóstico
                </span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-snug max-w-2xl mx-auto">
                  Descubra os gargalos da sua operação e encontre a trilha ideal da Octadesk
                </h1>
                <p className="text-sm text-[#8CA3C7] max-w-lg mx-auto">
                  Participe do nosso diagnóstico e ganhe uma recomendação comercial personalizada com o Polvo da Octadesk no Fórum.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(0, 119, 255, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNextStep}
                className="w-full max-w-xs py-5 bg-[#0077FF] hover:bg-[#268eff] text-white font-extrabold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                Viajar às Profundezas
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
              className="space-y-6 py-4"
            >
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-black">
                  Identificação do Lead
                </h2>
                <p className="text-sm text-[#8CA3C7]">
                  Preencha os campos abaixo para iniciar a sua jornada de qualificação.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Seu Nome Completo"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-white placeholder-[#8CA3C7] focus:outline-none focus:border-[#0077FF] focus:ring-1 focus:ring-[#0077FF]"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                    />
                    {formData.nome.trim().length >= 2 && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#00DA70] font-bold">✓</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nome da Empresa"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-white placeholder-[#8CA3C7] focus:outline-none focus:border-[#0077FF] focus:ring-1 focus:ring-[#0077FF]"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                    />
                    {formData.empresa.trim().length >= 2 && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#00DA70] font-bold">✓</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="E-mail Corporativo"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-white placeholder-[#8CA3C7] focus:outline-none focus:border-[#0077FF] focus:ring-1 focus:ring-[#0077FF]"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                    {isEmailValid(formData.email) && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#00DA70] font-bold">✓</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="WhatsApp (com DDD)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-5 text-white placeholder-[#8CA3C7] focus:outline-none focus:border-[#0077FF] focus:ring-1 focus:ring-[#0077FF]"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                    />
                    {formData.telefone.trim().length >= 8 && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#00DA70] font-bold">✓</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-4 rounded-xl border border-white/20 text-[#8CA3C7] font-bold hover:bg-white/5 transition-colors cursor-pointer text-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!isFormValid}
                  className={`w-2/3 py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    isFormValid
                      ? "bg-[#0077FF] hover:bg-[#268eff] text-white shadow-lg cursor-pointer"
                      : "bg-white/5 text-[#8CA3C7] cursor-not-allowed border border-white/5"
                  }`}
                >
                  Começar Diagnóstico
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="faturamento"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0077FF]">Passo 1 de 6</span>
                <h2 className="text-2xl font-black">Faturamento Mensal Estimado</h2>
                <p className="text-sm text-[#8CA3C7]">Qual é a faixa de faturamento mensal atual da sua operação?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'ate_50k', label: 'Até R$ 50.000' },
                  { value: '51k_200k', label: 'R$ 51.000 a R$ 200.000' },
                  { value: '201k_500k', label: 'R$ 201.000 a R$ 500.000' },
                  { value: 'acima_500k', label: 'Acima de R$ 500.000' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption('faturamentoMensal', opt.value)}
                    className={`quiz-card flex flex-col justify-center items-center text-center p-6 ${
                      formData.faturamentoMensal === opt.value ? 'selected' : ''
                    }`}
                  >
                    <span className="text-lg font-bold">{opt.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-4 rounded-xl border border-white/20 text-[#8CA3C7] font-bold hover:bg-white/5 transition-colors cursor-pointer text-sm"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="volume"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0077FF]">Passo 2 de 6</span>
                <h2 className="text-2xl font-black">Volume Mensal de Vendas</h2>
                <p className="text-sm text-[#8CA3C7]">Quantos pedidos/leads sua operação gerencia em média por mês?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'ate_100', label: 'Até 100 vendas' },
                  { value: '101_500', label: '101 a 500 vendas' },
                  { value: '501_2000', label: '501 a 2.000 vendas' },
                  { value: 'mais_2000', label: 'Mais de 2.000 vendas' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption('volumeVendasMes', opt.value)}
                    className={`quiz-card flex flex-col justify-center items-center text-center p-6 ${
                      formData.volumeVendasMes === opt.value ? 'selected' : ''
                    }`}
                  >
                    <span className="text-lg font-bold">{opt.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-4 rounded-xl border border-white/20 text-[#8CA3C7] font-bold hover:bg-white/5 transition-colors cursor-pointer text-sm"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="equipe"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0077FF]">Passo 3 de 6</span>
                <h2 className="text-2xl font-black">Tamanho da Equipe</h2>
                <p className="text-sm text-[#8CA3C7]">Quantas pessoas atuam diretamente no atendimento ao cliente?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'eu_mais_um', label: 'Eu + 1 colaborador' },
                  { value: '3_5', label: '3 a 5 colaboradores' },
                  { value: '6_15', label: '6 a 15 colaboradores' },
                  { value: 'mais_15', label: 'Mais de 15 colaboradores' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption('equipeAtendimento', opt.value)}
                    className={`quiz-card flex flex-col justify-center items-center text-center p-6 ${
                      formData.equipeAtendimento === opt.value ? 'selected' : ''
                    }`}
                  >
                    <span className="text-lg font-bold">{opt.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-4 rounded-xl border border-white/20 text-[#8CA3C7] font-bold hover:bg-white/5 transition-colors cursor-pointer text-sm"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="canal"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0077FF]">Passo 4 de 6</span>
                <h2 className="text-2xl font-black">Canal Principal de Contato</h2>
                <p className="text-sm text-[#8CA3C7]">Por onde seus clientes chegam com mais frequência?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'ecommerce', label: 'E-commerce / Loja Virtual' },
                  { value: 'whatsapp_instagram', label: 'WhatsApp e Instagram' },
                  { value: 'loja_fisica', label: 'Loja Física / Ponto de Venda' },
                  { value: 'b2b', label: 'B2B / Vendas Corporativas' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption('canalPrincipal', opt.value)}
                    className={`quiz-card flex flex-col justify-center items-center text-center p-6 ${
                      formData.canalPrincipal === opt.value ? 'selected' : ''
                    }`}
                  >
                    <span className="text-lg font-bold">{opt.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-4 rounded-xl border border-white/20 text-[#8CA3C7] font-bold hover:bg-white/5 transition-colors cursor-pointer text-sm"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div
              key="gargalo"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0077FF]">Passo 5 de 6</span>
                <h2 className="text-2xl font-black">Maior Gargalo Operacional</h2>
                <p className="text-sm text-[#8CA3C7]">O que mais atrasa ou impede a eficiência do seu time hoje?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'demora_whatsapp', label: 'Demora no retorno de mensagens' },
                  { value: 'centralizar_numero', label: 'Falta de número centralizado' },
                  { value: 'falta_metricas', label: 'Falta de métricas e relatórios' },
                  { value: 'perda_historico', label: 'Perda do histórico de conversas' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption('maiorGargalo', opt.value)}
                    className={`quiz-card flex flex-col justify-center items-center text-center p-6 ${
                      formData.maiorGargalo === opt.value ? 'selected' : ''
                    }`}
                  >
                    <span className="text-lg font-bold">{opt.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-4 rounded-xl border border-white/20 text-[#8CA3C7] font-bold hover:bg-white/5 transition-colors cursor-pointer text-sm"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div
              key="dor"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0077FF]">Passo 6 de 6</span>
                <h2 className="text-2xl font-black">Dor Financeira Crítica</h2>
                <p className="text-sm text-[#8CA3C7]">Onde sua empresa está perdendo mais faturamento?</p>
              </div>

              <div className="quiz-grid">
                {[
                  { value: 'abandono_carrinho', label: 'Abandono de carrinho' },
                  { value: 'esquecimento_pix_boleto', label: 'Esquecimento de PIX / Boleto' },
                  { value: 'saida_chat', label: 'Saída do chat sem compra' },
                  { value: 'pos_venda', label: 'Atrasos no pós-venda' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption('dorFinanceira', opt.value)}
                    className={`quiz-card flex flex-col justify-center items-center text-center p-6 ${
                      formData.dorFinanceira === opt.value ? 'selected' : ''
                    }`}
                  >
                    <span className="text-lg font-bold">{opt.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleBackStep}
                  className="w-1/3 py-4 rounded-xl border border-white/20 text-[#8CA3C7] font-bold hover:bg-white/5 transition-colors cursor-pointer text-sm"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 9 && (
            <motion.div
              key="loading"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center py-10 space-y-8 flex flex-col items-center justify-center"
            >
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-[#0077FF] glow-text-cyan animate-pulse">
                  Conectando Redes...
                </h2>
                <p className="text-sm text-[#8CA3C7] max-w-sm mx-auto">
                  O Polvo da Octadesk está processando sua árvore de decisão e salvando seus dados localmente...
                </p>
              </div>

              <div className="py-4">
                <OctoMascot estadoAnimação="thinking" />
              </div>

              <div className="w-full max-w-xs bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#0052CC] to-[#0077FF] shadow-[0_0_10px_rgba(0,119,255,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="font-mono text-xs text-[#0077FF] tracking-widest uppercase font-bold">
                {Math.round(progress)}% ANALISADO
              </span>
            </motion.div>
          )}

          {step === 10 && diagnostico && (
            <motion.div
              key="results"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center space-y-8 py-2 flex flex-col items-center"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#00DA70] border border-[#00DA70]/20 bg-[#00DA70]/10 px-4 py-2 rounded-full font-bold">
                  Decisão Concluída
                </span>
                <h2 className="text-3xl font-black">Sua Estação Recomendada</h2>
              </div>

              <div className="py-2">
                <OctoMascot estadoAnimação="success" />
              </div>

              {/* Card Premium de Destaque com Borda Brilhante */}
              <div className="p-8 rounded-2xl bg-[#002B5C] border-2 border-[#00DA70] w-full max-w-xl shadow-[0_0_30px_rgba(0,218,112,0.15)] flex flex-col items-center space-y-4">
                <span className="text-5xl">
                  {diagnostico.destino === 'TRANSBORDO_COMERCIAL_URGENTE' && '👑'}
                  {diagnostico.destino === 'TRILHA_AUTOMACAO_ECOMMERCE' && '⚡'}
                  {diagnostico.destino === 'TRILHA_GESTAO_WHATSAPP' && '💬'}
                  {diagnostico.destino === 'TRIAGEM_PADRAO' && '🛡️'}
                </span>
                
                <h3 className="text-2xl font-black text-[#00DA70] tracking-tight uppercase">
                  {diagnostico.destino.replace(/_/g, " ")}
                </h3>
                
                <div className="h-[2px] w-1/3 bg-[#00DA70]/30 my-2" />

                <p className="text-base text-white/95 leading-relaxed font-semibold">
                  {diagnostico.mensagemInterface}
                </p>

                <p className="text-sm text-[#8CA3C7] leading-relaxed">
                  <span className="font-extrabold text-white block mb-1">FOCO DA SOLUÇÃO:</span>
                  {diagnostico.focoProduto}
                </p>

                {diagnostico.brindeQualificado ? (
                  <div className="p-3 bg-[#00DA70]/10 border border-[#00DA70]/30 rounded-xl flex items-center justify-center gap-2 mt-4 w-full">
                    <span className="text-lg">🎁</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00DA70]">
                      BRINDE ADICIONAL QUALIFICADO!
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 mt-4 w-full">
                    <span className="w-2 h-2 rounded-full bg-[#0077FF] animate-pulse"></span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#8CA3C7]">
                      Diagnóstico offline salvo com sucesso no Hub
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="w-full py-5 text-xl font-black rounded-2xl tracking-wide uppercase bg-[#0077FF] hover:bg-[#268eff] text-white shadow-lg transition-all cursor-pointer"
                >
                  Novo Atendimento
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <footer className="mt-12 text-center z-10">
        <button
          onClick={() => setIsAdminOpen(true)}
          className="px-4 py-2 text-xs font-mono text-[#8CA3C7] hover:text-white border border-transparent rounded-lg transition-all cursor-pointer uppercase tracking-wider"
        >
          [ Painel de Controle ]
        </button>
      </footer>

      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      
    </main>
  );
}
