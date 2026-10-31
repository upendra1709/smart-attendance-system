"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, ScanFace, LogOut, User as UserIcon, Settings, Menu, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser, logout, roleHome } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

export type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const ACCENTS = {
  violet: {
    activeText: "text-violet-500",
    activeBg: "bg-violet-500/10",
    logoGrad: "from-violet-500 to-purple-500",
    avatarBg: "bg-violet-500/20 text-violet-400",
    chipRing: "ring-violet-500/30",
  },
  cyan: {
    activeText: "text-cyan-500",
    activeBg: "bg-cyan-500/10",
    logoGrad: "from-cyan-400 to-blue-500",
    avatarBg: "bg-cyan-500/20 text-cyan-400",
    chipRing: "ring-cyan-500/30",
  },
  emerald: {
    activeText: "text-emerald-500",
    activeBg: "bg-emerald-500/10",
    logoGrad: "from-emerald-400 to-green-500",
    avatarBg: "bg-emerald-500/20 text-emerald-400",
    chipRing: "ring-emerald-500/30",
  },
} as const;

export type Accent = keyof typeof ACCENTS;

export default function DashboardShell({
  navGroups,
  title,
  subtitle,
  accent,
  liveBadge = false,
  notifCount = 0,
  notifications = [],
  children,
}: {
  navGroups: NavGroup[];
  title: string;
  subtitle?: string;
  accent: Accent;
  liveBadge?: boolean;
  notifCount?: number;
  notifications?: { title: string; desc: string; time: string; icon: React.ElementType }[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();
  const a = ACCENTS[accent];

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = (user?.name || "U S")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join(" ")
    .toUpperCase();

  const isActive = (href: string) =>
    pathname === href || (href !== roleHome(user?.role || "") && pathname.startsWith(href + "/"));

  const sidebar = (
    <div
      className={cn(
        "flex flex-col h-screen bg-[#09090B] border-r border-[#27272A] transition-all duration-300 sticky top-0 z-40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-6 pb-2">
        {!isCollapsed && (
          <Link href={roleHome(user?.role || "")} className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", a.logoGrad)}>
              <ScanFace size={22} />
            </div>
            <span className="font-display font-bold text-xl">SmartAttend</span>
          </Link>
        )}
        {isCollapsed && (
          <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg mx-auto", a.logoGrad)}>
            <ScanFace size={22} />
          </div>
        )}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1 text-zinc-400 hover:text-white"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                {group.label}
              </h3>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  isCollapsed && "justify-center px-0",
                  isActive(item.href)
                    ? cn(a.activeText, a.activeBg)
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={20} className="shrink-0" />
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
                {!isCollapsed && item.badge != null && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse (desktop) */}
      <div className="p-4 border-t border-[#27272A] hidden lg:block">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-sm font-semibold text-zinc-400 hover:text-white transition-colors w-full px-3 py-2"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-4 bg-background/80 backdrop-blur-md border-b border-[#27272A] z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl lg:text-2xl font-display font-bold">{title}</h1>
                {liveBadge && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                    <span className="live-dot" /> Live
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs lg:text-sm text-zinc-500 font-semibold">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-3 w-80 glass-card rounded-2xl border border-border shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-border font-bold text-sm">
                      Notifications {notifCount > 0 && <span className="text-zinc-500">({notifCount})</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-zinc-500">No notifications yet</p>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-white/5 transition-colors">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", a.avatarBg)}>
                              <n.icon size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-tight">{n.title}</p>
                              <p className="text-xs text-zinc-500 truncate">{n.desc}</p>
                              <p className="text-[10px] text-zinc-600 mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ThemeToggle />

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 pl-3 lg:pl-4 border-l border-[#27272A]"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold leading-tight">{user?.name || "User"}</p>
                  <p className="text-[11px] text-zinc-500 font-semibold capitalize">{user?.role}</p>
                </div>
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2",
                  a.avatarBg, a.chipRing
                )}>
                  {initials}
                </div>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-3 w-56 glass-card rounded-2xl border border-border shadow-2xl overflow-hidden z-50 py-1"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-bold truncate">{user?.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>
                    {[
                      { icon: UserIcon, label: "My Profile", onClick: () => router.push(`/${user?.role}/profile`) },
                      { icon: Settings, label: "Settings", onClick: () => router.push(`/${user?.role}/settings`) },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { item.onClick(); setProfileOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <item.icon size={16} /> {item.label}
                      </button>
                    ))}
                    <button
                      onClick={() => { setProfileOpen(false); setShowLogoutModal(true); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Logout modal */}
      {showLogoutModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowLogoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative glass-card rounded-3xl p-8 max-w-sm w-full border border-border shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirm Logout</h3>
              <p className="text-sm text-zinc-400 mb-6">Are you sure you want to log out?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-border font-bold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={logout}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 font-bold text-sm text-white hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
    </div>
  );
}