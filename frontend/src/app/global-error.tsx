"use client";

/** Last-resort screen if the root layout itself fails (otherwise the browser shows a blank page). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#0b0d10", color: "#e4e4e7", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>SmartAttend could not load</h1>
          <p style={{ fontSize: 14, color: "#a1a1aa", wordBreak: "break-word" }}>{error?.message || "Unexpected error."}</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 12, border: 0, background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
