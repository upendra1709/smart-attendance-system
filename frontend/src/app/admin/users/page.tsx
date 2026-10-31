// 30. src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { Empty, ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { initials } from "@/lib/format";
import { get, type UserRow } from "@/lib/admin-data";

const ROLE_TABS = ["all", "student", "teacher", "admin"] as const;
const ROLE_STYLE: Record<string, string> = {
  student: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  teacher: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  admin: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};
const inputCls =
  "w-full rounded-xl bg-background border border-border px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500/50";
const emptyForm = { name: "", email: "", password: "", role: "student" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleTab, setRoleTab] = useState<(typeof ROLE_TABS)[number]>("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [meId, setMeId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setUsers(await get<UserRow[]>("/users"));
    } catch (e: any) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMeId(getUser()?.id ?? null);
    load();
  }, []);

  async function createUser() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setNotice(`${form.name} was added as ${form.role}.`);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Could not create the user");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(user: UserRow) {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await api(`/users/${user.id}`, { method: "DELETE" });
    } catch (e: any) {
      // DELETE returns 204 with no body; some fetch wrappers throw while parsing it,
      // so re-check the list before showing an error.
      const fresh = await get<UserRow[]>("/users").catch(() => null);
      if (fresh && fresh.some((u) => u.id === user.id)) {
        setError(e.message || "Could not delete the user");
        return;
      }
    }
    setNotice(`${user.name} was deleted.`);
    await load();
  }

  const rows = users.filter(
    (u) =>
      (roleTab === "all" || u.role === roleTab) &&
      `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  );
  const canSave = form.name.trim() && form.email.trim() && form.password.length >= 6;

  return (
    <DashboardShell navGroups={ADMIN_NAV} title="Users" subtitle="Manage students, teachers and admins" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
        <PageHeader title="Users" subtitle={`${users.length} accounts in the system`} />
        <ErrorBox message={error} onRetry={load} />
        <InfoBox message={notice} />

        <div className="glass-card rounded-3xl p-4 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" className={`${inputCls} pl-9`} />
          </div>
          <div className="flex rounded-xl bg-foreground/5 p-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setRoleTab(tab)}
                className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${
                  roleTab === tab ? "bg-emerald-500 text-white shadow" : "text-zinc-500 hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Add User"}
          </button>
        </div>

        {showForm && (
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h3 className="font-display font-bold">New account</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={inputCls} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className={inputCls} placeholder="Password (min 6 characters)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              onClick={createUser}
              disabled={!canSave || saving}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        )}

        {loading ? (
          <Loading label="Loading users…" />
        ) : rows.length === 0 ? (
          <Empty label="No users match your filters." />
        ) : (
          <div className="glass-card rounded-3xl divide-y divide-border/50">
            {rows.map((u) => (
              <div key={u.id} className="p-5 flex flex-wrap items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold shrink-0">
                  {initials(u.name)}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-bold">{u.name}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ROLE_STYLE[u.role] ?? ""}`}>
                  {u.role}
                </span>
                <button
                  onClick={() => removeUser(u)}
                  disabled={u.id === meId}
                  title={u.id === meId ? "You can't delete your own account" : "Delete user"}
                  className="rounded-xl p-2.5 text-red-500 border border-border hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}