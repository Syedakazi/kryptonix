/**
 * Motoko `Time.now()` values are nanosecond bigints. Convert through this helper
 * before any JavaScript Date operation.
 */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Relative "just now / 3h ago / Mar 4" label for a backend timestamp. */
export function relativeTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "unknown";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Percentage label with no letter grade, per the formative-assessment contract. */
export function coverageLabel(pct: number): string {
  return `${Math.round(pct)}%`;
}
