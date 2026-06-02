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
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 220px;
          margin: 0 auto;
          user-select: none;
        }
        
        .octo-label {
          margin-top: 14px;
          margin-bottom: 24px;
          font-family: 'Inter', sans-serif;
          font-weight: 800; /* font-extrabold */
          font-size: 1.35rem;
          color: #001B3D;
          letter-spacing: -0.03em;
          text-align: center;
          text-transform: lowercase;
        }

        .octo-svg {
          width: 100%;
          height: auto;
          transform-origin: center;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          animation: float-minimal 4s ease-in-out infinite;
        }

        /* Efeitos de estado e ativação de brilho de fundo sutil e corporativo */
        .glow-backdrop {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          fill: #00D1A0;
          opacity: 0;
        }

        .octo-svg.thinking .glow-backdrop {
          opacity: 0.15;
          animation: glow-pulse 2s ease-in-out infinite alternate;
        }

        .octo-svg.success .glow-backdrop {
          opacity: 0.3;
          animation: success-glow 1.5s ease-in-out infinite alternate;
        }

        .octo-svg.success {
          transform: scale(1.04);
          animation: float-minimal 2s ease-in-out infinite, success-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        /* Animações */
        @keyframes float-minimal {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes glow-pulse {
          0% {
            r: 80px;
            opacity: 0.1;
          }
          100% {
            r: 100px;
            opacity: 0.25;
          }
        }

        @keyframes success-glow {
          0% {
            r: 90px;
            opacity: 0.2;
          }
          100% {
            r: 115px;
            opacity: 0.45;
          }
        }

        @keyframes success-bounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1.04); }
        }
      `}</style>

      <svg 
        className={`octo-svg ${estadoAnimação}`} 
        viewBox="0 0 240 240" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Brilho radial de fundo verde-ciano */}
          <radialGradient id="octaBackdropGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00D1A0" stopOpacity="0" />
          </radialGradient>
          {/* Degradê oficial da marca */}
          <linearGradient id="octaBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D1A0" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
        </defs>

        {/* Círculo de ativação de fundo sutil */}
        <circle 
          className="glow-backdrop" 
          cx="120" 
          cy="120" 
          r="95" 
          fill="url(#octaBackdropGrad)"
        />

        {/* Squircle Oficial da Marca (#001B3D) */}
        <rect 
          x="30" 
          y="30" 
          width="180" 
          height="180" 
          rx="44" 
          fill="#001B3D" 
          stroke="rgba(0, 229, 255, 0.08)"
          strokeWidth="1"
        />

        {/* Isotipo do Balão de Conversa com Degradê */}
        <path 
          d="M 120,65 C 147.6,65 170,87.4 170,115 C 170,142.6 147.6,165 120,165 C 111,165 102.5,162.7 95,158.5 L 75,168 L 81,148 C 71,139.5 65,128 65,115 C 65,87.4 87.4,65 120,65 Z" 
          fill="url(#octaBrandGrad)" 
        />

        {/* Olhos Amigáveis */}
        <circle cx="103" cy="110" r="4.5" fill="#001B3D" />
        <circle cx="137" cy="110" r="4.5" fill="#001B3D" />

        {/* Sorriso Simpático */}
        <path 
          d="M 108 126 Q 120 135, 132 126" 
          stroke="#001B3D" 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round" 
        />
      </svg>
      <div className="octo-label">
        octadesk <span style={{ fontWeight: 350, color: '#00D1A0' }}>deepdive</span>
      </div>
    </div>
  );
};

export default OctoMascot;
