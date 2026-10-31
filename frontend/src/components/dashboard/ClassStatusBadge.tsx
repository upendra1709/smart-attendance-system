import { CheckCircle2, Clock, Radio, XCircle } from "lucide-react";

export type LatestSession = {
  session_id: number;
  session_status: "open" | "closed";
  starts_at: string;
  attendance_status: "present" | "late" | "absent" | "pending";
  method: string | null;
  marked_at: string | null;
};

/** One line that tells a student what happened in the most recent session of a class. */
export default function ClassStatusBadge({ session }: { session: LatestSession | null }) {
  if (!session) {
    return <span className="text-xs font-semibold text-zinc-500">No session held yet</span>;
  }
  const live = session.session_status === "open";
  const status = session.attendance_status;

  const look =
    status === "present"
      ? { text: "Present", cls: "bg-emerald-500/10 text-emerald-500", icon: <CheckCircle2 size={13} /> }
      : status === "late"
        ? { text: "Late", cls: "bg-amber-500/10 text-amber-500", icon: <Clock size={13} /> }
        : status === "absent"
          ? { text: "Absent", cls: "bg-red-500/10 text-red-400", icon: <XCircle size={13} /> }
          : { text: "Not marked yet", cls: "bg-zinc-500/10 text-zinc-400", icon: <Clock size={13} /> };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {live && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 text-red-400 px-2.5 py-1 text-[11px] font-bold">
          <Radio size={12} className="animate-pulse" /> LIVE NOW
        </span>
      )}
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${look.cls}`}>
        {look.icon} {look.text}
      </span>
    </span>
  );
}
