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
          max-width: 320px;
          margin: 0 auto;
        }
        
        /* O Polvo Base - Linhas limpas inspiradas na marca */
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
          filter: drop-shadow(0px 0px 15px rgba(0, 119, 255, 0.6));
        }

        /* Estado Sucesso (Direcionamento de Fluxo) */
        .anima-success {
          animation: deepDiveSuccess 0.6s ease-in-out forwards;
          filter: drop-shadow(0px 0px 20px rgba(0, 218, 112, 0.7));
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
          filter: drop-shadow(0px 0px 12px rgba(0, 218, 112, 0.4));
        }
      `}</style>

      {/* SVG Estruturado para o Engine de Renderização */}
      <svg 
        className={`octo-svg anima-${estadoAnimação}`} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Headset Premium Polido */}
        <g id="octo-headset">
          <path d="M40 90C40 50 70 30 100 30C130 30 160 50 160 90" stroke="#001B3D" strokeWidth="8" strokeLinecap="round"/>
          <rect x="30" y="80" width="16" height="30" rx="6" fill="#001B3D"/>
          <rect x="154" y="80" width="16" height="30" rx="6" fill="#001B3D"/>
          <path d="M46 105C46 120 60 130 75 125" stroke="#001B3D" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="75" cy="125" r="4" fill="#002d62" className="octo-interactive-element"/>
        </g>

        {/* Corpo e Cabeça (Formas suaves - DNA Octadesk) */}
        <g id="octo-head">
          <circle cx="100" cy="95" r="55" fill="#003566"/>
          {/* Olhos limpos e acertivos (Idênticos à marca) */}
          <circle cx="80" cy="85" r="14" fill="white"/>
          <circle cx="80" cy="85" r="6" fill="#001B3D"/>
          <circle cx="120" cy="85" r="14" fill="white"/>
          <circle cx="120" cy="85" r="6" fill="#001B3D"/>
          {/* Sorriso Simples em Arco */}
          <path d="M85 115Q100 125 115 115" stroke="#001B3D" strokeWidth="4" strokeLinecap="round"/>
        </g>

        {/* Tentáculos simplificados para animação leve via Skew/Translate */}
        <g id="octo-tentacles" fill="#003566">
          <path d="M60 140Q40 170 30 190Q45 190 65 155Z"/>
          <path d="M85 148Q80 180 80 195Q95 195 95 150Z"/>
          <path d="M115 150Q120 180 120 195Q105 195 105 148Z"/>
          <path d="M140 140Q160 170 170 190Q155 190 135 155Z"/>
        </g>
      </svg>
    </div>
  );
};
