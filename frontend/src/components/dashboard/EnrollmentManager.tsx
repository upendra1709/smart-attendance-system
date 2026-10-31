"use client";

import { useEffect, useState } from "react";
import { UserMinus, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Empty, ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";

type ClassRow = { id: number; subject_id: number };
type SubjectRow = { id: number; code: string; name: string };
type StudentRow = { id: number; name: string; email: string; roll_number: string | null; enrolled: boolean };

export default function EnrollmentManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadClasses() {
    setLoading(true);
    try {
      const [classData, subjectData] = await Promise.all([api<ClassRow[]>("/classes"), api<SubjectRow[]>("/classes/subjects")]);
      setClasses(classData); setSubjects(subjectData);
      if (!classId && classData.length) setClassId(String(classData[0].id));
      if (!classData.length) setLoading(false);
    } catch (e: any) { setError(e.message || "Could not load classes"); setLoading(false); }
  }

  async function loadStudents(id: string) {
    if (!id) return;
    setLoading(true);
    try { setStudents(await api(`/classes/${id}/students`)); setError(""); }
    catch (e: any) { setError(e.message || "Could not load enrollments"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { if (classId) loadStudents(classId); }, [classId]);

  async function enroll() {
    if (!studentId) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api(`/classes/${classId}/enrollments`, { method: "POST", body: JSON.stringify({ student_id: Number(studentId) }) });
      setStudentId(""); setNotice("Student enrolled. They now appear in this class roster and face-recognition candidate list.");
      await loadStudents(classId);
    } catch (e: any) { setError(e.message || "Could not enroll student"); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    setSaving(true); setError(""); setNotice("");
    try {
      await api(`/classes/${classId}/enrollments/${id}`, { method: "DELETE" });
      setNotice("Enrollment removed. Historical attendance records are preserved.");
      await loadStudents(classId);
    } catch (e: any) { setError(e.message || "Could not remove enrollment"); }
    finally { setSaving(false); }
  }

  const enrolled = students.filter((student) => student.enrolled);
  const available = students.filter((student) => !student.enrolled);
  const label = (id: number) => {
    const classItem = classes.find((item) => item.id === id);
    const subject = subjects.find((item) => item.id === classItem?.subject_id);
    return subject ? `${subject.code} · ${subject.name}` : `Class #${id}`;
  };

  return (
    <section className="glass-card rounded-3xl p-6 space-y-5">
      <div><h3 className="font-display font-bold text-xl flex items-center gap-2"><Users size={20} className="text-emerald-500" /> Class enrollments</h3><p className="text-sm text-zinc-500 mt-1">Enrollments control session rosters and which students face recognition can mark.</p></div>
      <ErrorBox message={error} /><InfoBox message={notice} />
      <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-bold">
        {classes.map((item) => <option key={item.id} value={item.id}>{label(item.id)}</option>)}
      </select>
      {loading ? <Loading label="Loading enrollments…" /> : !classes.length ? <Empty label="Create a class before adding enrollments." /> : (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="flex-1 rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-semibold">
              <option value="">Select a student to enroll…</option>
              {available.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.email}</option>)}
            </select>
            <button disabled={!studentId || saving} onClick={enroll} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"><UserPlus size={15} /> Enroll</button>
          </div>
          {enrolled.length === 0 ? <Empty label="No students enrolled in this class." /> : (
            <div className="divide-y divide-border/50 border border-border/50 rounded-2xl">
              {enrolled.map((student) => (
                <div key={student.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0"><p className="font-bold truncate">{student.name}</p><p className="text-xs text-zinc-500 truncate">{student.roll_number || student.email}</p></div>
                  <button disabled={saving} onClick={() => remove(student.id)} className="rounded-xl border border-red-500/30 text-red-400 px-3 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-50"><UserMinus size={14} /> Remove</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
