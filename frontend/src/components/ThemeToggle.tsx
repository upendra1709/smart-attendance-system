"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "relative flex items-center w-16 h-8 p-1 rounded-full border transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isDark ? "bg-[#09090B] border-[#27272A]" : "bg-[#FFFFFF] border-[#E4E4E7]"
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        className={cn(
          "absolute top-1 bottom-1 w-6 h-6 rounded-full shadow-sm",
          isDark ? "bg-[#27272A]" : "bg-[#E5E7EB]"
        )}
        animate={{ left: isDark ? "4px" : "calc(100% - 28px)" }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
      />
      <div className="relative z-10 flex w-full justify-between">
        <div className="w-6 h-6 flex items-center justify-center">
          <Moon
            size={16}
            strokeWidth={1.5}
            color={isDark ? "#FFFFFF" : "#000000"}
            className="transition-colors duration-300"
          />
        </div>
        <div className="w-6 h-6 flex items-center justify-center">
          <Sun
            size={16}
            strokeWidth={1.5}
            color={isDark ? "#6B7280" : "#374151"}
            className="transition-colors duration-300"
          />
        </div>
      </div>
    </button>
  );
}