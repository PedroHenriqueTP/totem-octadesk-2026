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
          font-family: 'Urbanist', 'Inter', sans-serif;
          font-weight: 800; /* font-extrabold */
          font-size: 1.15rem;
          color: #2C3647;
          letter-spacing: 0.15em;
          text-align: center;
          text-transform: uppercase;
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
          fill: #4A5A70;
          opacity: 0;
        }

        .octo-svg.thinking .glow-backdrop {
          opacity: 0.12;
          animation: glow-pulse 2s ease-in-out infinite alternate;
        }

        .octo-svg.success .glow-backdrop {
          opacity: 0.22;
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
            opacity: 0.08;
          }
          100% {
            r: 100px;
            opacity: 0.2;
          }
        }

        @keyframes success-glow {
          0% {
            r: 90px;
            opacity: 0.15;
          }
          100% {
            r: 115px;
            opacity: 0.35;
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
          {/* Brilho radial de fundo sutil */}
          <radialGradient id="slateBackdropGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4A5A70" stopOpacity="1" />
            <stop offset="100%" stopColor="#4A5A70" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Círculo de ativação de fundo sutil */}
        <circle 
          className="glow-backdrop" 
          cx="120" 
          cy="120" 
          r="95" 
          fill="url(#slateBackdropGrad)"
        />

        {/* Squircle Oficial da Marca (#2C3647) */}
        <rect 
          x="30" 
          y="30" 
          width="180" 
          height="180" 
          rx="44" 
          fill="#2C3647" 
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth="1"
        />

        {/* Corpo do Polvo Minimalista Branco (#FFFFFF) - Peça Única Plana */}
        <path 
          d="M 120,70 
             C 145,70 162,88 162,112 
             C 162,126 156,132 150,136 
             C 155,140 168,142 178,146 
             C 192,152 194,164 186,172 
             C 178,180 166,176 158,164 
             C 152,156 145,148 142,140 
             C 140,150 142,166 138,180 
             C 134,194 124,194 122,180 
             C 120,166 120,152 120,144 
             C 120,152 120,166 118,180 
             C 116,194 106,194 102,180 
             C 98,166 100,150 98,140 
             C 95,148 88,156 82,164 
             C 74,176 62,180 54,172 
             C 46,164 48,152 62,146 
             C 72,142 85,140 90,136 
             C 84,132 78,126 78,112 
             C 78,88 95,70 120,70 Z" 
          fill="#FFFFFF" 
        />

        {/* Headset de Atendimento Integrado (Flat e Elegante #4A5A70) */}
        {/* Haste do Headset (Fina, contornando o topo da cabeça de forma externa) */}
        <path 
          d="M 72 96 C 72 58, 168 58, 168 96" 
          stroke="#4A5A70" 
          strokeWidth="3.5" 
          fill="none" 
          strokeLinecap="round"
        />
        
        {/* Conchas Laterais Discretas (Earcups) */}
        <rect x="66" y="86" width="7" height="18" rx="2" fill="#4A5A70" />
        <rect x="167" y="86" width="7" height="18" rx="2" fill="#4A5A70" />

        {/* Haste do Microfone Fina e Elegante em #2C3647 (dentro da cabeça do polvo) */}
        <path 
          d="M 72 102 Q 80 124, 96 120" 
          stroke="#2C3647" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round" 
        />
        <circle cx="96" cy="120" r="3" fill="#2C3647" />

        {/* Olhos - Elipses verticais simétricas oficiais (#2C3647) */}
        <ellipse cx="106" cy="112" rx="5" ry="7.5" fill="#2C3647" />
        <ellipse cx="134" cy="112" rx="5" ry="7.5" fill="#2C3647" />
      </svg>
      <div className="octo-label">OCTADESK</div>
    </div>
  );
};

export default OctoMascot;
