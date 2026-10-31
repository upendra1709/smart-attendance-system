"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, CalendarDays, TrendingUp, AlertTriangle, GraduationCap,
  Play, BookOpen, BarChart3, Camera, Mail, Building2, Clock,
  CheckCircle2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { TEACHER_NAV } from "@/lib/teacher-nav";

type TodayClass = {
  code: string;
  name: string;
  time: string;
  students: number;
  present?: number;
  late?: number;
  absent?: number;
  status: "COMPLETED" | "LIVE" | "UPCOMING";
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const user = getUser();
  const [stats, setStats] = useState({ total_students: 0, classes_today: 0, avg_attendance: 0, attention: 0 });
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const s = await api("/teacher/stats");
        setStats({
          total_students: s.total_students ?? 0,
          classes_today: s.classes_today ?? 0,
          avg_attendance: Math.round(s.avg_attendance ?? 0),
          attention: s.attention_count ?? 0,
        });
        setClasses(s.today_classes ?? []);
      } catch (e: any) {
        setError(e.message || "Could not load teacher statistics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = [
    { label: "Total Students", sub: "Total Enrolled", value: loading ? "—" : stats.total_students, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Classes Today", sub: `${classes.filter((c) => c.status === "COMPLETED").length} Completed`, value: loading ? "—" : stats.classes_today, icon: CalendarDays, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Average Class Attendance", sub: `Across ${stats.classes_today || "—"} Classes`, value: loading ? "—" : `${stats.avg_attendance}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Classes Requiring Attention", sub: "Attendance < 75%", value: loading ? "—" : stats.attention, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  const quickActions = [
    { label: "Start Attendance", icon: Camera, primary: true, onClick: () => router.push("/teacher/session") },
    { label: "My Classes", icon: BookOpen, onClick: () => router.push("/teacher/classes") },
    { label: "Students", icon: Users, onClick: () => router.push("/teacher/students") },
    { label: "Generate Report", icon: BarChart3, onClick: () => router.push("/teacher/reports") },
  ];

  return (
    <DashboardShell
      navGroups={TEACHER_NAV}
      title="Dashboard"
      subtitle="Computer Science 101 • Prof. Sharma"
      accent="violet"
      notifCount={2}
      notifications={[
        { title: "IT-105 is live now", desc: "Web Technologies · 12:15 PM", time: "Just now", icon: Camera },
        { title: "2 regularisation requests", desc: "Awaiting your approval", time: "1h ago", icon: CheckCircle2 },
      ]}
    >
      <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
            {error}
          </div>
        )}

        {/* Greeting */}
        <div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold">
            {greeting()}, {user?.name?.split(" ")[0] || "Prof. Sharma"} 👋
          </h2>
          <p className="text-zinc-500 font-semibold mt-1">
            Here&apos;s your teaching and attendance overview for today.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-3xl p-5 flex items-center gap-4"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", s.bg, s.color)}>
                <s.icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-400 truncate">{s.label}</p>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-xs text-zinc-500 truncate">{s.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          {quickActions.map((q) => (
            <button
              key={q.label}
              onClick={q.onClick}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5",
                q.primary
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-600"
                  : "glass-card hover:border-violet-500/30"
              )}
            >
              <q.icon size={16} /> {q.label}
            </button>
          ))}
        </div>

        {/* Profile card + Today's classes */}
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 font-display font-bold text-xl">
                {user?.name?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "AS"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-lg truncate">{user?.name || "Arjun Sharma"}</p>
                <p className="text-sm text-zinc-500 truncate flex items-center gap-1.5">
                  <Mail size={12} /> {user?.email || "arjun.sharma@smartattend.edu"}
                </p>
              </div>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-semibold flex items-center gap-2"><Building2 size={14} /> Department</span>
                <span className="font-bold text-violet-400">Computer Science</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-semibold flex items-center gap-2"><BookOpen size={14} /> Assigned Classes</span>
                <span className="font-bold">{stats.classes_today || "—"}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card rounded-3xl p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays size={18} className="text-violet-400" />
              <h3 className="font-display font-bold text-lg">Today&apos;s Classes</h3>
            </div>
            {!loading && classes.length === 0 && (
              <p className="text-sm text-zinc-500 mb-4">No sessions are scheduled for today.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {classes.map((c) => (
                <div key={c.code} className="rounded-2xl border border-border p-4 flex flex-col gap-2 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-center justify-between">
                    {c.status === "COMPLETED" ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-500 uppercase">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    ) : c.status === "LIVE" ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-[10px] font-bold text-red-500 uppercase">
                        <span className="live-dot" /> Live Now
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/5 border border-border px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase">
                        Upcoming
                      </span>
                    )}
                    <span className="text-xs font-bold text-zinc-500">{c.students} Students</span>
                  </div>
                  <p className="text-sm font-bold text-violet-400">{c.code}</p>
                  <p className="font-display font-bold">{c.name}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Clock size={12} /> {c.time}</p>
                  {c.status === "COMPLETED" && (
                    <p className="text-xs text-zinc-400">
                      {c.present} Present, {c.late} Late, {c.absent} Absent
                    </p>
                  )}
                  <button
                    onClick={() => router.push("/teacher/session")}
                    className={cn(
                      "mt-2 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all",
                      c.status === "LIVE"
                        ? "bg-violet-500 text-white hover:bg-violet-600"
                        : "border border-border hover:bg-white/5"
                    )}
                  >
                    {c.status === "LIVE" ? <>Start Attendance <ChevronRight size={14} /></> : "View Summary"}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}