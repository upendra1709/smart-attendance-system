"use client";

import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loading({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-12 flex items-center justify-center gap-3 text-zinc-500">
      <Loader2 className="animate-spin" size={20} />
      {label}
    </div>
  );
}

export function Empty({
  label = "No records found.",
}: {
  label?: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center gap-3 text-zinc-500 text-sm">
      <Inbox size={28} />
      {label}
    </div>
  );
}

export function ErrorBox({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 flex items-center justify-between gap-4",
        className
      )}
    >
      <span className="flex items-center gap-2">
        <AlertTriangle size={16} />
        {message}
      </span>

      {onRetry && (
        <button
          onClick={onRetry}
          className="font-bold hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function InfoBox({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-500",
        className
      )}
    >
      {message}
    </div>
  );
}