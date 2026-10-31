"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Filter,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import { getUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  Empty,
  ErrorBox,
  Loading,
} from "@/components/dashboard/DataState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { STUDENT_NAV } from "@/lib/student-nav";
import { fmtDateTime } from "@/lib/format";

type AttendanceRecord = {
  session_id: number;
  subject_code?: string | null;
  subject_name?: string | null;
  status: "present" | "late" | "absent";
  method: string;
  marked_at: string;
};

type StudentSummary = {
  student_id: number;
  total_sessions: number;
  attended: number;
  percentage: number;
  is_defaulter: boolean;
  records: AttendanceRecord[];
};

export default function StudentHistoryPage() {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(silent = false) {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const user = getUser();

      if (!user) {
        throw new Error("Your login session has expired. Please log in again.");
      }

      const data = await api(`/attendance/student/${user.id}`);
      setSummary(data);
    } catch (e: any) {
      if (!silent) setError(e.message || "Failed to load attendance history");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);
  useAutoRefresh(() => load(true), 5000);

  const filteredRecords = [...(summary?.records || [])]
    .filter((record) => {
      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;

      const matchesQuery = `session ${record.session_id} ${record.subject_code ?? ""} ${record.subject_name ?? ""} ${record.method}`
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesStatus && matchesQuery;
    })
    .sort(
      (a, b) =>
        new Date(b.marked_at).getTime() -
        new Date(a.marked_at).getTime()
    );

  return (
    <DashboardShell
      navGroups={STUDENT_NAV}
      title="Attendance History"
      subtitle="Review and filter your attendance records"
      accent="emerald"
    >
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader
          title="Attendance History"
          subtitle={`${summary?.total_sessions || 0} marked sessions · ${
            summary?.percentage || 0
          }% attendance`}
        />

        <ErrorBox message={error} onRetry={() => load()} />

        <div className="glass-card rounded-3xl p-4 grid md:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by session ID or marking method…"
              aria-label="Search attendance history"
              className="w-full rounded-xl bg-background border border-border pl-9 pr-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"
            />
          </div>

          <div className="relative">
            <Filter
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter attendance by status"
              className="w-full rounded-xl bg-background border border-border pl-9 pr-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
            >
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Loading label="Loading attendance history…" />
        ) : filteredRecords.length === 0 ? (
          <Empty
            label={
              summary?.records.length
                ? "No records match your current search and filters."
                : "No attendance records have been marked for you yet."
            }
          />
        ) : (
          <>
            <p className="text-xs font-semibold text-zinc-500">
              Showing {filteredRecords.length} of{" "}
              {summary?.records.length || 0} records
            </p>

            <div className="glass-card rounded-3xl divide-y divide-border/50 overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_140px_160px_190px] gap-4 px-5 py-3 text-xs font-bold uppercase text-zinc-500 border-b border-border/50">
                <span>Session</span>
                <span>Status</span>
                <span>Method</span>
                <span>Marked At</span>
              </div>

              {filteredRecords.map((record) => (
                <div
                  key={`${record.session_id}-${record.marked_at}`}
                  className="p-5 grid gap-3 md:grid-cols-[1fr_140px_160px_190px] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <CalendarDays size={17} />
                    </div>
                    <div>
                      <p className="font-bold">
                        {record.subject_name
                          ? `${record.subject_code} · ${record.subject_name}`
                          : `Session #${record.session_id}`}
                      </p>
                      <p className="text-xs text-zinc-500 md:hidden">
                        {fmtDateTime(record.marked_at)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <StatusBadge status={record.status} />
                  </div>

                  <p className="text-sm font-semibold text-zinc-400 capitalize">
                    {record.method}
                  </p>

                  <p className="hidden md:block text-xs font-semibold text-zinc-500">
                    {fmtDateTime(record.marked_at)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}