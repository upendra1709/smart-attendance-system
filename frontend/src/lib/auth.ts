const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  roll_number?: string | null;
  department?: string | null;
  course?: string | null;
  semester?: string | null;
  phone?: string | null;
  institution?: string | null;
  section?: string | null;
}

export async function login(email: string, password: string): Promise<User> {
  const form = new URLSearchParams();

  form.append("username", email);
  form.append("password", password);

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    throw new Error("Invalid email or password");
  }

  const { access_token } = await res.json();

  localStorage.setItem("token", access_token);

  const meRes = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (!meRes.ok) {
    throw new Error("Login succeeded, but the profile could not be loaded.");
  }

  const user: User = await meRes.json();

  localStorage.setItem("user", JSON.stringify(user));

  document.cookie =
    `token=${access_token}; path=/; max-age=604800; samesite=lax`;

  return user;
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("user");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  document.cookie = "token=; path=/; max-age=0";

  window.location.href = "/login";
}

export function roleHome(role: string): string {
  if (role === "teacher") return "/teacher/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}