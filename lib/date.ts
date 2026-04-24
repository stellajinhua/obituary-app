// ✅ parse safely (handles both YYYY-MM-DD and ISO)
export function parseDate(dateStr: string) {
  if (!dateStr) return null;

  const raw = dateStr.includes("T")
    ? dateStr.split("T")[0]
    : dateStr;

  const [y, m, d] = raw.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ✅ standard display format (EN-GB)
export function formatDate(dateStr: string) {
  const d = parseDate(dateStr);
  if (!d) return "-";

  return d.toLocaleDateString("en-GB"); // 28/04/2026
}

// ✅ with weekday
export function formatDateWithDay(dateStr: string) {
  const d = parseDate(dateStr);
  if (!d) return "-";

  return `${d.toLocaleDateString("en-GB")} (${d.toLocaleDateString(
    "en-GB",
    { weekday: "long" }
  )})`;
}