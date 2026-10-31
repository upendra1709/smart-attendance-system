"use client";

import { useEffect, useState } from "react";
import {
  Download,
  FileText,
} from "lucide-react";

import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  Empty,
  ErrorBox,
  InfoBox,
  Loading,
} from "@/components/dashboard/DataState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import { fmtDate } from "@/lib/format";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TeacherReportsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [downloadingId, setDownloadingId] = useState<
    number | null
  >(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await api("/sessions");

      const closedSessions = data.filter(
        (session: any) => session.status === "closed"
      );

      setSessions(closedSessions);
    } catch (e: any) {
      setError(e.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function downloadReport(sessionId: number) {
    setDownloadingId(sessionId);
    setNotice("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/reports/session/${sessionId}/csv`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("CSV download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `session-${sessionId}.csv`;
      anchor.click();

      URL.revokeObjectURL(url);
    } catch {
      setNotice(
        "CSV download is unavailable. Check the backend reports endpoint."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <DashboardShell
      navGroups={TEACHER_NAV}
      title="Reports & Analytics"
      subtitle="Export completed attendance sessions"
      accent="violet"
    >
      <div className="p-4 lg:p-8 max-w-[1000px] mx-auto space-y-6">
        <PageHeader
          title="Reports"
          subtitle="Session-wise CSV downloads"
        />

        <ErrorBox message={error} onRetry={load} />
        <InfoBox message={notice} />

        {loading ? (
          <Loading />
        ) : sessions.length === 0 ? (
          <Empty label="Close a session to make its report available." />
        ) : (
          <div className="glass-card rounded-3xl divide-y divide-border/50">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-5 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <FileText size={19} />
                </div>

                <div className="flex-1">
                  <p className="font-bold">
                    Session #{session.id}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {fmtDate(session.starts_at)} · Class #
                    {session.class_id}
                  </p>
                </div>

                <StatusBadge status={session.status} />

                <button
                  onClick={() => downloadReport(session.id)}
                  disabled={downloadingId !== null}
                  className="rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={14} />
                  {downloadingId === session.id
                    ? "Downloading…"
                    : "CSV"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}