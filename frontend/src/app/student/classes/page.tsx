"use client";

import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, MapPin, TrendingUp, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import ClassStatusBadge, { LatestSession } from "@/components/dashboard/ClassStatusBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { Empty, ErrorBox, Loading } from "@/components/dashboard/DataState";
import { STUDENT_NAV } from "@/lib/student-nav";

type StudentClass = {
  class_id: number;
  subject_code: string;
  subject_name: string;
  teacher_name: string;
  schedule: string | null;
  room: string | null;
  attendance_percentage: number;
  latest_session: LatestSession | null;
};

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(silent = false) {
    if (!silent) { setLoading(true); setError(""); }
    try {
      setClasses(await api<StudentClass[]>("/students/me/classes"));
      if (silent) setError("");
    } catch (e: any) {
      if (!silent) setError(e.message || "Failed to load enrolled classes");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useAutoRefresh(() => load(true), 5000); // a new mark appears within a few seconds, no reload needed

  return (
    <DashboardShell navGroups={STUDENT_NAV} title="My Classes" subtitle="Your real enrollments and subject attendance" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader title="My Classes" subtitle={`${classes.length} enrolled class${classes.length === 1 ? "" : "es"}`} />
        <ErrorBox message={error} onRetry={() => load()} />
        {loading ? <Loading label="Loading your enrollments…" /> : classes.length === 0 ? (
          <Empty label="You are not enrolled in any classes yet. Contact your administrator." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {classes.map((item) => (
              <article key={item.class_id} className="glass-card rounded-3xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-emerald-500">{item.subject_code}</p>
                    <h3 className="text-xl font-display font-bold mt-1">{item.subject_name}</h3>
                  </div>
                  <BookOpen className="text-emerald-500" size={20} />
                </div>
                <div className="space-y-2 text-sm text-zinc-400">
                  <p className="flex items-center gap-2"><UserRound size={15} /> {item.teacher_name}</p>
                  <p className="flex items-center gap-2"><CalendarDays size={15} /> {item.schedule || "Schedule not assigned"}</p>
                  <p className="flex items-center gap-2"><MapPin size={15} /> {item.room || "Room not assigned"}</p>
                </div>
                <div className="rounded-2xl border border-border p-4 space-y-2">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase">Latest session</p>
                  <ClassStatusBadge session={item.latest_session} />
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><TrendingUp size={14} /> Attendance</span>
                    <span className={`font-display font-bold text-xl ${item.attendance_percentage < 75 ? "text-amber-500" : "text-emerald-500"}`}>{item.attendance_percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-foreground/10 mt-3 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(item.attendance_percentage, 100)}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
