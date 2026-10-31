"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Empty, ErrorBox, Loading } from "@/components/dashboard/DataState";
import { fmtDateTime } from "@/lib/format";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

export default function NotificationCenter({ accent = "emerald" }: { accent?: "emerald" | "violet" }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const accentText = accent === "violet" ? "text-violet-500" : "text-emerald-500";
  const accentBg = accent === "violet" ? "bg-violet-500" : "bg-emerald-500";

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await api<NotificationItem[]>("/notifications"));
    } catch (e: any) {
      setError(e.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: number) {
    try {
      const updated = await api<NotificationItem>(`/notifications/${id}/read`, { method: "POST" });
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...updated } : item));
    } catch (e: any) {
      setError(e.message || "Could not update notification");
    }
  }

  async function markAll() {
    try {
      await api("/notifications/read-all", { method: "POST" });
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch (e: any) {
      setError(e.message || "Could not update notifications");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button onClick={load} disabled={loading} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-foreground/5 disabled:opacity-50">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <button onClick={markAll} disabled={!items.some((item) => !item.read)} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white flex items-center gap-2 disabled:opacity-40 ${accentBg}`}>
          <CheckCheck size={15} /> Mark all read
        </button>
      </div>
      <ErrorBox message={error} onRetry={load} />
      {loading ? <Loading label="Loading notifications…" /> : items.length === 0 ? (
        <Empty label="No notifications yet. Attendance and request updates will appear here." />
      ) : (
        <div className="glass-card rounded-3xl divide-y divide-border/50">
          {items.map((item) => {
            const Icon = item.type === "warning" ? AlertTriangle : item.type === "attendance" || item.type === "face" ? CheckCircle2 : item.type === "regularisation" ? Info : Bell;
            return (
              <button
                key={item.id}
                onClick={() => !item.read && markRead(item.id)}
                disabled={item.read}
                className="w-full text-left p-5 flex items-start gap-4 hover:bg-foreground/5 disabled:cursor-default"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.read ? "bg-foreground/5 text-zinc-500" : `bg-emerald-500/10 ${accentText}`}`}>
                  <Icon size={19} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${item.read ? "text-zinc-500" : ""}`}>{item.title}</p>
                    {!item.read && <span className={`w-2 h-2 rounded-full ${accentBg}`} />}
                  </div>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{item.message}</p>
                  <p className="text-xs text-zinc-600 mt-2">{fmtDateTime(item.created_at)}{item.read ? " · Read" : " · Click to mark read"}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
