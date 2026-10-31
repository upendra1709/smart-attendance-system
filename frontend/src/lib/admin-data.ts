// src/lib/admin-data.ts
import { api } from "@/lib/api";

export type UserRow = { id: number; name: string; email: string; role: string };
export type SubjectRow = { id: number; code: string; name: string; teacher_id: number };
export type ClassRow = { id: number; subject_id: number; schedule: string | null; room: string | null };
export type SessionRow = { id: number; class_id: number; starts_at: string; ends_at: string | null; status: string };
export type AttendanceRow = {
  session_id: number;
  student_id: number;
  status: "present" | "late" | "absent";
  method: string;
  marked_at: string;
};

export function get<T>(path: string) {
  return api(path) as Promise<T>;
}

/** All sessions (newest first) plus a helper that turns class_id into "CS-301 · Machine Learning". */
export async function loadSessionsWithLabels() {
  const [sessions, classes, subjects] = await Promise.all([
    get<SessionRow[]>("/sessions"),
    get<ClassRow[]>("/classes"),
    get<SubjectRow[]>("/classes/subjects"),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const classLabel = new Map<number, string>();
  for (const c of classes) {
    const s = subjectById.get(c.subject_id);
    classLabel.set(c.id, s ? `${s.code} · ${s.name}` : `Class #${c.id}`);
  }
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );
  return {
    sessions: sorted,
    label: (classId: number) => classLabel.get(classId) ?? `Class #${classId}`,
  };
}