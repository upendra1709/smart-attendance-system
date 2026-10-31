"use client";

import { useEffect, useState } from "react";
import { Check, ScanFace, ShieldCheck, X } from "lucide-react";
import { api } from "@/lib/api";
import { Empty, ErrorBox, Loading } from "@/components/dashboard/DataState";
import { fmtDateTime } from "@/lib/format";

type FaceRequest = {
  id: number;
  student_id: number;
  name: string;
  email: string;
  roll_number: string | null;
  samples: number;
  already_enrolled: boolean;
  created_at: string;
};

/** Teachers see requests from students in their classes; admins see every request. */
export default function FaceApprovalReview({ onChanged }: { onChanged?: () => void }) {
  const [requests, setRequests] = useState<FaceRequest[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setRequests(await api("/face/requests?status=pending"));
      setError("");
    } catch (e: any) {
      setError(e.message || "Could not load face enrollment requests");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function review(id: number, decision: "approve" | "reject") {
    setWorking(id);
    setError("");
    try {
      await api(`/face/requests/${id}/${decision}`, {
        method: "PUT",
        body: JSON.stringify({ review_note: notes[id]?.trim() || null }),
      });
      setRequests((current) => current.filter((item) => item.id !== id));
      onChanged?.();
    } catch (e: any) {
      setError(e.message || `Could not ${decision} this request`);
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-xl flex items-center gap-2">
          <ShieldCheck size={20} className="text-violet-400" /> Face enrollment approvals
        </h3>
        <p className="text-sm text-zinc-500">
          Students enroll their own face from their dashboard. It is only used for camera attendance after you approve it.
        </p>
      </div>
      <ErrorBox message={error} onRetry={load} />
      {loading ? (
        <Loading label="Loading enrollment requests…" />
      ) : requests.length === 0 ? (
        <Empty label="No face enrollments waiting for approval." />
      ) : (
        <div className="glass-card rounded-3xl divide-y divide-border/50">
          {requests.map((request) => (
            <article key={request.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <ScanFace className="text-violet-500" size={20} />
                <div className="flex-1 min-w-[190px]">
                  <p className="font-bold">{request.name}</p>
                  <p className="text-xs text-zinc-500">
                    {request.roll_number || request.email} · {request.samples} sample(s) · {fmtDateTime(request.created_at)}
                  </p>
                </div>
                {request.already_enrolled && (
                  <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 rounded-full px-2.5 py-1">
                    Replaces existing face
                  </span>
                )}
              </div>
              <input
                value={notes[request.id] || ""}
                onChange={(e) => setNotes((current) => ({ ...current, [request.id]: e.target.value }))}
                placeholder="Optional note to the student (shown if you reject)"
                maxLength={300}
                className="w-full rounded-xl bg-background border border-border px-3 py-2.5 text-xs"
              />
              <div className="flex gap-3">
                <button disabled={working !== null} onClick={() => review(request.id, "approve")} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50">
                  <Check size={14} /> Approve
                </button>
                <button disabled={working !== null} onClick={() => review(request.id, "reject")} className="rounded-xl border border-red-500/30 text-red-400 px-4 py-2.5 text-xs font-bold flex items-center gap-2 disabled:opacity-50">
                  <X size={14} /> Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
