"use client";

import React from "react";
import { motion } from "framer-motion";

interface QuizCardProps {
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  accentColor?: "cyan" | "orange" | "green";
}

export default function QuizCard({
  label,
  description,
  isSelected,
  onClick,
  accentColor = "cyan"
}: QuizCardProps) {
  const colorMap = {
    cyan: {
      borderSelected: "border-[#00E5FF] bg-[#F0FDFA] shadow-[0_0_15px_rgba(0,229,255,0.25)]",
      textSelected: "text-[#0F172A] font-bold",
      checkIcon: "bg-[#00E5FF] text-slate-950 border-transparent",
      hover: "hover:border-[#00E5FF]/50 hover:shadow-[0_0_10px_rgba(0,229,255,0.15)]",
    },
    orange: {
      borderSelected: "border-[#0052CC] bg-[#EFF6FF] shadow-[0_0_15px_rgba(0,82,204,0.25)]",
      textSelected: "text-[#0F172A] font-bold",
      checkIcon: "bg-[#0052CC] text-white border-transparent",
      hover: "hover:border-[#0052CC]/50 hover:shadow-[0_0_10px_rgba(0,82,204,0.15)]",
    },
    green: {
      borderSelected: "border-[#0052CC] bg-[#EFF6FF] shadow-[0_0_15px_rgba(0,82,204,0.25)]",
      textSelected: "text-[#0F172A] font-bold",
      checkIcon: "bg-[#0052CC] text-white border-transparent",
      hover: "hover:border-[#0052CC]/50 hover:shadow-[0_0_10px_rgba(0,82,204,0.15)]",
    }
  };

  const style = colorMap[accentColor] || colorMap.cyan;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 flex items-center justify-between cursor-pointer ${
        isSelected
          ? `${style.borderSelected}`
          : "border-[#E2E8F0] bg-white text-[#0F172A] " + style.hover
      }`}
    >
      <div className="flex-1 pr-4">
        <h4
          className={`font-semibold text-base transition-colors duration-300 text-[#0F172A] ${
            isSelected ? style.textSelected : ""
          }`}
        >
          {label}
        </h4>
        {description && (
          <p className="text-xs text-slate-550 mt-1 transition-colors">
            {description}
          </p>
        )}
      </div>

      <div
        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
          isSelected
            ? `${style.checkIcon}`
            : "border-slate-300 bg-transparent"
        }`}
      >
        {isSelected && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </motion.button>
  );
}
