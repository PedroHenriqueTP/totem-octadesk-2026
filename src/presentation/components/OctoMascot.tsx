import React from 'react';

interface OctoMascotProps {
  estadoAnimação?: 'floating' | 'thinking' | 'success';
  onClick?: () => void;
  compact?: boolean;
}

export const OctoMascot: React.FC<OctoMascotProps> = ({ estadoAnimação = 'floating', onClick, compact = false }) => {
  return (
    <div className="octo-container" onClick={onClick}>
      <style>{`
        .octo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: ${compact ? '46px' : '74px'};
          margin: 0 auto;
          user-select: none;
        }
        
        .octo-label {
          margin-top: ${compact ? '1px' : '4px'};
          margin-bottom: ${compact ? '2px' : '6px'};
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: ${compact ? '0.6rem' : '0.8rem'};
          color: #FFFFFF;
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

        .glow-backdrop {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          fill: #2d62ff;
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
          <radialGradient id="octaBackdropGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2d62ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#2d62ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle 
          className="glow-backdrop" 
          cx="120" 
          cy="120" 
          r="95" 
          fill="url(#octaBackdropGrad)"
        />

        <rect 
          x="30" 
          y="30" 
          width="180" 
          height="180" 
          rx="48" 
          fill="#2d62ff" 
          stroke="rgba(45, 98, 255, 0.2)"
          strokeWidth="1.5"
        />

        <g stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" opacity="1">
          <path d="M 85 120 C 55 140, 45 170, 55 195" />
          <path d="M 102 130 C 85 155, 80 180, 90 200" />
          <path d="M 118 135 C 110 165, 110 185, 115 202" />
          
          <path d="M 155 120 C 185 140, 195 170, 185 195" />
          <path d="M 138 130 C 155 155, 160 180, 150 200" />
          <path d="M 122 135 C 130 165, 130 185, 125 202" />
        </g>

        <circle 
          cx="120" 
          cy="100" 
          r="52" 
          fill="#FFFFFF" 
        />

        <circle cx="102" cy="92" r="13" fill="#1F2538" />
        <circle cx="102" cy="92" r="5.5" fill="#FFFFFF" />

        <circle cx="138" cy="92" r="13" fill="#1F2538" />
        <circle cx="138" cy="92" r="5.5" fill="#FFFFFF" />

        <path 
          d="M 110 112 Q 120 120, 130 112" 
          stroke="#1F2538" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          fill="none"
        />
      </svg>
      <div className="octo-label">
        octadesk <span style={{ fontWeight: 300, color: '#00D1A0' }}>deepdive</span>
      </div>
    </div>
  );
};

export default OctoMascot;
