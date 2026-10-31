"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera, History, Plus, BookOpen, Users, Clock, Play,
  CheckCircle2, CalendarDays, Loader2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { TEACHER_NAV } from "@/lib/teacher-nav";

type SessionRow = {
  id: number;
  subject_id: number;
  class_id: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  subject?: { code: string; name: string };
  class_?: { name: string };
};

const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

export default function TeacherSessionHubPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"live" | "history">("live");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // start-session form
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInput(new Date()));
  const [endsAt, setEndsAt] = useState(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sess, subs, cls] = await Promise.all([
        api("/sessions"),
        api("/classes/subjects"),
        api("/classes"),
      ]);
      setSessions(Array.isArray(sess) ? sess : []);
      setSubjects(Array.isArray(subs) ? subs : []);
      setClasses(Array.isArray(cls) ? cls : []);
    } catch (e: any) {
      setError(e.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const created = await api("/sessions", {
        method: "POST",
        body: JSON.stringify({
          subject_id: Number(subjectId),
          class_id: Number(classId),
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
        }),
      });
      router.push(`/teacher/session/${created.id}`);
    } catch (e: any) {
      setError(e.message || "Could not start session");
      setCreating(false);
    }
  }

  const open = sessions.filter((s) => s.status !== "closed");
  const history = sessions
    .filter((s) => s.status === "closed")
    .sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at));

  return (
    <DashboardShell navGroups={TEACHER_NAV} title="Live Attendance" subtitle="Conduct and review attendance sessions" accent="violet">
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        {/* Tabs */}
        <div className="inline-flex rounded-2xl border border-border p-1 glass-card">
          {([["live", "Live Marking", Camera], ["history", "Session History", History]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                tab === id ? "bg-violet-500/15 text-violet-400" : "text-zinc-400 hover:text-white"
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500 gap-3">
            <Loader2 className="animate-spin" size={20} /> Loading…
          </div>
        ) : tab === "live" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Start new session */}
            <motion.form
              onSubmit={startSession}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Plus size={18} className="text-violet-400" />
                <h3 className="font-display font-bold text-lg">Start New Session</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Subject</label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => { setSubjectId(e.target.value); setClassId(""); }}
                  className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-semibold outline-none focus:border-violet-500/50"
                >
                  <option value="">Select subject…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Class</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-semibold outline-none focus:border-violet-500/50"
                >
                  <option value="">Select class…</option>
                  {classes.filter((c) => !subjectId || c.subject_id === Number(subjectId)).map((c) => {
                    const subject = subjects.find((s) => s.id === c.subject_id);
                    return <option key={c.id} value={c.id}>{subject?.code || `Class #${c.id}`} · {c.schedule || "Schedule not set"} · {c.room || "Room not set"}</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Starts</label>
                  <input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-semibold outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ends</label>
                  <input
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-semibold outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating || !subjectId || !classId}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-500 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-600 transition-all disabled:opacity-50"
              >
                {creating ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                Start Attendance Session
              </button>
            </motion.form>

            {/* Active sessions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="space-y-4"
            >
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <span className="live-dot" /> Active Sessions
              </h3>
              {open.length === 0 ? (
                <div className="glass-card rounded-3xl p-10 text-center text-zinc-500 text-sm">
                  No active sessions. Start one on the left, or from your dashboard.
                </div>
              ) : (
                open.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/teacher/session/${s.id}`)}
                    className="w-full glass-card rounded-3xl p-5 flex items-center gap-4 hover:border-violet-500/30 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                      <Camera size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">
                        {s.subject?.code || "Session"} — {s.subject?.name || ""}
                      </p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <BookOpen size={12} /> {s.class_?.name || `Class #${s.class_id}`}
                        <Clock size={12} className="ml-2" /> {fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-bold text-violet-400">
                      Resume <ChevronRight size={16} />
                    </span>
                  </button>
                ))
              )}
            </motion.div>
          </div>
        ) : (
          /* History */
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border font-display font-bold flex items-center gap-2">
              <History size={18} className="text-violet-400" /> Past Sessions
            </div>
            {history.length === 0 ? (
              <p className="px-6 py-12 text-center text-zinc-500 text-sm">No completed sessions yet.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {history.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/teacher/session/${s.id}`)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {s.subject?.code || "Session"} — {s.subject?.name || ""}
                      </p>
                      <p className="text-xs text-zinc-500">{s.class_?.name || `Class #${s.class_id}`}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-500 shrink-0">
                      <p className="font-bold text-foreground">{fmtDate(s.starts_at)}</p>
                      <p>{fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}