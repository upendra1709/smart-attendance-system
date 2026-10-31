export function fmtDateTime(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function fmtTime(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function initials(name = "User") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}