"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PolvoState } from "../../hooks/usePolvo";

interface OctoMascotProps {
  state: PolvoState;
  className?: string;
  size?: number;
}

// Vetores Oficiais extraídos diretamente do logotipo da Octadesk (public/assets/octadesk-squircle.svg)
const SQUIRCLE_PATH = "M37.1043 7.5832C36.7329 3.6906 33.9199 0.845478 30.0725 0.470971C27.3976 0.209951 23.714 0 18.7849 0C13.8559 0 10.3349 0.205412 7.6769 0.457353C3.72736 0.832995 0.839275 3.77912 0.462274 7.77273C0.20533 10.4828 0 14.1666 0 18.9966C0 23.8266 0.206453 27.5138 0.462274 30.2273C0.840396 34.2209 3.72625 37.167 7.67577 37.5427C10.3349 37.7992 13.9625 38 18.7838 38C23.6052 38 27.3976 37.7901 30.0714 37.529C33.9188 37.1545 36.7317 34.3083 37.1043 30.4168C37.3611 27.7113 37.5688 23.9866 37.5688 19C37.5688 14.0134 37.3611 10.2876 37.1043 7.5832 Z";

const OCTO_BODY_PATH = "M28.8663 25.7707C28.3075 25.9091 27.7264 25.9522 27.1507 25.9488C26.8478 25.9488 26.638 25.9397 26.2453 25.8989C24.6666 25.7365 23.5838 25.2032 22.8792 24.6154C22.8085 24.5564 22.6671 24.5087 22.5168 24.6221C22.3923 24.7379 22.3923 24.8866 22.482 25.1078C22.5269 25.2032 22.7681 25.5958 22.7681 25.5958C22.7681 25.5958 22.9813 25.9817 23.0688 26.1202C23.7555 27.0666 24.3603 27.7589 24.891 28.2821C25.3465 28.7451 25.5036 29.4771 25.2299 30.1319C25.148 30.3374 25.0245 30.5098 24.8719 30.6676C24.2279 31.3349 23.1575 31.3145 22.5291 30.7028C21.8615 30.0446 21.1906 29.3137 20.3648 28.0948C19.705 27.1699 19.2136 26.1327 18.914 25.033C18.8915 24.9524 18.8477 24.9047 18.7849 24.9047C18.7221 24.9047 18.6795 24.9524 18.6559 25.033C18.3563 26.1327 17.8648 27.1688 17.2051 28.0948C16.3793 29.3137 15.7084 30.0446 15.0407 30.7028C14.4124 31.3145 13.3431 31.3349 12.6979 30.6676C12.5453 30.5098 12.4219 30.3374 12.34 30.1319C12.0652 29.476 12.2233 28.744 12.6788 28.2821C13.2095 27.7589 13.8155 27.0666 14.5011 26.1202C14.5885 25.9817 14.8018 25.5958 14.8018 25.5958C14.8018 25.5958 15.0429 25.2032 15.0879 25.1078C15.1777 24.8866 15.1777 24.7368 15.0531 24.6221C14.9016 24.5075 14.7613 24.5564 14.6907 24.6154C13.9871 25.2032 12.9033 25.7377 11.3246 25.8989C10.9318 25.9386 10.7209 25.9488 10.4191 25.9488C9.84355 25.9522 9.26231 25.9091 8.70467 25.7707C7.81602 25.5289 7.29764 24.5779 7.53776 23.6802C7.77226 22.8029 8.65193 22.2707 9.52712 22.4795C9.96132 22.5601 10.6267 22.5873 11.1092 22.5022C12.6542 22.3183 13.8503 21.356 13.9826 19.6163C14.0197 18.6187 13.636 17.9911 13.1176 17.2625C12.4388 16.2502 11.6982 14.986 11.6982 13.3654C11.6982 9.50798 15.1159 6.4767 18.7872 6.4767C22.4584 6.4767 25.8761 9.50798 25.8761 13.3654C25.8761 14.986 25.1356 16.2491 24.4568 17.2625C23.9384 17.9911 23.5547 18.6187 23.5917 19.6163C23.7229 21.356 24.9191 22.3183 26.4652 22.5022C26.9465 22.5862 27.613 22.559 28.0473 22.4795C28.9224 22.2718 29.8033 22.8029 30.0366 23.6802C30.2756 24.5791 29.7572 25.5289 28.8697 25.7707 Z";

const EYE_LEFT_PATH = "M16.6935 12.7606C15.9552 12.7606 15.3685 13.2781 15.3685 14.3959C15.3685 15.5138 15.9654 15.7953 16.7036 15.7953C17.4419 15.7953 18.0388 15.5138 18.0388 14.3959C18.0388 13.2781 17.4329 12.7606 16.6946 12.7606";

const EYE_RIGHT_PATH = "M20.8571 12.7606C20.1188 12.7606 19.532 13.2781 19.532 14.3959C19.532 15.5138 20.1289 15.7953 20.8672 15.7953C21.6055 15.7953 22.2024 15.5138 22.2024 14.3959C22.2024 13.2781 21.5965 12.7606 20.8582 12.7606";

