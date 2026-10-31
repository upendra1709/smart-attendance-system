const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// Render's free plan can take ~60s to wake up, so allow a generous (but finite) wait.
const REQUEST_TIMEOUT_MS = 60_000;

function errorMessage(detail: unknown, status: number): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors arrive as a list of { loc, msg } objects
    return detail.map((item: any) => item?.msg || "Invalid value").join(", ");
  }
  return `Request failed: ${status}`;
}

export async function api<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  // Camera uploads send FormData: the browser must set the multipart boundary itself.
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;

  // Never wait forever: a sleeping or crashed backend would otherwise leave the page on "Loading…".
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${endpoint}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("The server is taking too long to respond. If it was idle it may still be waking up, so try again in a minute.");
    }
    throw new Error(`Cannot reach the server (${API_URL}). Check that the backend is running and NEXT_PUBLIC_API_URL / CORS_ORIGINS are correct.`);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401 && token && typeof window !== "undefined") {
    // token expired or invalid: clear the session and return to login
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    window.location.href = "/login";
    throw new Error("Your session expired. Please sign in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(errorMessage(err.detail, res.status));
  }

  // 204 No Content (deletes) has no body, so res.json() would throw
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}