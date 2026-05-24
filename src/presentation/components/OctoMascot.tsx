import React from 'react';

interface OctoMascotProps {
  estadoAnimação?: 'floating' | 'thinking' | 'success';
  onClick?: () => void;
}

export const OctoMascot: React.FC<OctoMascotProps> = ({ estadoAnimação = 'floating', onClick }) => {
  // Cores dinâmicas com base no estado de animação/stage
  const isDarkStage = estadoAnimação === 'thinking' || estadoAnimação === 'success';
  const colorPrimary = isDarkStage ? '#00E5FF' : '#002B5C'; // Ciano neon vs Navy
  const colorSecondary = isDarkStage ? '#0052CC' : '#FFFFFF'; // Brand blue vs Branco
  const colorPupil = isDarkStage ? '#00E5FF' : '#002B5C';

  return (
    <div className="octo-container" onClick={onClick}>
      <style>{`
        .octo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 220px;
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
          filter: drop-shadow(0px 0px 12px rgba(0, 229, 255, 0.5));
        }

        .octo-svg.success {
          filter: drop-shadow(0px 0px 25px rgba(0, 229, 255, 0.8));
          animation: flatFloat 2s ease-in-out infinite, flatPulse 0.6s ease-in-out forwards;
        }

        @keyframes flatFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.02);
          }
        }

        @keyframes flatPulse {
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
        {/* Tentáculos simétricos geométricos planos (Thick rounded strokes) */}
        <g stroke={colorPrimary} strokeWidth="12" strokeLinecap="round" opacity="0.9">
          {/* Tentáculo Esquerdo 1 */}
          <path d="M 65 110 C 35 130, 25 160, 35 185" />
          {/* Tentáculo Esquerdo 2 */}
          <path d="M 82 120 C 65 145, 60 170, 70 190" />
          {/* Tentáculo Esquerdo 3 */}
          <path d="M 98 125 C 90 155, 90 175, 95 192" />
          
          {/* Tentáculo Direito 1 */}
          <path d="M 135 110 C 165 130, 175 160, 165 185" />
          {/* Tentáculo Direito 2 */}
          <path d="M 118 120 C 135 145, 140 170, 130 190" />
          {/* Tentáculo Direito 3 */}
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
          {/* Olho Esquerdo */}
          <circle cx="82" cy="82" r="13" fill={colorSecondary} />
          <circle cx="82" cy="82" r="5.5" fill={colorPupil} />

          {/* Olho Direito */}
          <circle cx="118" cy="82" r="13" fill={colorSecondary} />
          <circle cx="118" cy="82" r="5.5" fill={colorPupil} />
        </g>

        {/* Sorriso geométrico minimalista em arco suave */}
        <path 
          d="M 86 108 Q 100 118 114 108" 
          stroke={colorSecondary} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
      </svg>
    </div>
  );
};
