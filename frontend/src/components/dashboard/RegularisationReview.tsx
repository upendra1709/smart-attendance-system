"use client";

import { useEffect, useState } from "react";
import { Check, UserRound, X } from "lucide-react";
import { api } from "@/lib/api";
import { Empty, ErrorBox, Loading } from "@/components/dashboard/DataState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { fmtDateTime } from "@/lib/format";

type RequestRow = {
  id: number; student_name: string; student_email: string; session_id: number;
  original_status: string; requested_status: string; reason: string; created_at: string;
};

export default function RegularisationReview() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setRequests(await api("/regularisation-requests?status=pending"));
      setError("");
    } catch (e: any) { setError(e.message || "Could not load requests"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function review(id: number, decision: "approve" | "reject") {
    setWorking(id);
    setError("");
    try {
      await api(`/regularisation-requests/${id}/${decision}`, { method: "PUT", body: JSON.stringify({ review_note: null }) });
      setRequests((current) => current.filter((request) => request.id !== id));
    } catch (e: any) { setError(e.message || `Could not ${decision} request`); }
    finally { setWorking(null); }
  }

  return (
    <section className="space-y-4">
      <div><h3 className="font-display font-bold text-xl">Regularisation approvals</h3><p className="text-sm text-zinc-500">Approving a request updates the attendance record immediately.</p></div>
      <ErrorBox message={error} onRetry={load} />
      {loading ? <Loading label="Loading student requests…" /> : requests.length === 0 ? <Empty label="No pending regularisation requests." /> : (
        <div className="glass-card rounded-3xl divide-y divide-border/50">
          {requests.map((request) => (
            <article key={request.id} className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <UserRound className="text-violet-500" size={20} />
                <div className="flex-1 min-w-[190px]"><p className="font-bold">{request.student_name}</p><p className="text-xs text-zinc-500">Session #{request.session_id} · {fmtDateTime(request.created_at)}</p></div>
                <StatusBadge status={request.original_status} /><span>→</span><StatusBadge status={request.requested_status} />
              </div>
              <p className="text-sm text-zinc-400">{request.reason}</p>
              <div className="flex gap-3">
                <button disabled={working !== null} onClick={() => review(request.id, "approve")} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50"><Check size={14} /> Approve</button>
                <button disabled={working !== null} onClick={() => review(request.id, "reject")} className="rounded-xl border border-red-500/30 text-red-400 px-4 py-2.5 text-xs font-bold flex items-center gap-2 disabled:opacity-50"><X size={14} /> Reject</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
