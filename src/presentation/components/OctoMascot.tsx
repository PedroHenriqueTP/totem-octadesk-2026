import React from 'react';

interface OctoMascotProps {
  estadoAnimação?: 'floating' | 'thinking' | 'success';
  onClick?: () => void;
}

export const OctoMascot: React.FC<OctoMascotProps> = ({ estadoAnimação = 'floating', onClick }) => {
  return (
    <div className="octo-container" onClick={onClick}>
      <style>{`
        .octo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 240px;
          margin: 0 auto;
        }
        
        /* O Polvo Base - Linhas limpas e ciano neon */
        .octo-svg {
          width: 100%;
          height: auto;
          transform-origin: center;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Estado Flutuação Contínua (Default) */
        .anima-floating {
          animation: deepDiveFloat 4s ease-in-out infinite;
        }

        /* Estado Processando Diagnóstico (Quiz) */
        .anima-thinking {
          animation: deepDiveThink 1.5s ease-in-out infinite;
          filter: drop-shadow(0px 0px 15px rgba(0, 229, 255, 0.6));
        }

        /* Estado Sucesso (Direcionamento de Fluxo) */
        .anima-success {
          animation: deepDiveSuccess 0.6s ease-in-out forwards;
          filter: drop-shadow(0px 0px 20px rgba(0, 229, 255, 0.8));
        }

        @keyframes deepDiveFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }

        @keyframes deepDiveThink {
          0%, 100% { transform: rotate(-3deg) scale(1); }
          50% { transform: rotate(3deg) scale(1.01); }
        }

        @keyframes deepDiveSuccess {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1.05); }
        }

        .octo-interactive-element {
          transition: fill 0.3s ease;
        }
        
        .octo-container:hover .octo-svg {
          filter: drop-shadow(0px 0px 12px rgba(0, 229, 255, 0.4));
        }
      `}</style>

      {/* SVG Estruturado para o Engine de Renderização */}
      <svg 
        className={`octo-svg anima-${estadoAnimação}`} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradiente do corpo fidedigno ao original */}
          <linearGradient id="bodyGradient" x1="100" y1="40" x2="100" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0052CC" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          {/* Gradiente do headset */}
          <linearGradient id="headsetGrad" x1="40" y1="90" x2="160" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Tentáculos com preenchimento do gradiente do corpo e contorno ciano neon */}
        <g id="octo-tentacles" fill="url(#bodyGradient)" stroke="#00E5FF" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M60 140Q40 170 30 190Q45 190 65 155Z"/>
          <path d="M85 148Q80 180 80 195Q95 195 95 150Z"/>
          <path d="M115 150Q120 180 120 195Q105 195 105 148Z"/>
          <path d="M140 140Q160 170 170 190Q155 190 135 155Z"/>
        </g>

        {/* Headset Premium Polido */}
        <g id="octo-headset">
          <path d="M40 90C40 50 70 30 100 30C130 30 160 50 160 90" stroke="url(#headsetGrad)" strokeWidth="7" strokeLinecap="round"/>
          <rect x="28" y="78" width="16" height="28" rx="5" fill="#475569" stroke="#94A3B8" strokeWidth="2"/>
          <rect x="156" y="78" width="16" height="28" rx="5" fill="#475569" stroke="#94A3B8" strokeWidth="2"/>
          <path d="M44 102Q55 125 80 120" stroke="#94A3B8" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <circle cx="80" cy="120" r="3.5" fill="#00E5FF" className="octo-interactive-element"/>
        </g>

        {/* Corpo e Cabeça (Formas suaves - DNA Octadesk) com contorno ciano neon */}
        <g id="octo-head">
          <circle cx="100" cy="95" r="55" fill="url(#bodyGradient)" stroke="#00E5FF" strokeWidth="2"/>
          {/* Olhos limpos e expressivos */}
          <circle cx="80" cy="85" r="14" fill="white" stroke="#00E5FF" strokeWidth="1.5"/>
          <circle cx="80" cy="85" r="6" fill="#0052CC"/>
          <circle cx="120" cy="85" r="14" fill="white" stroke="#00E5FF" strokeWidth="1.5"/>
          <circle cx="120" cy="85" r="6" fill="#0052CC"/>
          {/* Sorriso Simples */}
          <path d="M85 115Q100 125 115 115" stroke="#1E293B" strokeWidth="4" strokeLinecap="round"/>
        </g>
      </svg>
    </div>
  );
};
