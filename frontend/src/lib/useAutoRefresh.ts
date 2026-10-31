"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `refresh` every `intervalMs` while the tab is visible, and again whenever the tab regains focus.
 * Used so a student sees an attendance mark appear without reloading the page.
 */
export function useAutoRefresh(refresh: () => void | Promise<void>, intervalMs = 5000) {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  });

  useEffect(() => {
    const run = () => {
      if (!document.hidden) void latest.current();
    };
    const timer = setInterval(run, intervalMs);
    document.addEventListener("visibilitychange", run);
    window.addEventListener("focus", run);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("focus", run);
    };
  }, [intervalMs]);
}
