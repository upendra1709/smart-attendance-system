// 33. src/app/admin/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { Empty, ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { fmtDateTime } from "@/lib/format";
import {
  get, loadSessionsWithLabels,
  type AttendanceRow, type SessionRow, type UserRow,
} from "@/lib/admin-data";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [labelOf, setLabelOf] = useState<(id: number) => string>(() => (id: number) => `Class #${id}`);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const base = await loadSessionsWithLabels();
      setSessions(base.sessions);
      setLabelOf(() => base.label);
    } catch (e: any) {
      setError(e.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function exportSession(session: SessionRow) {
    setBusyId(session.id);
    setError("");
    setNotice("");
    try {
      const [records, students] = await Promise.all([
        get<AttendanceRow[]>(`/attendance/session/${session.id}`),
        get<UserRow[]>("/users?role=student"),
      ]);
      if (records.length === 0) {
        setNotice(`Session #${session.id} has no attendance records to export yet.`);
        return;
      }
      const byId = new Map(students.map((s) => [s.id, s]));
      const rows: (string | number)[][] = [
        ["Student ID", "Name", "Email", "Status", "Method", "Marked At"],
        ...records.map((r) => {
          const s = byId.get(r.student_id);
          return [r.student_id, s?.name ?? "", s?.email ?? "", r.status, r.method, r.marked_at];
        }),
      ];
      downloadCsv(`session_${session.id}.csv`, rows);
      setNotice(`Exported ${records.length} records for session #${session.id}.`);
    } catch (e: any) {
      setError(e.message || "Could not export this session");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = sessions.filter((s) =>
    `${labelOf(s.class_id)} session ${s.id}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DashboardShell navGroups={ADMIN_NAV} title="Reports" subtitle="Export attendance data" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader title="Reports" subtitle="Download a CSV of any session's attendance records." />
        <ErrorBox message={error} onRetry={load} />
        <InfoBox message={notice} />

        <div className="glass-card rounded-3xl p-4 relative">
          <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by class or session number…"
            className="w-full rounded-xl bg-background border border-border pl-9 pr-3 py-2.5 text-sm font-semibold outline-none"
          />
        </div>

        {loading ? (
          <Loading label="Loading sessions…" />
        ) : filtered.length === 0 ? (
          <Empty label="No sessions found." />
        ) : (
          <div className="glass-card rounded-3xl divide-y divide-border/50">
            {filtered.map((s) => (
              <div key={s.id} className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]">
                  <p className="font-bold">{labelOf(s.class_id)}</p>
                  <p className="text-xs text-zinc-500 mt-1">Session #{s.id} · {fmtDateTime(s.starts_at)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  s.status === "closed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}>
                  {s.status === "closed" ? "Completed" : "Open"}
                </span>
                <button
                  onClick={() => exportSession(s)}
                  disabled={busyId !== null}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold bg-emerald-500 text-white flex items-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  <Download size={14} /> {busyId === s.id ? "Exporting…" : "Export CSV"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}