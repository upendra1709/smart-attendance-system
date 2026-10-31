"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight,
  ScanFace, Users, Activity, User, UserPlus, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { login, roleHome } from "@/lib/auth";
import ParticleBackground from "@/components/ParticleBackground";
import AuthNavbar from "@/components/AuthNavbar";

const CAROUSEL_SLIDES = [
  { id: 0, icon: ScanFace, title: "Face Recognition", subtitle: "AI-powered instant marking" },
  { id: 1, icon: Users, title: "Multi-role Access", subtitle: "For everyone in the organization" },
  { id: 2, icon: Activity, title: "Real-time Analytics", subtitle: "Live insights and reporting" },
];

const ROLE_TITLES: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Administrator",
};

function useIsDark() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function RoleLoginPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const role = params?.role ?? "student";
  const roleTitle = ROLE_TITLES[role] ?? "Student";
  const isDark = useIsDark();

  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(roleHome(user.role));
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
      setLoading(false);
    }
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setNotice("Accounts are created by your institution's administrator. Please contact your admin to get access.");
  }

  function handleGoogle() {
    setNotice("Google sign-in is coming soon. Please use your email and password.");
  }

  return (
    <div className="flex w-full min-h-screen relative z-10 animate-fade-in bg-background text-foreground overflow-hidden">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden border-r border-border/50 shadow-[1px_0_15px_rgba(0,0,0,0.05)] z-20 bg-background">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/assets/login-left-bg.jpeg)" }}
        />
        <div
          className={cn(
            "absolute inset-0 z-0 transition-colors duration-500",
            isDark ? "bg-[#0A0E1A]/80" : "bg-[#F8FAFC]/85"
          )}
        />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent z-0" />

        <div className="relative z-10 max-w-md mt-12">
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-foreground/5 text-foreground/70 hover:text-foreground text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Choose another role
          </button>
          <h1 className="text-5xl font-display font-bold mb-4 tracking-tight">
            {isLogin ? "Welcome Back!" : "Join Us Today"}
          </h1>
          <p className="text-lg text-foreground/70 mb-12">
            Experience AI-powered attendance tracking that works seamlessly across your organization.
          </p>
        </div>

        <div className="relative z-10 w-full max-w-md mt-auto mb-12">
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  {(() => {
                    const ActiveIcon = CAROUSEL_SLIDES[activeSlide].icon;
                    return <ActiveIcon size={32} />;
                  })()}
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">
                  {CAROUSEL_SLIDES[activeSlide].title}
                </h3>
                <p className="text-foreground/60">{CAROUSEL_SLIDES[activeSlide].subtitle}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-8">
              {CAROUSEL_SLIDES.map((slide) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlide(slide.id)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    activeSlide === slide.id ? "w-6 bg-primary" : "bg-foreground/20 hover:bg-foreground/40"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <ParticleBackground />

        <div className="w-full max-w-md relative z-10 shadow-none lg:mt-16">
          {notice && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-sm text-foreground/80">
              {notice}
            </div>
          )}

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="flex flex-col items-center mb-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white mb-6 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-display font-bold mb-2">{roleTitle} Login</h2>
                  <p className="text-foreground/60">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 block">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-primary transition-colors z-10">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(
                          "w-full pl-11 pr-4 py-3 rounded-xl bg-background border outline-none transition-all duration-200 glass-card relative z-0 text-foreground",
                          error
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            : "border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                        )}
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 block">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-primary transition-colors z-10">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(
                          "w-full pl-11 pr-12 py-3 rounded-xl bg-background border outline-none transition-all duration-200 glass-card relative z-0 text-foreground",
                          error
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            : "border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                        )}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground/40 hover:text-foreground/80 transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm font-medium mt-2">{error}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 bg-background accent-primary transition-colors cursor-pointer"
                      />
                      <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNotice("Password reset is not enabled yet. Contact your administrator.")}
                      className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-primary to-blue-600 hover:from-primary hover:to-blue-500 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {loading ? "Signing in…" : `Sign In as ${roleTitle}`}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-sm text-foreground/40 font-medium">or continue with</span>
                  <div className="h-px bg-border flex-1" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  className="mt-8 w-full py-3 px-4 rounded-xl border border-border bg-background hover:bg-foreground/5 text-foreground font-medium transition-all duration-300 flex items-center justify-center gap-3 glass-card hover:-translate-y-0.5"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                <p className="mt-8 text-center text-sm text-foreground/70">
                  New to SmartAttend?{" "}
                  <button onClick={() => { setIsLogin(false); setNotice(""); setError(""); }} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Create an account
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="flex flex-col items-center mb-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white mb-6 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-display font-bold mb-2">Create {roleTitle} Account</h2>
                  <p className="text-foreground/60">Join SmartAttend to track with AI</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 block">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-primary transition-colors z-10">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border outline-none transition-all duration-200 glass-card focus:border-primary/50 focus:ring-1 focus:ring-primary/50 relative z-0 text-foreground"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 block">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-primary transition-colors z-10">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border outline-none transition-all duration-200 glass-card focus:border-primary/50 focus:ring-1 focus:ring-primary/50 relative z-0 text-foreground"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80 block">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/40 group-focus-within:text-primary transition-colors z-10">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-background border border-border outline-none transition-all duration-200 glass-card focus:border-primary/50 focus:ring-1 focus:ring-primary/50 relative z-0 text-foreground"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground/40 hover:text-foreground/80 transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-primary to-blue-600 hover:from-primary hover:to-blue-500 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group hover:-translate-y-0.5"
                  >
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-sm text-foreground/40 font-medium">or continue with</span>
                  <div className="h-px bg-border flex-1" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  className="mt-8 w-full py-3 px-4 rounded-xl border border-border bg-background hover:bg-foreground/5 text-foreground font-medium transition-all duration-300 flex items-center justify-center gap-3 glass-card hover:-translate-y-0.5"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                <p className="mt-8 text-center text-sm text-foreground/70">
                  Already have an account?{" "}
                  <button onClick={() => { setIsLogin(true); setNotice(""); }} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-6 w-full text-center z-10">
          <p className="text-xs text-foreground/40 font-medium">
            © 2026 SmartAttend. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}