"use client";

import React, { useState } from 'react';
import { OctoMascot } from '../../presentation/components/OctoMascot';
import { quizJourneyConfig } from '../../shared/config/quiz-journey';

export default function SandboxPage() {
  const [mascotState, setMascotState] = useState<'floating' | 'thinking' | 'success'>('floating');
  const [selectedGradient, setSelectedGradient] = useState<string>('#001B3D');
  const [pillStatus, setPillStatus] = useState<'default' | 'correct' | 'incorrect'>('default');

  const gradientsList = [
    { name: 'Stage 1 (Cadastro - Superfície)', value: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)' },
    { name: 'Stage 2 (Quiz - Mergulho)', value: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' },
    { name: 'Stage 3 (Veredito - Abismo)', value: '#001B3D' },
  ];

  return (
    <main 
      className="min-h-screen p-8 flex flex-col items-center justify-start relative overflow-hidden transition-all duration-1000 ease-in-out text-slate-800"
      style={{ background: selectedGradient }}
    >
      {/* Container de Teste */}
      <div className="w-full max-w-4xl z-10 space-y-8 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
        <header className="border-b border-white/20 pb-4 text-center">
          <h1 className="text-3xl font-black text-white drop-shadow">OCTADESK VISUAL SANDBOX</h1>
          <p className="text-white/70 text-sm mt-1">Ambiente de refinamento estético e teste de transições em tempo real</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Lado Esquerdo: Controles */}
          <div className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-white/10 text-white">
            <h2 className="text-xl font-bold border-b border-white/10 pb-2">Controles de Estilo</h2>

            {/* Controle de Gradientes */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold block">1. Transição de Fundo (Gradientes)</label>
              <div className="flex flex-col gap-2">
                {gradientsList.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setSelectedGradient(g.value)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      selectedGradient === g.value 
                        ? "bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]" 
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Controle do Mascote */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold block">2. Estado do Mascote Polvo</label>
              <div className="grid grid-cols-3 gap-2">
                {(['floating', 'thinking', 'success'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setMascotState(s)}
                    className={`p-3 rounded-xl border text-center text-xs font-bold capitalize transition-all cursor-pointer ${
                      mascotState === s 
                        ? "bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]" 
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Controle de Status de Pílulas */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-bold block">3. Estados das Pílulas do Quiz</label>
              <div className="grid grid-cols-3 gap-2">
                {(['default', 'correct', 'incorrect'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setPillStatus(status)}
                    className={`p-3 rounded-xl border text-center text-xs font-bold capitalize transition-all cursor-pointer ${
                      pillStatus === status 
                        ? "bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]" 
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lado Direito: Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-950/40 border border-white/10 p-6 rounded-2xl min-h-[300px] text-white text-center space-y-6">
            <h2 className="text-sm uppercase tracking-widest text-[#00E5FF] font-black">Visual Preview</h2>
            
            {/* Mascot Preview */}
            <div className="w-48 h-48 flex items-center justify-center">
              <OctoMascot estadoAnimação={mascotState} />
            </div>

            {/* Pill Preview */}
            <div className="w-full space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Preview da Pílula</span>
              
              <div className="space-y-2 text-left">
                {pillStatus === 'default' && (
                  <button className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 text-white font-semibold transition-all">
                    Pílula Translúcida Padrão (Glassmorphism)
                  </button>
                )}
                {pillStatus === 'correct' && (
                  <div>
                    <button className="w-full text-left p-4 rounded-xl border border-[#00E5FF] bg-[#00E5FF]/20 text-white font-semibold shadow-[0_0_15px_rgba(0,229,255,0.3)] flex items-center justify-between">
                      Opção Certa Selecionada
                      <span className="w-5 h-5 rounded-full bg-[#00E5FF] text-slate-950 flex items-center justify-center text-[10px] font-black">✓</span>
                    </button>
                  </div>
                )}
                {pillStatus === 'incorrect' && (
                  <div className="space-y-2">
                    <button className="w-full text-left p-4 rounded-xl border border-red-500 bg-red-500/20 text-white font-semibold shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center justify-between">
                      Opção Errada Selecionada
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black">✗</span>
                    </button>
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs leading-relaxed">
                      <strong>Feedback de Erro:</strong> Aqui é exibida a explicação educativa de forma reativa no totem!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center text-white/50 text-xs border-t border-white/10 pt-4 font-mono">
          [ Sandbox Roteada: /sandbox ]
        </footer>
      </div>
    </main>
  );
}
