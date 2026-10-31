"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Camera,
  School,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function TeacherClassesPage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [subjectData, classData, studentData] = await Promise.all([
        api("/classes/subjects"),
        api("/classes"),
        api("/users?role=student"),
      ]);

      setSubjects(subjectData);
      setClasses(classData);
      setStudents(studentData);
    } catch (e: any) {
      setError(e.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardShell
      navGroups={TEACHER_NAV}
      title="My Classes"
      subtitle="Subjects, schedules, rooms, and student counts"
      accent="violet"
    >
      <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title="My Classes"
          subtitle="Start an attendance session from any configured class"
        />

        <ErrorBox message={error} onRetry={load} />

        <InfoBox message="Class and subject creation is admin-only in the current backend. Teachers can start attendance once classes are configured." />

        {loading ? (
          <Loading />
        ) : classes.length === 0 ? (
          <Empty label="No classes have been configured by the administrator yet." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map((classItem) => {
              const subject = subjects.find(
                (subjectItem) => subjectItem.id === classItem.subject_id
              );

              return (
                <div
                  key={classItem.id}
                  className="glass-card rounded-3xl p-6 hover:border-violet-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-violet-400">
                        {subject?.code || `Subject #${classItem.subject_id}`}
                      </p>

                      <h3 className="text-xl font-display font-bold mt-1">
                        {subject?.name || "Assigned Class"}
                      </h3>
                    </div>

                    <StatusBadge status="open" />
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-zinc-400">
                    <p className="flex items-center gap-2">
                      <School size={15} />
                      {classItem.room || "Room not assigned"}
                    </p>

                    <p className="flex items-center gap-2">
                      <BookOpen size={15} />
                      {classItem.schedule || "Schedule not assigned"}
                    </p>

                    <p className="flex items-center gap-2">
                      <Users size={15} />
                      {students.length} student accounts available
                    </p>
                  </div>

                  <button
                    onClick={() => router.push("/teacher/session")}
                    className="mt-6 w-full rounded-xl bg-violet-500 py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
                  >
                    <Camera size={15} />
                    Start / Resume Session
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}