export default function OctoMascot({ state, className = "", size = 120 }: OctoMascotProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  if (!mounted) {
    return <div style={{ width: size, height: size }} className={className} />;
  }

  // --- FALLBACK OFICIAL DA MARCA PADRONIZADO E ANIMADO ---
  const getAnimationVariants = () => {
    switch (state) {
      case "thinking":
        return {
          body: {
            y: [0, -1.5, 0],
            transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" as const }
          },
          octopus: {
            scale: [1, 1.04, 0.96, 1],
            transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" as const }
          },
          eyes: {
            scaleY: [1, 1, 0.1, 1, 1],
            transition: { repeat: Infinity, duration: 3, times: [0, 0.85, 0.9, 0.95, 1] }
          }
        };
      case "trilha_enterprise":
        return {
          body: {
            y: [0, -4, 0],
            scale: [1, 1.05, 1],
            transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const }
          },
          octopus: {
            scale: [1, 1.06, 0.94, 1],
            transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const }
          },
          eyes: {
            scaleY: [1, 1, 0.1, 1, 1],
            transition: { repeat: Infinity, duration: 4, times: [0, 0.8, 0.85, 0.9, 1] }
          }
        };
      case "trilha_automacao":
        return {
          body: {
            y: [0, -2, 2, 0],
            transition: { repeat: Infinity, duration: 0.8, ease: "linear" as const }
          },
          octopus: {
            scale: [1, 1.08, 0.92, 1],
            transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" as const }
          },
          eyes: {
            scaleY: [1, 1, 0.1, 1, 1],
            transition: { repeat: Infinity, duration: 3, times: [0, 0.85, 0.9, 0.95, 1] }
          }
        };
      case "trilha_atendimento":
        return {
          body: {
            y: [0, -3, 0],
            transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" as const }
          },
          octopus: {
            scale: [1, 1.04, 0.96, 1],
            transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" as const }
          },
          eyes: {
            scaleY: [1, 1, 0.1, 1, 1],
            transition: { repeat: Infinity, duration: 4, times: [0, 0.8, 0.85, 0.9, 1] }
          }
        };
      case "trilha_controle":
        return {
          body: {
            y: [0, -2, 0],
            transition: { repeat: Infinity, duration: 4, ease: "easeInOut" as const }
          },
          octopus: {
            scale: [1, 1.03, 0.97, 1],
            transition: { repeat: Infinity, duration: 4, ease: "easeInOut" as const }
          },
          eyes: {
            scaleY: [1, 1, 0.1, 1, 1],
            transition: { repeat: Infinity, duration: 4, times: [0, 0.8, 0.85, 0.9, 1] }
          }
        };
      case "idle":
      default:
        return {
          body: {
            y: [0, -1.2, 0],
            transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const }
          },
          octopus: {
            rotate: [0, 1, -1, 0],
            transition: { repeat: Infinity, duration: 4, ease: "easeInOut" as const }
          },
          eyes: {
            scaleY: [1, 1, 0.1, 1, 1],
            transition: { repeat: Infinity, duration: 4, times: [0, 0.85, 0.9, 0.95, 1] }
          }
        };
    }
  };
  const anim = getAnimationVariants();

  return (
    <motion.div 
      style={{ width: size, height: size }} 
      className={`relative select-none flex items-center justify-center ${className}`}
      animate={anim.body}
    >
      <svg 
        viewBox="0 0 38 38" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="mascot-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#1F2538" floodOpacity="0.12" />
          </filter>

          {/* idle / thinking / default */}
          <linearGradient id="bg-idle" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5E8BFF" />
            <stop offset="100%" stopColor="#2D62FF" />
          </linearGradient>

          {/* trilha_enterprise */}
          <linearGradient id="bg-enterprise" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2E4C8E" />
            <stop offset="100%" stopColor="#001B3D" />
          </linearGradient>

          {/* trilha_automacao */}
          <linearGradient id="bg-automacao" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* trilha_atendimento */}
          <linearGradient id="bg-atendimento" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>

          {/* trilha_controle */}
          <linearGradient id="bg-controle" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        <g>
          {/* CONTÊINER COMPLETO DO MASCOTE */}
          <g>
            {/* 1. SQUIRCLE DA LOGO (Sempre o azul institucional escuro) */}
            <path 
              d={SQUIRCLE_PATH} 
              fill="#2D354D" 
            />

            {/* 2. CORPO DO POLVO DA LOGO (Branco) */}
            <motion.path 
              d={OCTO_BODY_PATH} 
              fill="#FFFFFF"
              animate={anim.octopus}
              style={{ transformOrigin: "18.7px 18.7px" }}
            />

            {/* 3. OLHOS DO POLVO (Preenchidos com o azul institucional escuro para simular transparência) */}
            <motion.g 
              animate={anim.eyes} 
              style={{ transformOrigin: "18.7px 14.3px" }}
            >
              <path d={EYE_LEFT_PATH} fill="#2D354D" />
              <path d={EYE_RIGHT_PATH} fill="#2D354D" />
            </motion.g>
          </g>
        </g>
      </svg>
    </motion.div>
  );
}
