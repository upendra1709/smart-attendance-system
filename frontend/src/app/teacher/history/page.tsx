"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  History,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  Empty,
  ErrorBox,
  Loading,
} from "@/components/dashboard/DataState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import {
  fmtDate,
  fmtTime,
} from "@/lib/format";

export default function TeacherHistoryPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await api("/sessions");

      const sortedSessions = [...data].sort(
        (a, b) =>
          new Date(b.starts_at).getTime() -
          new Date(a.starts_at).getTime()
      );

      setSessions(sortedSessions);
    } catch (e: any) {
      setError(e.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const closedSessions = sessions.filter(
    (session) => session.status === "closed"
  );

  return (
    <DashboardShell
      navGroups={TEACHER_NAV}
      title="Attendance History"
      subtitle="Review every completed attendance session"
      accent="violet"
    >
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader
          title="Attendance History"
          subtitle={`${closedSessions.length} completed sessions`}
        />

        <ErrorBox message={error} onRetry={load} />

        {loading ? (
          <Loading />
        ) : closedSessions.length === 0 ? (
          <Empty label="No completed sessions yet." />
        ) : (
          <div className="glass-card rounded-3xl divide-y divide-border/50">
            {closedSessions.map((session) => (
              <button
                key={session.id}
                onClick={() =>
                  router.push(`/teacher/session/${session.id}`)
                }
                className="w-full flex items-center gap-4 p-5 hover:bg-white/5 text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <History size={19} />
                </div>

                <div className="flex-1">
                  <p className="font-bold">
                    Session #{session.id}
                  </p>

                  <p className="text-xs text-zinc-500">
                    Class #{session.class_id}
                  </p>
                </div>

                <div className="text-right text-xs text-zinc-500">
                  <p className="font-bold text-foreground flex items-center gap-2 justify-end">
                    <CalendarDays size={13} />
                    {fmtDate(session.starts_at)}
                  </p>

                  <p>
                    {fmtTime(session.starts_at)} –{" "}
                    {fmtTime(session.ends_at)}
                  </p>
                </div>

                <StatusBadge status={session.status} />

                <ChevronRight
                  size={17}
                  className="text-zinc-600"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}