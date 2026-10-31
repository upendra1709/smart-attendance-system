"use client";

import Link from "next/link";
import { ScanFace } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthNavbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-[60] py-6 bg-transparent px-6 md:px-12 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <ScanFace size={22} />
          </div>
          <span className="font-display font-bold text-2xl drop-shadow-sm">SmartAttend</span>
        </Link>
        <span className="hidden md:inline-flex items-center rounded-full bg-foreground/10 border border-border/50 px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase text-foreground/80 backdrop-blur-md">
          Made in India 🇮🇳
        </span>
      </div>

      <div className="flex items-center gap-6 pointer-events-auto">
        <ThemeToggle />
        <Link
          href="/"
          className="hidden sm:flex items-center gap-2 rounded-full bg-foreground/10 border border-border/50 px-6 py-2.5 text-sm font-bold backdrop-blur-md transition-all hover:bg-foreground/20 hover:-translate-y-0.5"
        >
          Back to Home
        </Link>
      </div>
    </nav>
  );
}