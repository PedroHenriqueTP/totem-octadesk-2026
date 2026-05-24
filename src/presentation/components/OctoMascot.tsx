import React from 'react';

interface OctoMascotProps {
  estadoAnimação?: 'floating_light' | 'floating_dark' | 'thinking' | 'success';
  onClick?: () => void;
}

export const OctoMascot: React.FC<OctoMascotProps> = ({ estadoAnimação = 'floating_light', onClick }) => {
  // Configuração de cores com base no contraste necessário para cada fundo
  const isLight = estadoAnimação === 'floating_light';
  
  const colorPrimary = isLight ? '#002B5C' : '#00E5FF'; // Navy vs Ciano Neon
  const colorSecondary = isLight ? '#FFFFFF' : '#002B5C'; // Branco vs Navy
  const colorPupil = isLight ? '#002B5C' : '#00E5FF'; // Navy vs Ciano Neon

  return (
    <div className="octo-container" onClick={onClick}>
      <style>{`
        .octo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 200px;
          margin: 0 auto;
        }
        
        .octo-svg {
          width: 100%;
          height: auto;
          transform-origin: center;
          transition: all 0.5s ease-in-out;
          animation: flatFloat 4s ease-in-out infinite;
        }

        .octo-svg.thinking {
          filter: drop-shadow(0px 0px 15px rgba(0, 229, 255, 0.6));
        }

        .octo-svg.success {
          filter: drop-shadow(0px 0px 30px rgba(0, 229, 255, 0.9));
          animation: flatFloat 2s ease-in-out infinite, successPulse 0.6s ease-in-out forwards;
        }

        @keyframes flatFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1.05); }
        }
      `}</style>

      <svg 
        className={`octo-svg ${estadoAnimação}`} 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tentáculos geométricos planos simétricos */}
        <g stroke={colorPrimary} strokeWidth="12" strokeLinecap="round" opacity="0.9" className="transition-all duration-500">
          <path d="M 65 110 C 35 130, 25 160, 35 185" />
          <path d="M 82 120 C 65 145, 60 170, 70 190" />
          <path d="M 98 125 C 90 155, 90 175, 95 192" />
          
          <path d="M 135 110 C 165 130, 175 160, 165 185" />
          <path d="M 118 120 C 135 145, 140 170, 130 190" />
          <path d="M 102 125 C 110 155, 110 175, 105 192" />
        </g>

        {/* Corpo perfeitamente circular liso */}
        <circle 
          cx="100" 
          cy="90" 
          r="52" 
          fill={colorPrimary} 
          className="transition-colors duration-500"
        />

        {/* Olhos concêntricos vazados */}
        <g className="transition-colors duration-500">
          <circle cx="82" cy="82" r="13" fill={colorSecondary} />
          <circle cx="82" cy="82" r="5.5" fill={colorPupil} />

          <circle cx="118" cy="82" r="13" fill={colorSecondary} />
          <circle cx="118" cy="82" r="5.5" fill={colorPupil} />
        </g>

        {/* Sorriso geométrico minimalista em arco suave */}
        <path 
          d="M 86 108 Q 100 118 114 108" 
          stroke={colorSecondary} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          className="transition-colors duration-500"
        />
      </svg>
    </div>
  );
};
