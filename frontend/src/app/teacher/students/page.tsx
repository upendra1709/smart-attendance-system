"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Mail,
  Search,
} from "lucide-react";

import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  Empty,
  ErrorBox,
  Loading,
} from "@/components/dashboard/DataState";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import { initials } from "@/lib/format";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await api("/users?role=student");
      setStudents(data);
    } catch (e: any) {
      setError(e.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredStudents = students.filter((student) =>
    `${student.name} ${student.email}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <DashboardShell
      navGroups={TEACHER_NAV}
      title="Students"
      subtitle="All student accounts available to teachers"
      accent="violet"
    >
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader
          title="Students"
          subtitle={`${students.length} registered students`}
        />

        <ErrorBox message={error} onRetry={load} />

        <div className="glass-card rounded-3xl p-4 flex items-center gap-3">
          <Search size={17} className="text-zinc-500" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students by name or email…"
            className="bg-transparent flex-1 outline-none text-sm font-semibold"
          />
        </div>

        {loading ? (
          <Loading />
        ) : filteredStudents.length === 0 ? (
          <Empty />
        ) : (
          <div className="glass-card rounded-3xl divide-y divide-border/50">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-4 p-5"
              >
                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold text-sm">
                  {initials(student.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">
                    {student.name}
                  </p>

                  <p className="text-xs text-zinc-500 flex items-center gap-1 truncate">
                    <Mail size={12} />
                    {student.email}
                  </p>
                </div>

                <span className="flex items-center gap-1 rounded-full bg-white/5 border border-border px-3 py-1 text-xs font-bold text-zinc-400">
                  <GraduationCap size={13} />
                  Student
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}