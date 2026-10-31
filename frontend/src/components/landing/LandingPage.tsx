"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ScanFace, Cloud, LayoutDashboard, ClipboardCheck, FileBarChart, ShieldCheck,
  ArrowRight, Mouse, CheckCircle2, Phone, Bell,
  Users, CalendarDays, Check, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import ParticleBackground from "@/components/ParticleBackground";

const NAV_LINKS = ["Home", "Features", "How It Works", "About", "Contact"];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroOpacity = useTransform(scrollY, [0, 1500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 1500], [0, 100]);
  const heroBlur = useTransform(scrollY, [0, 1500], [0, 15]);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id.toLowerCase().replace(/\s+/g, "-"));
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const goLogin = () => router.push("/login");

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-indigo-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleBackground />
      </div>

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled ? "py-5 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm" : "py-8 lg:py-10 bg-transparent"
        )}
      >
        <div className="container mx-auto px-6 max-w-[90rem] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <ScanFace size={18} />
              </div>
              <span className="font-display font-bold text-xl">SmartAttend</span>
            </button>
            <span className="hidden md:inline-flex items-center rounded-full bg-foreground/5 border border-border/50 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-foreground/60">
              Made in India 🇮🇳
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                className="text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors"
              >
                {link}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={goLogin}
              className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              Login
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu size={24} />
          </button>
        </div>
      </motion.nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-3xl flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                  <ScanFace size={18} />
                </div>
                <span className="font-display font-bold text-xl">SmartAttend</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-foreground/5 rounded-full" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-6 text-xl font-display font-bold">
              {NAV_LINKS.map((link) => (
                <button key={link} onClick={() => scrollTo(link)} className="text-left py-2 border-b border-border/50 text-foreground/80 hover:text-foreground">
                  {link}
                </button>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-6 pb-8">
              <div className="flex justify-between items-center bg-foreground/5 p-4 rounded-2xl border border-border/50">
                <span className="font-semibold text-sm">Theme</span>
                <ThemeToggle />
              </div>
              <button onClick={goLogin} className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-4 text-center font-bold text-white shadow-lg shadow-indigo-500/20">
                Log In to SmartAttend
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <motion.section
          id="home"
          style={{ opacity: heroOpacity, y: heroY, filter: `blur(${heroBlur}px)` }}
          className="relative min-h-screen pt-48 pb-32 lg:pt-56 lg:pb-40 flex items-center overflow-hidden"
        >
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/hero-bg.png" alt="Hero background" className="w-full h-full object-cover opacity-30 dark:opacity-10 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
          </div>
          <div className="relative z-10 container mx-auto px-6 max-w-[90rem]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="flex flex-col items-start space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  AI-Powered Attendance System · Live
                </div>

                <div>
                  <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-display font-extrabold leading-[1.1] tracking-tight">
                    Attendance <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 animate-text-gradient">
                      Made Simple
                    </span>
                  </h1>
                  <p className="mt-8 text-lg md:text-2xl text-foreground/60 max-w-2xl leading-relaxed mb-10">
                    India&apos;s most trusted attendance management system with face recognition, real-time analytics, and automated reporting. Built for Indian educational institutions.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {[
                    ["Face Recognition", ScanFace, "text-green-500", "border-green-500/30"],
                    ["Real-time Analytics", FileBarChart, "text-blue-500", "border-blue-500/30"],
                    ["Multi-role Access", Users, "text-purple-500", "border-purple-500/30"],
                    ["Secure & Private", ShieldCheck, "text-orange-500", "border-orange-500/30"],
                  ].map(([text, Icon, colorClass, borderClass]: any, i) => (
                    <div key={i} className={cn("flex items-center gap-2 rounded-full bg-foreground/5 border px-4 py-2 text-sm font-semibold transition-all hover:bg-foreground/10", borderClass)}>
                      <Icon size={16} className={colorClass} />
                      {text as string}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <button onClick={goLogin} className="group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 w-full sm:w-auto">
                    Get Started <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
                <p className="text-xs text-foreground/40 font-semibold uppercase tracking-wider">
                  Built for modern colleges and universities
                </p>

                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border/50 w-full">
                  {[
                    ["50K+", "Active Users"],
                    ["150+", "Institutions"],
                    ["98%", "Satisfaction"],
                  ].map(([val, label], i) => (
                    <div key={label}>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.2 }}
                        className="text-3xl font-display font-bold"
                      >
                        {val}
                      </motion.p>
                      <p className="text-sm text-foreground/50 font-medium">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT SIDE ILLUSTRATION (CSS Art / Abstract UI) */}
              <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 rounded-[3rem] transform rotate-3 scale-105 border border-border/50" />
                <div className="absolute inset-0 bg-background/50 backdrop-blur-xl rounded-[3rem] border border-border/50 shadow-2xl flex items-center justify-center overflow-hidden">
                  {/* Laptop Screen Mockup */}
                  <div className="relative w-[85%] h-[60%] bg-foreground/5 rounded-t-2xl border-x border-t border-border/50 flex flex-col shadow-inner">
                    <div className="h-6 border-b border-border/50 flex items-center px-3 gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/50" />
                      <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                      <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    </div>
                    <div className="flex-1 p-4 relative overflow-hidden flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="font-bold text-sm">Live Attendance</h4>
                          <p className="text-[10px] text-foreground/50">AI Recognition Active</p>
                        </div>
                        <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-500 text-[9px] font-bold flex items-center gap-1 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                        </span>
                      </div>

                      {/* Fake Video Feed */}
                      <div className="flex-1 bg-background rounded-xl border border-border/50 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />

                        {/* Face Bounding Box */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                          className="w-24 h-32 border-2 border-emerald-500/50 rounded-xl relative"
                        >
                          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-500" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-500" />
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-500" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-500" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <ScanFace size={48} className="text-emerald-500/20" />
                          </div>
                        </motion.div>
                      </div>
                    </div>
                    {/* Base of laptop */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[110%] h-3 bg-foreground/10 rounded-b-xl border border-border/50" />
                  </div>

                  {/* Floating Elements */}
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] -right-4 glass-card px-3 py-2 rounded-xl shadow-lg border border-border flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check size={12} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold">Face Recognized</p>
                      <p className="text-[9px] text-foreground/50">98% Match</p>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[25%] -left-4 glass-card px-3 py-2 rounded-xl shadow-lg border border-border flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Users size={12} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold">Attendance Saved</p>
                      <p className="text-[9px] text-foreground/50">32/45 Students</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
              <span className="text-[10px] font-bold uppercase tracking-widest">Scroll to explore</span>
              <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Mouse size={20} />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-32 lg:py-40 relative">
          <div className="container mx-auto px-6 max-w-[90rem]">
            <div className="text-center max-w-2xl mx-auto mb-20 lg:mb-24 space-y-4">
              <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-500">
                Powerful Features
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold">
                Everything You Need, <br />All in One Place
              </h2>
              <p className="text-foreground/60 text-lg">
                From AI-powered attendance capture to analytics and reporting, SmartAttend brings the complete attendance workflow into one simple platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {[
                { title: "Real-time Attendance Tracking", icon: ScanFace, desc: "Track student attendance instantly with our advanced AI face recognition system. Detect real users and reduce spoofing." },
                { title: "Smart Analytics", icon: FileBarChart, desc: "Get deep insights and analytics on attendance patterns. Monitor class performance with live updates." },
                { title: "Multi-Role Dashboard", icon: LayoutDashboard, desc: "Dedicated interfaces for Students, Teachers, and Administrators. Role-based access ensures data privacy." },
                { title: "Automated Reporting", icon: ClipboardCheck, desc: "Generate comprehensive subject-wise, monthly, and semester attendance reports automatically." },
                { title: "75% Attendance Alerts", icon: Bell, desc: "Automated alerts for students approaching the 75% attendance threshold as per Indian regulations." },
                { title: "Privacy & Security", icon: ShieldCheck, desc: "Built with privacy in mind. We use 512-d embeddings only—raw face images are never stored or exposed." },
              ].map((feat, i) => (
                <div key={i} className="group rounded-[2rem] border border-border shadow-lg overflow-hidden relative bg-gradient-to-br from-indigo-500/5 via-background to-cyan-500/5 transition-all hover:shadow-xl hover:border-indigo-500/30 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-10 lg:p-12 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                      <feat.icon size={26} className="text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-32 lg:py-40 bg-foreground/[0.02] border-y border-border/50">
          <div className="container mx-auto px-6 max-w-[90rem]">
            <div className="text-center max-w-2xl mx-auto mb-20 lg:mb-24 space-y-4">
              <span className="inline-block rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-500">
                Simple Workflow
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold">
                How SmartAttend Works
              </h2>
              <p className="text-foreground/60 text-lg">
                From setup to daily attendance — a complete end-to-end workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative">
              {[
                { num: "01", title: "University Onboarding", desc: "Super Admin creates the university with a unique code, sets subscription plan, duration, and user limits.", icon: ShieldCheck, color: "from-purple-500 to-indigo-500" },
                { num: "02", title: "Course & Timetable Setup", desc: "Add colleges, configure courses, semesters, subjects (regular + elective), and define the weekly timetable.", icon: CalendarDays, color: "from-pink-500 to-rose-500" },
                { num: "03", title: "User Management", desc: "Add students and teachers individually or bulk-upload via Excel. Secure accounts created automatically.", icon: Users, color: "from-red-400 to-rose-500" },
                { num: "04", title: "Automated Session Generation", desc: "Cloud Functions run daily reading timetables to generate sessions with deterministic IDs.", icon: Cloud, color: "from-orange-400 to-red-500" },
                { num: "05", title: "Attendance Marking", desc: "Teacher opens session. Students complete AI face verification, and presence is recorded instantly.", icon: ScanFace, color: "from-blue-400 to-cyan-500" },
                { num: "06", title: "Reports & Analytics", desc: "View subject-wise, monthly, and semester reports. Export to PDF or CSV. Elective subjects filtered.", icon: FileBarChart, color: "from-indigo-400 to-blue-500" },
              ].map((step, i) => (
                <div key={i} className="group rounded-[2rem] border border-border shadow-lg overflow-hidden relative bg-gradient-to-br from-foreground/5 via-background to-foreground/5 transition-all hover:shadow-xl hover:border-foreground/20 hover:-translate-y-1">
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500", step.color)} />
                  <div className="p-10 lg:p-12 relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br group-hover:scale-110 transition-transform", step.color)}>
                        <step.icon size={26} />
                      </div>
                      <div className={cn("text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-br opacity-50 group-hover:opacity-100 transition-opacity", step.color)}>
                        {step.num}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20">
              <div className="glass-card rounded-[2rem] border border-border shadow-2xl p-10 lg:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <h3 className="text-2xl font-display font-bold">Attendance Marking — Step by Step</h3>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    AI Attendance Session Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                  <div className="hidden lg:block absolute top-8 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
                  {[
                    { num: "01", title: "Capture", desc: "Camera detects the student." },
                    { num: "02", title: "Liveness Check", desc: "Verify the person is real." },
                    { num: "03", title: "AI Match", desc: "Compare against the enrolled face representation." },
                    { num: "04", title: "Attendance Saved", desc: "Attendance is automatically recorded." },
                  ].map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-background border-4 border-foreground/5 flex items-center justify-center font-display font-bold text-xl mb-4 shadow-sm">
                        {step.num}
                      </div>
                      <h4 className="font-bold mb-2">{step.title}</h4>
                      <p className="text-xs text-foreground/60">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROLE EXPERIENCE */}
        <section className="py-32 lg:py-40">
          <div className="container mx-auto px-6 max-w-[90rem]">
            <div className="text-center max-w-2xl mx-auto mb-20 lg:mb-24 space-y-4">
              <span className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-500">
                Who is SmartAttend for?
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold">
                One Platform, Three Powerful Experiences
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* STUDENT */}
              <div className="rounded-[2rem] border border-cyan-500/30 shadow-xl overflow-hidden group relative bg-gradient-to-br from-cyan-500/10 via-background to-blue-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="h-2 w-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                <div className="p-10 lg:p-12 relative z-10">
                  <h3 className="text-2xl font-display font-bold mb-2">Student</h3>
                  <p className="text-foreground/60 text-sm mb-6 h-10">&quot;Check my attendance anywhere, anytime.&quot;</p>
                  <ul className="space-y-3 mb-10">
                    {["Live attendance tracking", "Attendance history", "Regularisation requests", "75% threshold alerts"].map((li, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 size={16} className="text-cyan-500" /> {li}
                      </li>
                    ))}
                  </ul>
                  <div className="aspect-[4/3] rounded-xl border border-cyan-500/20 bg-background/90 shadow-2xl relative overflow-hidden transform group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 flex">
                    <div className="w-[25%] h-full border-r border-border/50 bg-foreground/5 p-2 flex flex-col gap-2">
                      <div className="w-full h-3 bg-cyan-500/30 rounded-md mb-2" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center pb-1">
                        <div className="w-12 h-2 bg-foreground/20 rounded-md" />
                        <div className="w-4 h-4 rounded-full bg-cyan-500/30" />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20" />
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="w-20 h-2 bg-foreground/30 rounded-md" />
                          <div className="w-12 h-2 bg-cyan-500/50 rounded-md" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="h-10 bg-cyan-500/10 rounded-lg border border-cyan-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full border-2 border-cyan-500 border-t-transparent" />
                        </div>
                        <div className="h-10 bg-foreground/5 rounded-lg border border-border/50 flex flex-col justify-center px-2 gap-1">
                          <div className="w-full h-1 bg-foreground/20 rounded-full" />
                          <div className="w-3/4 h-1 bg-foreground/20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TEACHER */}
              <div className="rounded-[2rem] border border-violet-500/30 shadow-xl overflow-hidden group relative bg-gradient-to-br from-violet-500/10 via-background to-purple-500/5 lg:-translate-y-4">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="h-2 w-full bg-gradient-to-r from-violet-400 to-purple-500" />
                <div className="p-10 lg:p-12 relative z-10">
                  <h3 className="text-2xl font-display font-bold mb-2">Teacher</h3>
                  <p className="text-foreground/60 text-sm mb-6 h-10">&quot;Run attendance without the paperwork.&quot;</p>
                  <ul className="space-y-3 mb-10">
                    {["Live AI attendance", "Class management", "Student records", "Attendance analytics"].map((li, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 size={16} className="text-violet-500" /> {li}
                      </li>
                    ))}
                  </ul>
                  <div className="aspect-[4/3] rounded-xl border border-violet-500/20 bg-background/90 shadow-2xl relative overflow-hidden transform group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 flex">
                    <div className="w-[25%] h-full border-r border-border/50 bg-foreground/5 p-2 flex flex-col gap-2">
                      <div className="w-full h-3 bg-violet-500/30 rounded-md mb-2" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center pb-1">
                        <div className="w-16 h-2 bg-foreground/20 rounded-md" />
                        <div className="w-4 h-4 rounded-full bg-violet-500/30" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-1">
                        <div className="h-8 bg-violet-500/10 rounded-lg border border-violet-500/20 flex flex-col justify-center px-2">
                          <div className="w-4 h-1 bg-violet-500/50 mb-1 rounded-sm" />
                          <div className="w-8 h-2 bg-violet-500 rounded-sm" />
                        </div>
                        <div className="h-8 bg-foreground/5 rounded-lg border border-border/50 flex flex-col justify-center px-2">
                          <div className="w-4 h-1 bg-foreground/40 mb-1 rounded-sm" />
                          <div className="w-8 h-2 bg-foreground/30 rounded-sm" />
                        </div>
                      </div>
                      <div className="flex-1 bg-foreground/5 rounded-lg border border-border/50 flex flex-col p-2 gap-1.5 overflow-hidden">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-foreground/10" />
                              <div className="w-12 h-1.5 bg-foreground/20 rounded-sm" />
                            </div>
                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADMIN */}
              <div className="rounded-[2rem] border border-emerald-500/30 shadow-xl overflow-hidden group relative bg-gradient-to-br from-emerald-500/10 via-background to-green-500/5">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-green-500" />
                <div className="p-10 lg:p-12 relative z-10">
                  <h3 className="text-2xl font-display font-bold mb-2">Admin</h3>
                  <p className="text-foreground/60 text-sm mb-6 h-10">&quot;Manage attendance at institution scale.&quot;</p>
                  <ul className="space-y-3 mb-10">
                    {["User management", "Classes & assignments", "Reports", "Audit & system monitoring"].map((li, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 size={16} className="text-emerald-500" /> {li}
                      </li>
                    ))}
                  </ul>
                  <div className="aspect-[4/3] rounded-xl border border-emerald-500/20 bg-background/90 shadow-2xl relative overflow-hidden transform group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 flex">
                    <div className="w-[25%] h-full border-r border-border/50 bg-foreground/5 p-2 flex flex-col gap-2">
                      <div className="w-full h-3 bg-emerald-500/30 rounded-md mb-2" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                      <div className="w-full h-2 bg-foreground/10 rounded-md" />
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center pb-1">
                        <div className="w-20 h-2 bg-foreground/20 rounded-md" />
                        <div className="w-4 h-4 rounded-full bg-emerald-500/30" />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 mb-1">
                        {[...Array(4)].map((_, k) => (
                          <div key={k} className="h-6 bg-emerald-500/10 rounded border border-emerald-500/20" />
                        ))}
                      </div>
                      <div className="flex-1 bg-foreground/5 rounded-lg border border-border/50 p-2 flex items-end justify-between px-4 gap-1 relative overflow-hidden">
                        <div className="absolute top-2 left-2 text-[6px] font-bold text-foreground/40">ANALYTICS</div>
                        {[40, 70, 45, 90, 65, 80, 50].map((height, k) => (
                          <div key={k} className="w-full bg-emerald-500/40 rounded-t-sm" style={{ height: `${height}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT / TRUST */}
        <section id="about" className="py-32 lg:py-40 bg-foreground/[0.02] border-y border-border/50">
          <div className="container mx-auto px-6 max-w-[90rem]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 glass-card p-10 rounded-[2rem] border border-border flex flex-col items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
                <div className="w-full max-w-xs space-y-4 relative z-10 text-center text-sm font-bold">
                  <div className="bg-background rounded-xl p-4 border border-border shadow-sm">Teacher</div>
                  <div className="mx-auto w-px h-6 bg-border" />
                  <div className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-xl p-4 shadow-sm flex items-center justify-center gap-2">
                    <ScanFace size={18} /> Live Attendance Session
                  </div>
                  <div className="mx-auto w-px h-6 bg-border" />
                  <div className="bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 rounded-xl p-4 shadow-sm">AI Face Recognition</div>
                  <div className="mx-auto w-px h-6 bg-border" />
                  <div className="bg-foreground/5 text-foreground rounded-xl p-4 border border-border shadow-sm">Attendance Database</div>
                  <div className="mx-auto w-px h-6 bg-border" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background rounded-xl p-4 border border-border shadow-sm">Student Dashboard</div>
                    <div className="bg-background rounded-xl p-4 border border-border shadow-sm">Admin Dashboard</div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 space-y-6">
                <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-500">
                  Built for Modern Campuses
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight">
                  Less Manual Work. <br />More Reliable Attendance.
                </h2>
                <p className="text-foreground/60 text-lg leading-relaxed">
                  SmartAttend connects attendance capture, dashboards, analytics, and workflows into one platform. We replace paper registers and slow card scans with frictionless, liveness-verified AI processing.
                </p>
                <div className="space-y-4 pt-4">
                  {["Real-Time Attendance", "Role-Based Access", "Privacy-Conscious Design"].map((trust, i) => (
                    <div key={i} className="flex items-center gap-3 font-semibold">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Check size={14} />
                      </div>
                      {trust}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section className="py-32 lg:py-40">
          <div className="container mx-auto px-6 max-w-[90rem]">
            <div className="text-center max-w-2xl mx-auto mb-20 lg:mb-24 space-y-4">
              <span className="inline-block rounded-full bg-foreground/5 border border-border/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground/60">
                Meet the Team
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                The Minds Behind SmartAttend
              </h2>
              <p className="text-foreground/60 text-lg">
                Built with a focus on practical AI, intuitive design, and real-world campus workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {[
                {
                  name: "Upendra Singh", role: "Student",
                  desc: "Visionary leader driving SmartAttend's mission to revolutionize attendance management in educational institutions.",
                  grad: "from-amber-400 to-red-500", initials: "U P",
                  tags: ["AI-First", "Education"], phone: "+91-7089478966",
                },
                {
                  name: "Vishesh Sharma", role: "Student",
                  desc: "Operations expert ensuring seamless deployment and exceptional customer experience across institutions.",
                  grad: "from-violet-500 to-indigo-600", initials: "V S",
                  tags: ["Growth", "Excellence"], phone: "+91-7954590729",
                },
              ].map((member, i) => (
                <div key={i} className="bg-background rounded-[2rem] border border-border shadow-xl overflow-hidden group">
                  <div className={cn("h-40 w-full bg-gradient-to-br relative", member.grad)}>
                    <span className="absolute top-4 left-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                      {member.role}
                    </span>
                  </div>
                  <div className="px-8 pb-8 pt-0 relative flex flex-col items-center text-center bg-background">
                    <div className="w-24 h-24 rounded-full border-[6px] border-background -mt-12 mb-4 flex items-center justify-center text-3xl font-display font-extrabold text-foreground bg-white shadow-md relative z-10">
                      <span className={cn("text-transparent bg-clip-text bg-gradient-to-br", member.grad)}>{member.initials}</span>
                    </div>
                    <h3 className="text-2xl font-bold">{member.name}</h3>
                    <p className={cn("text-sm font-bold mt-1 mb-6 text-transparent bg-clip-text bg-gradient-to-r", member.grad)}>{member.role}</p>
                    <div className="flex gap-3 justify-center mb-6">
                      {member.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1.5 rounded-full bg-foreground/5 text-xs font-bold text-foreground/70 border border-border/50 flex items-center gap-1.5">
                          <CheckCircle2 size={12} className={cn("text-transparent", member.grad)} /> {tag}
                        </span>
                      ))}
                    </div>
                    <div className="w-full h-px bg-border/50 mb-6" />
                    <p className="text-sm text-foreground/60 leading-relaxed mb-8 h-20 flex items-center justify-center">{member.desc}</p>
                    <div className={cn("w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg bg-gradient-to-r flex items-center justify-center gap-2", member.grad)}>
                      <Phone size={16} /> {member.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="contact" className="py-32 lg:py-40 px-4">
          <div className="container mx-auto max-w-6xl relative overflow-hidden rounded-[3rem] text-white shadow-2xl p-16 lg:p-32 text-center bg-gray-900">
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/cta-bg.png" alt="Transform your institution" className="w-full h-full object-cover opacity-30 mix-blend-luminosity transform scale-105" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-blue-900/90 mix-blend-multiply" />
            </div>
            <svg className="absolute inset-0 w-full h-full opacity-10 z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <pattern id="cta-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#cta-dots)" />
            </svg>

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wider backdrop-blur-md border border-white/20">
                Ready to Get Started?
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                Transform Your Institution&apos;s Attendance Today
              </h2>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                Bring AI-powered attendance, real-time insights, and streamlined workflows together in one platform.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={goLogin} className="rounded-full bg-white text-indigo-900 px-8 py-4 text-base font-bold shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
                  Get in Touch
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold backdrop-blur-sm">support@smartattend.edu</span>
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold backdrop-blur-sm">+91 98765 43210</span>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/10 mt-12">
                {[
                  ["99.9%", "Uptime"],
                  ["AI", "Face Verify"],
                  ["3", "User Roles"],
                ].map(([val, label], i) => (
                  <div key={i}>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.2 }}
                      className="text-3xl font-display font-bold"
                    >
                      {val}
                    </motion.p>
                    <p className="text-xs text-white/50 uppercase tracking-widest mt-1 font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0A1020] text-slate-300 py-16 relative z-10 border-t border-[#1E293B]">
        <div className="container mx-auto px-6 max-w-[90rem]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 lg:mb-24">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <ScanFace size={18} />
                </div>
                <span className="font-display font-bold text-xl">SmartAttend</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                AI-powered attendance management built for modern colleges and universities.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link}>
                    <button onClick={() => scrollTo(link)} className="hover:text-white transition-colors">{link}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>support@smartattend.edu</li>
                <li>+91 98765 43210</li>
                <li>Gwalior, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1E293B] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>Privacy-first · 512-d embeddings only — never face images</p>
            <p>© 2026 SmartAttend. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}