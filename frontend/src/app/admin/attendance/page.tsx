// 32. src/app/admin/attendance/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Save, Search } from "lucide-react";
import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { Empty, ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { fmtDateTime } from "@/lib/format";
import {
  get, loadSessionsWithLabels,
  type SessionRow,
} from "@/lib/admin-data";

type MarkedStatus = "present" | "late" | "absent";
type Row = { id: number; name: string; email: string; status: MarkedStatus | "pending"; method: string };
type RosterRow = { student_id: number; name: string; email: string; status: MarkedStatus | "pending"; method: string | null };
const STATUSES: MarkedStatus[] = ["present", "late", "absent"];

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [labelOf, setLabelOf] = useState<(id: number) => string>(() => (id: number) => `Class #${id}`);
  const [rows, setRows] = useState<Row[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestId = useRef(0);

  async function loadInitial() {
    setLoading(true);
    setError("");
    try {
      const base = await loadSessionsWithLabels();
      setSessions(base.sessions);
      setLabelOf(() => base.label);
      if (!sessionId && base.sessions.length > 0) setSessionId(String(base.sessions[0].id));
    } catch (e: any) {
      setError(e.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  async function loadRoster(id: string) {
    if (!id) return;
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const data = await get<{ roster: RosterRow[] }>(`/sessions/${id}/roster`);
      if (current !== requestId.current) return;
      setRows(data.roster.map((row) => ({
        id: row.student_id,
        name: row.name,
        email: row.email,
        status: row.status,
        method: row.method ?? "manual",
      })));
    } catch (e: any) {
      if (current === requestId.current) setError(e.message || "Failed to load attendance");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessionId) loadRoster(sessionId);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function override(studentId: number, status: MarkedStatus) {
    setSavingId(studentId);
    setError("");
    setNotice("");
    try {
      await api("/attendance", {
        method: "POST",
        body: JSON.stringify({ session_id: Number(sessionId), student_id: studentId, status, method: "manual" }),
      });
      setRows((prev) => prev.map((r) => (r.id === studentId ? { ...r, status, method: "manual" } : r)));
      setNotice("Attendance record updated.");
    } catch (e: any) {
      setError(e.message || "Could not update attendance");
    } finally {
      setSavingId(null);
    }
  }

  const count = (st: string) => rows.filter((r) => r.status === st).length;
  const selected = sessions.find((s) => String(s.id) === sessionId);
  const filtered = rows.filter((r) => `${r.name} ${r.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <DashboardShell navGroups={ADMIN_NAV} title="Attendance" subtitle="Review and override attendance by session" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader
          title="Attendance"
          subtitle={selected ? `${labelOf(selected.class_id)} · ${fmtDateTime(selected.starts_at)}` : "Select a session"}
        />
        <ErrorBox message={error} onRetry={loadInitial} />
        <InfoBox message={notice} />

        <div className="glass-card rounded-3xl p-4 grid md:grid-cols-[340px_1fr] gap-3">
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-bold"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} · {labelOf(s.class_id)} · {new Date(s.starts_at).toLocaleDateString()}
                {s.status === "closed" ? " (closed)" : ""}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student…"
              className="w-full rounded-xl bg-background border border-border pl-9 pr-3 py-2.5 text-sm font-semibold outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Present", count("present"), "text-emerald-500"],
            ["Late", count("late"), "text-amber-500"],
            ["Absent", count("absent"), "text-red-500"],
            ["Not marked", count("pending"), "text-zinc-500"],
          ].map(([label, value, tone]) => (
            <div key={label as string} className="glass-card rounded-2xl p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
              <p className={`text-2xl font-display font-bold mt-1 ${tone}`}>{value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <Loading label="Loading attendance…" />
        ) : filtered.length === 0 ? (
          <Empty label="No students to show for this session." />
        ) : (
          <div className="glass-card rounded-3xl divide-y divide-border/50">
            {filtered.map((row) => (
              <div key={row.id} className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]">
                  <p className="font-bold">{row.name}</p>
                  <p className="text-xs text-zinc-500">{row.email}</p>
                </div>
                <StatusBadge status={row.status} />
                <div className="flex items-center gap-2">
                  {savingId === row.id && <span className="text-xs text-zinc-500">Saving…</span>}
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() => override(row.id, st)}
                      disabled={savingId !== null || row.status === st}
                      className={
                        row.status === st
                          ? "rounded-xl px-3 py-2 text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                          : "rounded-xl px-3 py-2 text-xs font-bold border border-border hover:bg-white/5 disabled:opacity-50"
                      }
                    >
                      <Save size={12} className="inline mr-1" />
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}