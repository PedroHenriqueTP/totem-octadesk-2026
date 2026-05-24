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
            transform: translateY(-8px);
          }
        }

        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1.03); }
        }
      `}</style>

      <svg 
        className={`octo-svg ${estadoAnimação}`} 
        viewBox="0 0 240 240" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradiente radial 3D metálico prateado para o corpo */}
          <radialGradient id="chromeBody" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="15%" stopColor="#F1F5F9" />
            <stop offset="45%" stopColor="#CBD5E1" />
            <stop offset="70%" stopColor="#94A3B8" />
            <stop offset="90%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>

          {/* Gradiente linear metálico prateado para os tentáculos */}
          <linearGradient id="chromeTentacle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="25%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="75%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Gradiente linear Navy Blue com múltiplos stops para a haste do Headset */}
          <linearGradient id="headsetBand" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#001833" />
            <stop offset="25%" stopColor="#002B5C" />
            <stop offset="50%" stopColor="#004799" />
            <stop offset="75%" stopColor="#002B5C" />
            <stop offset="100%" stopColor="#001833" />
          </linearGradient>

          {/* Gradiente linear Navy Blue de alta qualidade para as conchas laterais */}
          <linearGradient id="earCup" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#002B5C" />
            <stop offset="40%" stopColor="#001F42" />
            <stop offset="80%" stopColor="#001026" />
            <stop offset="100%" stopColor="#000714" />
          </linearGradient>

          {/* Gradiente para a haste do microfone */}
          <linearGradient id="micArm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Brilho da testa */}
          <radialGradient id="glossyHighlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tentáculos cromados 3D com contorno de sombra escura */}
        <g strokeLinecap="round" fill="none">
          {/* Camada inferior de sombra/contorno escuro para os tentáculos */}
          <g stroke="#1E293B" strokeWidth="17" opacity="0.9">
            <path d="M 80 145 C 45 165, 30 195, 45 220" />
            <path d="M 100 155 C 75 185, 65 210, 80 225" />
            <path d="M 118 160 C 100 195, 100 215, 115 228" />
            <path d="M 122 160 C 140 195, 140 215, 125 228" />
            <path d="M 140 155 C 165 185, 175 210, 160 225" />
            <path d="M 160 145 C 195 165, 210 195, 195 220" />
          </g>
          {/* Camada superior cromada */}
          <g stroke="url(#chromeTentacle)" strokeWidth="13">
            <path d="M 80 145 C 45 165, 30 195, 45 220" />
            <path d="M 100 155 C 75 185, 65 210, 80 225" />
            <path d="M 118 160 C 100 195, 100 215, 115 228" />
            <path d="M 122 160 C 140 195, 140 215, 125 228" />
            <path d="M 140 155 C 165 185, 175 210, 160 225" />
            <path d="M 160 145 C 195 165, 210 195, 195 220" />
          </g>
        </g>

        {/* Corpo principal (Cabeça) */}
        <path 
          d="M 75 105 C 75 45, 165 45, 165 105 C 165 138, 150 150, 120 150 C 90 150, 75 138, 75 105 Z" 
          fill="url(#chromeBody)" 
          stroke="#1E293B" 
          strokeWidth="2.5" 
        />

        {/* Brilho cromado na testa (Highlight 3D) */}
        <ellipse 
          cx="102" 
          cy="70" 
          rx="18" 
          ry="10" 
          fill="url(#glossyHighlight)" 
          transform="rotate(-15, 102, 70)" 
          opacity="0.75" 
        />

        {/* Olhos 3D com contorno */}
        <g>
          {/* Olho Esquerdo */}
          <circle cx="100" cy="102" r="13" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
          <circle cx="100" cy="102" r="6" fill="#002B5C" />
          <circle cx="98" cy="100" r="2" fill="#FFFFFF" />

          {/* Olho Direito */}
          <circle cx="140" cy="102" r="13" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
          <circle cx="140" cy="102" r="6" fill="#002B5C" />
          <circle cx="138" cy="100" r="2" fill="#FFFFFF" />
        </g>

        {/* Sorriso simpático */}
        <path 
          d="M 114 122 Q 120 128 126 122" 
          stroke="#1E293B" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none" 
        />

        {/* Headset Navy Blue */}
        {/* Haste do Headset (Arco) */}
        <path 
          d="M 73 90 A 58 58 0 0 1 167 90" 
          stroke="#001833" 
          strokeWidth="9" 
          fill="none" 
        />
        <path 
          d="M 73 90 A 58 58 0 0 1 167 90" 
          stroke="url(#headsetBand)" 
          strokeWidth="6" 
          fill="none" 
        />

        {/* Conectores metálicos das conchas */}
        <path d="M 68 85 L 68 95" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <path d="M 172 85 L 172 95" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />

        {/* Conchas (Ear Cups) */}
        <rect x="58" y="88" width="18" height="34" rx="6" fill="url(#earCup)" stroke="#001833" strokeWidth="2" />
        <rect x="164" y="88" width="18" height="34" rx="6" fill="url(#earCup)" stroke="#001833" strokeWidth="2" />

        {/* Haste do Microfone (Saindo do fone esquerdo) */}
        <path 
          d="M 67 114 Q 78 136, 102 131" 
          stroke="url(#micArm)" 
          strokeWidth="3.5" 
          fill="none" 
          strokeLinecap="round" 
        />
        {/* Espuma do microfone (Direcionada à boca) */}
        <rect 
          x="99" 
          y="126" 
          width="9" 
          height="11" 
          rx="4.5" 
          fill="#001833" 
          stroke="#002B5C" 
          strokeWidth="1.5" 
        />
      </svg>
    </div>
  );
};
