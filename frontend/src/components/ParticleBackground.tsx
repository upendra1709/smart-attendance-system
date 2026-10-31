"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PARTICLES = [
  { size: 2.2, left: 8, top: 14, x: 24, y: -18, duration: 14 },
  { size: 1.5, left: 17, top: 72, x: -30, y: 28, duration: 18 },
  { size: 3.1, left: 26, top: 38, x: 18, y: 36, duration: 22 },
  { size: 1.8, left: 34, top: 84, x: -22, y: -32, duration: 16 },
  { size: 2.7, left: 43, top: 11, x: 35, y: 20, duration: 20 },
  { size: 1.3, left: 51, top: 59, x: -16, y: -24, duration: 15 },
  { size: 2.4, left: 63, top: 27, x: 28, y: 34, duration: 24 },
  { size: 1.7, left: 71, top: 91, x: -34, y: -20, duration: 19 },
  { size: 3.2, left: 79, top: 48, x: 20, y: -36, duration: 17 },
  { size: 1.4, left: 88, top: 19, x: -26, y: 26, duration: 21 },
  { size: 2.1, left: 94, top: 67, x: 30, y: 18, duration: 23 },
  { size: 1.9, left: 12, top: 93, x: -18, y: -28, duration: 16 },
  { size: 2.8, left: 39, top: 51, x: 26, y: 22, duration: 20 },
  { size: 1.6, left: 58, top: 76, x: -32, y: -18, duration: 18 },
  { size: 2.5, left: 84, top: 83, x: 16, y: -30, duration: 22 },
];

function useIsDark() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function ParticleBackground() {
  const isDark = useIsDark();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* soft mesh gradients */}
      <div
        className={cn(
          "absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-40 mix-blend-screen transition-colors duration-1000",
          isDark ? "bg-cyan-600/30" : "bg-blue-300/40"
        )}
      />
      <div
        className={cn(
          "absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-30 mix-blend-screen transition-colors duration-1000",
          isDark ? "bg-violet-600/20" : "bg-purple-300/30"
        )}
      />

      {/* constellation dots */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="constellation" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)"} />
            <circle cx="80" cy="60" r="1" fill={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"} />
            <circle cx="40" cy="80" r="2" fill={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)"} />
            <path d="M 20 20 L 80 60 L 40 80 Z" fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#constellation)" />
      </svg>

      {/* floating particles */}
      {PARTICLES.map((particle, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]",
            isDark ? "bg-cyan-300" : "bg-blue-400"
          )}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            x: [0, particle.x],
            y: [0, particle.y],
            opacity: [0.1, 0.8, 0.1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}