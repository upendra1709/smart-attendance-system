"use client";

import { useEffect } from "react";

/** Shown instead of a blank white page when something in a page crashes. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full rounded-3xl border border-border p-8 text-center space-y-4">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-sm text-zinc-500 break-words">{error?.message || "This page could not be displayed."}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white">Try again</button>
          <a href="/login" className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold">Back to login</a>
        </div>
      </div>
    </main>
  );
}
