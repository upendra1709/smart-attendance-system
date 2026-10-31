"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Presentation, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ParticleBackground from "@/components/ParticleBackground";
import AuthNavbar from "@/components/AuthNavbar";

const ROLES = [
  {
    id: "student",
    title: "Login as Student",
    icon: GraduationCap,
    desc: "View your attendance, courses, attendance history, and regularisation requests.",
    color: "from-blue-400 to-cyan-500",
    shadow: "shadow-cyan-500/20",
    btnText: "Continue as Student",
    accentText: "text-cyan-500",
    bgHover: "group-hover:bg-cyan-500/5",
    borderHover: "group-hover:border-cyan-500/30",
  },
  {
    id: "teacher",
    title: "Login as Teacher",
    icon: Presentation,
    desc: "Manage classes, conduct AI attendance sessions, view students, and analyze attendance.",
    color: "from-violet-500 to-purple-500",
    shadow: "shadow-violet-500/20",
    btnText: "Continue as Teacher",
    accentText: "text-violet-500",
    bgHover: "group-hover:bg-violet-500/5",
    borderHover: "group-hover:border-violet-500/30",
  },
  {
    id: "admin",
    title: "Login as Administrator",
    icon: ShieldCheck,
    desc: "Manage users, classes, attendance, reports, alerts, and institution settings.",
    color: "from-emerald-400 to-green-500",
    shadow: "shadow-emerald-500/20",
    btnText: "Continue as Administrator",
    accentText: "text-emerald-500",
    bgHover: "group-hover:bg-emerald-500/5",
    borderHover: "group-hover:border-emerald-500/30",
  },
] as const;

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-foreground">
      <ParticleBackground />
      <AuthNavbar />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl mx-auto z-10 relative px-6 py-24"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
            Welcome to SmartAttend
          </h2>
          <p className="text-foreground/60 text-lg max-w-xl mx-auto">
            Choose how you want to access SmartAttend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => router.push(`/login/${role.id}`)}
              className={cn(
                "glass-card p-10 lg:p-12 rounded-[2rem] flex flex-col items-center text-center group transition-all duration-500 relative overflow-hidden border border-border hover:shadow-2xl hover:-translate-y-2",
                role.bgHover,
                role.borderHover
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br transition-opacity duration-500",
                  role.color
                )}
              />

              <div
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-8 bg-gradient-to-br transition-transform duration-500 group-hover:scale-110 shadow-lg",
                  role.color,
                  role.shadow
                )}
              >
                <role.icon size={36} />
              </div>

              <h3 className="text-2xl font-display font-bold mb-4">{role.title}</h3>
              <p className="text-foreground/60 text-sm leading-relaxed mb-10 flex-1">
                {role.desc}
              </p>

              <div
                className={cn(
                  "flex items-center gap-2 text-sm font-bold transition-all duration-300",
                  role.accentText
                )}
              >
                {role.btnText}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}