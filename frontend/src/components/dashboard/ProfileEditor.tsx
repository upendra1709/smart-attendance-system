"use client";

import { FormEvent, useEffect, useState } from "react";
import { Mail, Save, ScanFace, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { getUser, type User } from "@/lib/auth";
import { ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";
import { initials } from "@/lib/format";

const inputCls = "w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500";

export default function ProfileEditor({ accent = "emerald" }: { accent?: "emerald" | "violet" }) {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<any>({});
  const [face, setFace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const buttonClass = accent === "violet" ? "bg-violet-500 hover:bg-violet-600" : "bg-emerald-500 hover:bg-emerald-600";

  useEffect(() => {
    const current = getUser();
    setUser(current);
    setForm({
      name: current?.name || "", roll_number: current?.roll_number || "",
      department: current?.department || "", course: current?.course || "",
      semester: current?.semester || "", phone: current?.phone || "",
      institution: current?.institution || "", section: current?.section || "",
    });
    if (current?.role === "student") {
      api(`/face/status/${current.id}`).then(setFace).catch(() => null);
    }
    setLoading(false);
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await api<User>("/users/me", { method: "PATCH", body: JSON.stringify(form) });
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setNotice("Profile saved to the database.");
    } catch (e: any) {
      setError(e.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Loading profile…" />;
  const fields = [
    ["roll_number", "Roll number"], ["department", "Department"], ["course", "Course"],
    ["semester", "Semester"], ["phone", "Phone"], ["institution", "Institution"], ["section", "Section"],
  ];

  return (
    <form onSubmit={save} className="space-y-6">
      <ErrorBox message={error} />
      <InfoBox message={notice} />
      <section className="glass-card rounded-3xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center text-3xl font-display font-bold">
            {initials(user?.name || "User")}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-display font-bold">{user?.name}</h3>
            <p className="text-zinc-500 capitalize">{user?.role} account</p>
            <div className="mt-3 space-y-1 text-sm text-zinc-400">
              <p className="flex items-center justify-center md:justify-start gap-2"><Mail size={14} /> {user?.email}</p>
              <p className="flex items-center justify-center md:justify-start gap-2"><ShieldCheck size={14} /> Account #{user?.id}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="glass-card rounded-3xl p-6 space-y-5">
        <h3 className="font-display font-bold">Editable profile</h3>
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-zinc-500">Full name</span>
          <input required minLength={2} className={inputCls} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          {fields.map(([key, label]) => (
            <label key={key} className="block space-y-2">
              <span className="text-xs font-bold uppercase text-zinc-500">{label}</span>
              <input className={inputCls} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value || null })} />
            </label>
          ))}
        </div>
        <button disabled={saving} className={`rounded-xl px-5 py-3 text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 ${buttonClass}`}>
          <Save size={15} /> {saving ? "Saving…" : "Save Profile"}
        </button>
      </section>
      {user?.role === "student" && (
        <section className="glass-card rounded-3xl p-6 flex items-start gap-4">
          <ScanFace className="text-emerald-500 shrink-0" size={22} />
          <div>
            <h3 className="font-display font-bold">Face recognition</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {face?.enrolled ? `Face enrolled with ${face.samples} sample(s). Only a numerical embedding is stored.` : "Your face is not enrolled yet. Ask a teacher or admin to enroll it from the Face Recognition page."}
            </p>
          </div>
        </section>
      )}
    </form>
  );
}
