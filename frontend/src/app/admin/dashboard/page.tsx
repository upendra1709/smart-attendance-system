// 31. src/app/admin/classes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { BookOpen, Clock, MapPin, Plus, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EnrollmentManager from "@/components/dashboard/EnrollmentManager";
import PageHeader from "@/components/dashboard/PageHeader";
import { Empty, ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { get, type ClassRow, type SubjectRow, type UserRow } from "@/lib/admin-data";

const inputCls =
  "w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500/50";

export default function AdminClassesPage() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);

  const [subjectForm, setSubjectForm] = useState({ code: "", name: "", teacher_id: "" });
  const [classForm, setClassForm] = useState({ subject_id: "", schedule: "", room: "" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [s, c, t] = await Promise.all([
        get<SubjectRow[]>("/classes/subjects"),
        get<ClassRow[]>("/classes"),
        get<UserRow[]>("/users?role=teacher"),
      ]);
      setSubjects(s);
      setClasses(c);
      setTeachers(t);
    } catch (e: any) {
      setError(e.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createSubject() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api("/classes/subjects", {
        method: "POST",
        body: JSON.stringify({
          code: subjectForm.code.trim(),
          name: subjectForm.name.trim(),
          teacher_id: Number(subjectForm.teacher_id),
        }),
      });
      setNotice(`Subject ${subjectForm.code} created.`);
      setSubjectForm({ code: "", name: "", teacher_id: "" });
      await load();
    } catch (e: any) {
      setError(e.message || "Could not create the subject");
    } finally {
      setSaving(false);
    }
  }

  async function createClass() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api("/classes", {
        method: "POST",
        body: JSON.stringify({
          subject_id: Number(classForm.subject_id),
          schedule: classForm.schedule.trim() || null,
          room: classForm.room.trim() || null,
        }),
      });
      setNotice("Class created.");
      setClassForm({ subject_id: "", schedule: "", room: "" });
      await load();
    } catch (e: any) {
      setError(e.message || "Could not create the class");
    } finally {
      setSaving(false);
    }
  }

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const teacherById = new Map(teachers.map((t) => [t.id, t]));
  const canSubject = subjectForm.code.trim() && subjectForm.name.trim() && subjectForm.teacher_id;
  const canClass = !!classForm.subject_id;

  return (
    <DashboardShell navGroups={ADMIN_NAV} title="Classes & Subjects" subtitle="Create subjects and schedule classes" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader title="Classes & Subjects" subtitle={`${subjects.length} subjects · ${classes.length} classes`} />
        <ErrorBox message={error} onRetry={load} />
        <InfoBox message={notice} />

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="glass-card rounded-3xl p-6 space-y-4">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" /> New subject
            </h3>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <input className={inputCls} placeholder="CS-301" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
              <input className={inputCls} placeholder="Subject name" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
            </div>
            <select className={inputCls} value={subjectForm.teacher_id} onChange={(e) => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })}>
              <option value="">Assign a teacher…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button onClick={createSubject} disabled={!canSubject || saving} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Create Subject"}
            </button>
          </section>

          <section className="glass-card rounded-3xl p-6 space-y-4">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" /> New class
            </h3>
            <select className={inputCls} value={classForm.subject_id} onChange={(e) => setClassForm({ ...classForm, subject_id: e.target.value })}>
              <option value="">Choose a subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Schedule (Mon 10:00-11:00)" value={classForm.schedule} onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })} />
              <input className={inputCls} placeholder="Room (A-204)" value={classForm.room} onChange={(e) => setClassForm({ ...classForm, room: e.target.value })} />
            </div>
            <button onClick={createClass} disabled={!canClass || saving} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Create Class"}
            </button>
          </section>
        </div>

        {loading ? (
          <Loading label="Loading classes…" />
        ) : classes.length === 0 ? (
          <Empty label="No classes have been created yet." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {classes.map((c) => {
              const subject = subjectById.get(c.subject_id);
              const teacher = subject ? teacherById.get(subject.teacher_id) : undefined;
              return (
                <div key={c.id} className="glass-card rounded-3xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-emerald-500">{subject?.code ?? `Class #${c.id}`}</p>
                    <span className="text-xs text-zinc-500 font-semibold">ID {c.id}</span>
                  </div>
                  <h4 className="font-display font-bold text-xl flex items-center gap-2">
                    <BookOpen size={18} className="text-emerald-500 shrink-0" /> {subject?.name ?? "Unknown subject"}
                  </h4>
                  <div className="space-y-1.5 text-sm text-zinc-500">
                    <p className="flex items-center gap-2"><UserRound size={14} /> {teacher?.name ?? "Unassigned"}</p>
                    {c.schedule && <p className="flex items-center gap-2"><Clock size={14} /> {c.schedule}</p>}
                    {c.room && <p className="flex items-center gap-2"><MapPin size={14} /> Room {c.room}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <EnrollmentManager />
      </div>
    </DashboardShell>
  );
}