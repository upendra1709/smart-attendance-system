"use client";

import { useEffect, useState } from "react";
import { Save, Search } from "lucide-react";
import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import RegularisationReview from "@/components/dashboard/RegularisationReview";
import { Empty, ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { TEACHER_NAV } from "@/lib/teacher-nav";

type SessionRow = { id: number; starts_at: string; status: string };
type RosterRow = { student_id: number; name: string; email: string; status: string; method: string | null };

export default function TeacherCorrectionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadSessions() {
    setLoading(true);
    setError("");
    try {
      const data = await api<SessionRow[]>("/sessions");
      setSessions(data);
      if (!selectedSessionId && data.length) setSelectedSessionId(String(data[0].id));
      else if (!data.length) setLoading(false);
    } catch (e: any) {
      setError(e.message || "Failed to load sessions");
      setLoading(false);
    }
  }

  async function loadRoster(sessionId: string) {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const data = await api(`/sessions/${sessionId}/roster`);
      setRows(data.roster);
    } catch (e: any) { setError(e.message || "Failed to load class roster"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { if (selectedSessionId) loadRoster(selectedSessionId); }, [selectedSessionId]);

  async function saveCorrection(studentId: number, status: string) {
    setSavingId(studentId);
    setError("");
    setNotice("");
    try {
      await api("/attendance", { method: "POST", body: JSON.stringify({ session_id: Number(selectedSessionId), student_id: studentId, status, method: "manual" }) });
      setNotice("Attendance correction saved to the database.");
      await loadRoster(selectedSessionId);
    } catch (e: any) { setError(e.message || "Could not save correction"); }
    finally { setSavingId(null); }
  }

  const filteredRows = rows.filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <DashboardShell navGroups={TEACHER_NAV} title="Attendance Corrections" subtitle="Class-specific records and regularisation approvals" accent="violet">
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-8">
        <PageHeader title="Corrections" subtitle="Only students enrolled in the selected class are shown" />
        <ErrorBox message={error} onRetry={loadSessions} />
        <InfoBox message={notice} />
        <div className="glass-card rounded-3xl p-4 grid md:grid-cols-[280px_1fr] gap-3">
          <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-bold">
            {sessions.map((session) => <option key={session.id} value={session.id}>Session #{session.id} · {new Date(session.starts_at).toLocaleDateString()} · {session.status}</option>)}
          </select>
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search enrolled student…" className="w-full rounded-xl bg-background border border-border pl-9 pr-3 py-2.5 text-sm font-semibold" /></div>
        </div>
        {loading ? <Loading /> : !sessions.length ? <Empty label="No sessions are available." /> : filteredRows.length === 0 ? <Empty /> : (
          <div className="glass-card rounded-3xl divide-y divide-border/50">
            {filteredRows.map((row) => (
              <div key={row.student_id} className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]"><p className="font-bold">{row.name}</p><p className="text-xs text-zinc-500">{row.email}</p></div>
                <StatusBadge status={row.status} />
                <div className="flex items-center gap-2">
                  {savingId === row.student_id && <span className="text-xs text-zinc-500">Saving…</span>}
                  {["present", "late", "absent"].map((status) => (
                    <button key={status} onClick={() => saveCorrection(row.student_id, status)} disabled={savingId !== null} className="rounded-xl px-3 py-2 text-xs font-bold border border-border hover:bg-white/5 disabled:opacity-50"><Save size={12} className="inline mr-1" />{status}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <RegularisationReview />
      </div>
    </DashboardShell>
  );
}
