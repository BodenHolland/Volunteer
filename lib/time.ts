export function relativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export function formatHours(h: number): string {
  const r = Math.round(h * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}

/** Unix ms → "Jun 22, 2026" */
export function formatDate(ts: number): string {
  const d = new Date(ts);
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "2026-06" → "June 2026" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${names[(m ?? 1) - 1]} ${y}`;
}

export function currentMonth(now: number = Date.now()): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatDob(dob: string | null): string {
  if (!dob) return "";
  const [y, m, d] = dob.split("-").map(Number);
  if (!y) return dob;
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${names[(m ?? 1) - 1]} ${d}, ${y}`;
}
