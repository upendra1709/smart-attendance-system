"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  History,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import ClassStatusBadge, { LatestSession } from "@/components/dashboard/ClassStatusBadge";
import { getUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import {
  Empty,
  ErrorBox,
  InfoBox,
  Loading,
} from "@/components/dashboard/DataState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import StudentFaceEnrollment from "@/components/dashboard/StudentFaceEnrollment";
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

type MyClass = {
  class_id: number;
  subject_code: string;
  subject_name: string;
  latest_session: LatestSession | null;
};

export default function StudentDashboardPage() {
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [studentName, setStudentName] = useState("Student");
  const [studentId, setStudentId] = useState<number | null>(null);
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

      setStudentName(user.name);
      setStudentId(user.id);

      const data = await api(`/attendance/student/${user.id}`);
      setSummary(data);
      if (silent) setError("");
      // class list is a nice-to-have: never let it break the rest of the dashboard
      try {
        setClasses(await api<MyClass[]>("/students/me/classes"));
      } catch {
        /* keep the previous list */
      }
    } catch (e: any) {
      if (!silent) setError(e.message || "Failed to load your attendance summary");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);
  useAutoRefresh(() => load(true), 5000); // marks appear within seconds, without reloading

  const recentRecords = [...(summary?.records || [])]
    .sort(
      (a, b) =>
        new Date(b.marked_at).getTime() -
        new Date(a.marked_at).getTime()
    )
    .slice(0, 6);

  return (
    <DashboardShell
      navGroups={STUDENT_NAV}
      title="Student Dashboard"
      subtitle="Your attendance overview and recent activity"
      accent="emerald"
    >
      <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title={`Welcome, ${studentName.split(" ")[0]}`}
          subtitle="Track your attendance and review recently marked sessions"
        />

        <ErrorBox message={error} onRetry={() => load()} />

        {studentId !== null && <StudentFaceEnrollment studentId={studentId} />}

        {loading ? (
          <Loading label="Loading your attendance summary…" />
        ) : !summary ? (
          <Empty label="Your attendance summary is not available." />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Attendance"
                value={`${summary.percentage}%`}
                sub={
                  summary.is_defaulter
                    ? "Below the 75% threshold"
                    : "Attendance threshold"
                }
                icon={TrendingUp}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
                index={0}
              />

              <StatCard
                label="Attended"
                value={summary.attended}
                sub="Present and late sessions"
                icon={CheckCircle2}
                color="text-sky-500"
                bg="bg-sky-500/10"
                index={1}
              />

              <StatCard
                label="Marked Sessions"
                value={summary.total_sessions}
                sub="Records returned by the backend"
                icon={CalendarCheck2}
                color="text-violet-500"
                bg="bg-violet-500/10"
                index={2}
              />

              <StatCard
                label="Current Status"
                value={
                  summary.total_sessions === 0
                    ? "No Data"
                    : summary.is_defaulter
                      ? "Defaulter"
                      : "On Track"
                }
                sub="Based on your current percentage"
                icon={ClipboardCheck}
                color={
                  summary.is_defaulter
                    ? "text-amber-500"
                    : "text-emerald-500"
                }
                bg={
                  summary.is_defaulter
                    ? "bg-amber-500/10"
                    : "bg-emerald-500/10"
                }
                index={3}
              />
            </div>

            {summary.is_defaulter && (
              <InfoBox message="Your attendance is currently below 75%. Review your attendance history and contact your teacher if any record needs correction." />
            )}

            {summary.total_sessions === 0 && (
              <InfoBox message="No attendance has been marked for your account yet. Your summary will update after a teacher records attendance." />
            )}

            {classes.length > 0 && (
              <section className="glass-card rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-border/50">
                  <h3 className="font-display font-bold">Your classes right now</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Updates by itself: when your teacher marks you, it shows here within a few seconds
                  </p>
                </div>
                <div className="divide-y divide-border/50">
                  {classes.map((item) => (
                    <div key={item.class_id} className="p-4 px-5 flex flex-wrap items-center gap-3 justify-between">
                      <div className="min-w-[200px]">
                        <p className="text-xs font-bold text-emerald-500">{item.subject_code}</p>
                        <p className="font-bold">{item.subject_name}</p>
                      </div>
                      <ClassStatusBadge session={item.latest_session} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid xl:grid-cols-[1fr_320px] gap-6">
              <section className="glass-card rounded-3xl overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-5 border-b border-border/50">
                  <div>
                    <h3 className="font-display font-bold">
                      Recent Attendance
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Your latest attendance records
                    </p>
                  </div>

                  <Link
                    href="/student/history"
                    className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1"
                  >
                    View all
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {recentRecords.length === 0 ? (
                  <div className="p-6">
                    <Empty label="No attendance records yet." />
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {recentRecords.map((record) => (
                      <div
                        key={`${record.session_id}-${record.marked_at}`}
                        className="p-5 flex flex-wrap items-center gap-4"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <CalendarCheck2 size={19} />
                        </div>

                        <div className="flex-1 min-w-[160px]">
                          <p className="font-bold">
                            {record.subject_name
                              ? `${record.subject_code} · ${record.subject_name}`
                              : `Session #${record.session_id}`}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {fmtDateTime(record.marked_at)}
                          </p>
                        </div>

                        <span className="text-xs font-semibold text-zinc-500 capitalize">
                          {record.method}
                        </span>

                        <StatusBadge status={record.status} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <aside className="space-y-4">
                <div className="glass-card rounded-3xl p-6">
                  <h3 className="font-display font-bold">
                    Quick Actions
                  </h3>

                  <div className="mt-5 space-y-3">
                    <Link
                      href="/student/history"
                      className="rounded-2xl border border-border p-4 flex items-center gap-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
                    >
                      <History
                        size={19}
                        className="text-emerald-500"
                      />
                      <span className="flex-1">
                        <span className="font-bold block text-sm">
                          Attendance History
                        </span>
                        <span className="text-xs text-zinc-500">
                          Filter every marked session
                        </span>
                      </span>
                      <ArrowRight
                        size={15}
                        className="text-zinc-500"
                      />
                    </Link>

                    <Link
                      href="/student/requests"
                      className="rounded-2xl border border-border p-4 flex items-center gap-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
                    >
                      <FileCheck2
                        size={19}
                        className="text-emerald-500"
                      />
                      <span className="flex-1">
                        <span className="font-bold block text-sm">
                          Regularisation Draft
                        </span>
                        <span className="text-xs text-zinc-500">
                          Prepare a correction request
                        </span>
                      </span>
                      <ArrowRight
                        size={15}
                        className="text-zinc-500"
                      />
                    </Link>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6 flex items-start gap-3">
                  <AlertTriangle
                    size={19}
                    className="text-amber-500 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Attendance below 75% is marked as defaulter status
                    by your current backend.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}