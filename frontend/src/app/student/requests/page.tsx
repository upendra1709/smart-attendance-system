"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileCheck2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import { Empty, ErrorBox, InfoBox, Loading } from "@/components/dashboard/DataState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { STUDENT_NAV } from "@/lib/student-nav";
import { fmtDateTime } from "@/lib/format";

type AttendanceRecord = { session_id: number; status: string; method: string; marked_at: string };
type Summary = { records: AttendanceRecord[] };
type RequestRow = {
  id: number; session_id: number; original_status: string;
  requested_status: "present" | "late"; reason: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null; created_at: string;
};

export default function StudentRequestsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [requestedStatus, setRequestedStatus] = useState<"present" | "late">("present");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const user = getUser();
      if (!user) throw new Error("Your login session has expired.");
      const [attendance, requestData] = await Promise.all([
        api<Summary>(`/attendance/student/${user.id}`),
        api<RequestRow[]>("/regularisation-requests"),
      ]);
      setSummary(attendance);
      setRequests(requestData);
      setSelectedSessionId((current) => current || String(attendance.records[0]?.session_id || ""));
    } catch (e: any) {
      setError(e.message || "Failed to load regularisation data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await api("/regularisation-requests", {
        method: "POST",
        body: JSON.stringify({
          session_id: Number(selectedSessionId),
          requested_status: requestedStatus,
          reason: reason.trim(),
        }),
      });
      setReason("");
      setNotice("Request submitted to your teacher and saved in the database.");
      await load();
    } catch (e: any) {
      setError(e.message || "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell navGroups={STUDENT_NAV} title="Regularisation" subtitle="Submit and track attendance corrections" accent="emerald">
      <div className="p-4 lg:p-8 max-w-[1100px] mx-auto space-y-6">
        <PageHeader title="Regularisation Requests" subtitle="Requests are sent to the teacher assigned to the class" />
        <ErrorBox message={error} onRetry={load} />
        <InfoBox message={notice} />
        {loading ? <Loading label="Loading requests…" /> : (
          <>
            {!summary?.records.length ? <Empty label="You need an attendance record before requesting a correction." /> : (
              <form onSubmit={submit} className="glass-card rounded-3xl p-6 space-y-5">
                <h3 className="font-display font-bold flex items-center gap-2"><FileCheck2 size={20} className="text-emerald-500" /> New correction request</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Attendance session</span>
                    <select required value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3 py-3 text-sm font-semibold">
                      {summary.records.map((record) => <option key={record.session_id} value={record.session_id}>Session #{record.session_id} — currently {record.status}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Requested status</span>
                    <select value={requestedStatus} onChange={(e) => setRequestedStatus(e.target.value as "present" | "late")} className="w-full rounded-xl bg-background border border-border px-3 py-3 text-sm font-semibold">
                      <option value="present">Present</option><option value="late">Late</option>
                    </select>
                  </label>
                </div>
                <label className="block space-y-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Reason</span>
                  <textarea required minLength={10} maxLength={2000} rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this attendance record needs correction…" className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm font-semibold resize-y" />
                </label>
                <button disabled={submitting || !selectedSessionId} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white flex items-center gap-2 hover:bg-emerald-600 disabled:opacity-50">
                  <Send size={15} /> {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </form>
            )}
            <section className="space-y-4">
              <h3 className="font-display font-bold text-xl">Request history</h3>
              {requests.length === 0 ? <Empty label="No regularisation requests submitted yet." /> : (
                <div className="glass-card rounded-3xl divide-y divide-border/50">
                  {requests.map((request) => (
                    <article key={request.id} className="p-5 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[180px]">
                          <p className="font-bold">Session #{request.session_id}</p>
                          <p className="text-xs text-zinc-500 mt-1">Submitted {fmtDateTime(request.created_at)}</p>
                        </div>
                        <StatusBadge status={request.original_status} /><span>→</span><StatusBadge status={request.requested_status} />
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${request.status === "approved" ? "bg-emerald-500/10 text-emerald-500" : request.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>{request.status}</span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">{request.reason}</p>
                      {request.review_note && <p className="text-sm rounded-xl border border-border p-3"><strong>Teacher note:</strong> {request.review_note}</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
