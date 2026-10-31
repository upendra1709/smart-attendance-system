"use client";

import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  present: "badge-present",
  late: "badge-late",
  absent: "badge-absent",
  leave: "badge-leave",
  on_duty: "badge-on_duty",
  pending: "badge-pending",
  open: "badge-pending",
  closed: "badge-present",
  live: "badge-absent",
  student: "badge-present",
  teacher: "badge-late",
  admin: "badge-leave",
};

export default function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className={cn(STYLES[status] || "badge-pending")}>
      {status.replace(/_/g, "-")}
    </span>
  );
}