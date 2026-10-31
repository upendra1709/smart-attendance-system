"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, ScanFace, Search, Users, CheckCircle2, Clock, AlertTriangle,
  HelpCircle, TrendingUp, TrendingDown, Minus, Hand, Loader2, ChevronLeft, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SessionFaceScanner from "@/components/dashboard/SessionFaceScanner";
import { TEACHER_NAV } from "@/lib/teacher-nav";

type RosterEntry = { student_id: number; name: string; status: string; method: string | null };
type Counts = { present: number; late: number; absent: number; leave: number; on_duty: number; pending: number };

const STATUS_STYLE: Record<string, string> = {
  present: "badge-present", late: "badge-late", absent: "badge-absent",
  leave: "badge-leave", on_duty: "badge-on_duty", pending: "badge-pending",
};

export default function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = Number(id);

  const [session, setSession] = useState<any>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [counts, setCounts] = useState<Counts>({ present: 0, late: 0, absent: 0, leave: 0, on_duty: 0, pending: 0 });
  const [prevCounts, setPrevCounts] = useState<Counts | null>(null);
  const [closed, setClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [search, setSearch] = useState("");
  const [sortName, setSortName] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [toast, setToast] = useState<{ name: string; time: string } | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api(`/sessions/${sessionId}/roster`);
      setSession(data.session);
      setClosed(data.session.status === "closed");
      setPrevCounts(counts);
      setCounts(data.counts);
      // AI-recognition toast: students marked with a non-manual method since last poll
      if (roster.length) {
        const before = new Map(roster.map((r) => [r.student_id, r.status]));
        const fresh = data.roster.filter(
          (r: RosterEntry) =>
            r.method && r.method !== "manual" && before.get(r.student_id) === "pending" && r.status !== "pending"
        );
        if (fresh.length) {
          if (toastTimer.current) clearTimeout(toastTimer.current);
          setToast({ name: fresh[fresh.length - 1].name, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
          toastTimer.current = setTimeout(() => setToast(null), 4000);
        }
      }
      setRoster(data.roster);
    } catch (e: any) {
      setError(e.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // live sync
    return () => clearInterval(t);
  }, [load]);

  async function mark(studentId: number, status: string) {
    setBusy(studentId);
    try {
      await api("/attendance", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, student_id: studentId, status, method: "manual" }),
      });
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to mark attendance");
    } finally {
      setBusy(null);
    }
  }

  async function bulk(status: "present" | "absent") {
    setBusy(-1);
    try {
      const pendingOnly = roster.filter((r) => r.status === "pending");
      await Promise.all(
        pendingOnly.map((r) =>
          api("/attendance", {
            method: "POST",
            body: JSON.stringify({ session_id: sessionId, student_id: r.student_id, status, method: "manual" }),
          })
        )
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function endSession() {
    setEnding(true);
    try {
      await api(`/sessions/${sessionId}/close`, { method: "POST" });
      setClosed(true);
      setShowEndModal(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Could not close session");
    } finally {
      setEnding(false);
    }
  }

  const filtered = roster
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortName ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  const total = roster.length || 1;
  const pct = Math.round(((counts.present + counts.late) / total) * 100);

  const delta = (k: keyof Counts) => {
    if (!prevCounts) return null;
    const d = counts[k] - prevCounts[k];
    if (d > 0) return <span className="text-emerald-500 text-xs font-bold">+{d} <TrendingUp size={11} className="inline" /></span>;
    if (d < 0) return <span className="text-red-500 text-xs font-bold">{d} <TrendingDown size={11} className="inline" /></span>;
    return <span className="text-zinc-600 text-xs font-bold"><Minus size={11} className="inline" /></span>;
  };

  const statCards: { label: string; k: keyof Counts; icon: any; color: string; bg: string }[] = [
    { label: "Present", k: "present", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Late", k: "late", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Absent", k: "absent", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Pending", k: "pending", icon: HelpCircle, color: "text-zinc-400", bg: "bg-white/5" },
  ];

  return (
    <DashboardShell
      navGroups={TEACHER_NAV}
      title="Live Session"
      subtitle={session ? `Session #${session.id} · Class #${session.class_id}` : "Live Attendance"}
      accent="violet"
      liveBadge={!closed}
    >
      <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 flex items-center justify-between">
            {error}
            <button onClick={() => setError("")}><X size={16} /></button>
          </div>
        )}

        {/* Review banner when closed */}
        {closed && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-500 flex items-center gap-2">
                <CheckCircle2 size={18} /> Session Closed — Attendance Saved
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {counts.present} present · {counts.late} late · {counts.absent} absent · {pct}% attendance rate
              </p>
            </div>
            <button
              onClick={() => router.push("/teacher/session")}
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-border px-4 py-2 text-sm font-bold hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={14} /> Back to Sessions
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-3xl p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-400">{s.label}</p>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.bg, s.color)}>
                  <s.icon size={18} />
                </div>
              </div>
              <p className="text-3xl font-display font-bold mt-1">
                {loading ? "—" : counts[s.k]}
                <span className="ml-2">{delta(s.k)}</span>
              </p>
            </motion.div>
          ))}
        </div>

        <div className={cn("grid gap-6", manualMode ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-[1fr_420px]")}>
          {/* ROSTER */}
          <div className="glass-card rounded-3xl p-5 lg:p-6 order-2 xl:order-1">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <h3 className="font-display font-bold text-lg flex items-center gap-2 flex-1">
                <Users size={18} className="text-violet-400" /> Class Roster
                <span className="text-xs font-bold text-zinc-500 bg-white/5 rounded-full px-2 py-0.5">{roster.length} Students</span>
              </h3>
              <select
                value={sortName ? "name" : "name-desc"}
                onChange={(e) => setSortName(e.target.value === "name")}
                className="rounded-xl bg-background border border-border px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="name">Sort by Name (A–Z)</option>
                <option value="name-desc">Sort by Name (Z–A)</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name…"
                  className="w-full rounded-xl bg-background border border-border pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-500/50"
                />
              </div>
              {!closed && (
                <>
                  <button
                    onClick={() => bulk("present")}
                    disabled={busy === -1}
                    className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    All Present
                  </button>
                  <button
                    onClick={() => bulk("absent")}
                    disabled={busy === -1}
                    className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    All Absent
                  </button>
                </>
              )}
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {loading && roster.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-zinc-500 gap-3">
                  <Loader2 className="animate-spin" size={18} /> Loading roster…
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-16 text-zinc-500 text-sm">No students match your search.</p>
              ) : (
                filtered.map((r, i) => {
                  const initials = r.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const pending = r.status === "pending";
                  return (
                    <div key={r.student_id} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 hover:border-violet-500/20 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <p className="font-bold text-sm flex-1 truncate">{i + 1}. {r.name}</p>
                      {pending && !closed ? (
                        <div className="flex items-center gap-1.5">
                          {busy === r.student_id && <Loader2 size={14} className="animate-spin text-zinc-500" />}
                          {(["present", "late", "absent"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => mark(r.student_id, st)}
                              disabled={busy !== null}
                              className={cn(
                                "rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors disabled:opacity-40",
                                st === "present" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
                                st === "late" && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
                                st === "absent" && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                              )}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={cn(STATUS_STYLE[r.status] || "badge-pending")}>
                          {r.status.replace("_", "-")}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {!closed && (
              <button
                onClick={() => setShowEndModal(true)}
                className="mt-5 w-full rounded-2xl bg-red-500/10 border border-red-500/30 py-3.5 text-sm font-bold text-red-500 hover:bg-red-500/20 transition-colors"
              >
                End Session & Save Attendance
              </button>
            )}
          </div>

          {/* Real OpenCV camera recognition */}
          {!manualMode && (
            <div className="order-1 xl:order-2">
              <SessionFaceScanner
                sessionId={sessionId}
                closed={closed}
                onMarked={load}
                onManual={() => setManualMode(true)}
              />
              <AnimatePresence>
                {toast && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="mt-3 flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 px-4 py-3"
                  >
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <p className="text-xs font-bold text-emerald-400">Present: {toast.name} · {toast.time}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {manualMode && !closed && (
          <button
            onClick={() => setManualMode(false)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/30 hover:bg-violet-600 transition-colors"
          >
            <Camera size={16} /> Show Camera Panel
          </button>
        )}
      </div>

      {/* End session modal */}
      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEndModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative glass-card rounded-3xl p-8 max-w-sm w-full border border-border shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hand size={28} />
              </div>
              <h3 className="text-xl font-bold mb-2">End Session?</h3>
              <p className="text-sm text-zinc-400 mb-2">
                {counts.pending} students are still pending — they&apos;ll be recorded as absent.
              </p>
              <p className="text-sm text-zinc-500 mb-6">This locks the attendance record.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-border font-bold text-sm hover:bg-white/10 transition-colors"
                >
                  Keep Marking
                </button>
                <button
                  onClick={endSession}
                  disabled={ending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 font-bold text-sm text-white hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {ending && <Loader2 className="animate-spin" size={14} />} End Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}