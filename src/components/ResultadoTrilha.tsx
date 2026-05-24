import React from 'react';
import { RespostasQuiz } from '../types/diagnostico';

interface ResultadoTrilhaProps {
  trilha: 'Automacao' | 'Atendimento' | 'Controle' | 'Enterprise';
  respostas: RespostasQuiz;
  onReset: () => void;
}

export const ResultadoTrilha: React.FC<ResultadoTrilhaProps> = ({ trilha, respostas, onReset }) => {
  const estacaoNames = {
    Automacao: 'Automação',
    Atendimento: 'Atendimento',
    Controle: 'Controle',
    Enterprise: 'Enterprise',
  };

  const name = estacaoNames[trilha] || trilha;

  const isGrandeEmpresa =
    respostas.tamanhoOperacao === 'Mais de 100 colaboradores' ||
    respostas.tamanhoOperacao === 'De 21 a 100 colaboradores';

  let textoContexto = "";
  if (isGrandeEmpresa) {
    textoContexto = "Sua operação já roda em escala gigante e com uma estrutura robusta de funcionários! Notamos que a implementação estratégica das ferramentas certas da Octadesk vai blindar sua segurança de dados e otimizar todo o controle de SLA do seu ecossistema!";
  } else {
    textoContexto = "O potencial de crescimento do seu negócio é incrível! Com o número atual de colaboradores, automatizar os canais de atendimento com a Octadesk vai multiplicar a produtividade do seu time sem inflar os seus custos operacionais!";
  }

  if (respostas.possuiIaVendas === false) {
    textoContexto += " Identificamos que a falta de um Agente de IA para converter suas vendas é o seu ponto crítico atual! Vamos resolver isso agora mesmo!";
  }

  return (
    <div className="text-center space-y-8 py-4 flex flex-col items-center bg-[#F8FAFC]">
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-[0.35em] text-[#00E5FF] border border-[#00E5FF]/20 bg-[#F0FDFA] px-3 py-1 rounded-full">
          Decisão Concluída
        </span>
        <h2 className="text-3xl font-black text-slate-900">
          Sua Estação Recomendada
        </h2>
      </div>

      <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] w-full max-w-xl shadow-lg flex flex-col items-center">
        <span className="text-5xl mb-4">
          {trilha === 'Enterprise' && '👑'}
          {trilha === 'Automacao' && '⚡'}
          {trilha === 'Atendimento' && '💬'}
          {trilha === 'Controle' && '🛡️'}
        </span>
        <h3 className="text-3xl font-black text-[#00E5FF] tracking-tight uppercase mb-4">
          ESTAÇÃO {name.toUpperCase()}
        </h3>
        
        <p className="text-lg text-slate-700 leading-relaxed font-medium">
          Olá parceiro! Obrigado por participar do nosso diagnóstico! {textoContexto} Venha conosco e continue sua jornada na nossa <span className="font-black text-[#0052CC]">ESTAÇÃO {name.toUpperCase()}</span> com o nosso especialista! Estamos te esperando!
        </p>

        <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0] flex items-center justify-center gap-2 mt-6 w-full">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
            DADOS SALVOS OFFLINE COM SEGURANÇA! OBRIGADO POR PARTICIPAR!
          </span>
        </div>
      </div>

      <div className="w-full max-w-lg">
        <button
          onClick={onReset}
          className="w-full md:w-3/4 py-6 text-2xl font-black rounded-2xl tracking-wide uppercase bg-[#00E5FF] text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 mx-auto block mt-8 cursor-pointer"
        >
          Novo Atendimento
        </button>
      </div>
    </div>
  );
};

export default ResultadoTrilha;
