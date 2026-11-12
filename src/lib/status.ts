import { ConceptStatus } from "@/backend";

/**
 * Single source of truth mapping a concept status to the `--status-*` design
 * tokens. Chips, evidence highlights, the meter and charts all read from here so
 * a status always renders the same color everywhere.
 */
export interface StatusStyle {
  /** Human label shown on chips and legends. */
  label: string;
  /** Tailwind text color class bound to the status token. */
  text: string;
  /** Tailwind background class bound to the status token. */
  bg: string;
  /** Tailwind border class bound to the status token. */
  border: string;
  /** Inline highlighter utility class for evidence spans. */
  highlight: string;
  /** Raw OKLCH token reference for charts and inline SVG. */
  token: string;
  /** Short glyph used in compact legends. */
  glyph: string;
}

export const STATUS_STYLES: Record<ConceptStatus, StatusStyle> = {
  [ConceptStatus.covered]: {
    label: "Covered",
    text: "text-[oklch(var(--status-covered))]",
    bg: "bg-[oklch(var(--status-covered)/0.14)]",
    border: "border-[oklch(var(--status-covered)/0.45)]",
    highlight: "highlight-covered",
    token: "var(--status-covered)",
    glyph: "✓",
  },
  [ConceptStatus.partial]: {
    label: "Partial",
    text: "text-[oklch(var(--status-partial))]",
    bg: "bg-[oklch(var(--status-partial)/0.16)]",
    border: "border-[oklch(var(--status-partial)/0.5)]",
    highlight: "highlight-partial",
    token: "var(--status-partial)",
    glyph: "~",
  },
  [ConceptStatus.missing]: {
    label: "Missing",
    text: "text-[oklch(var(--status-missing))]",
    bg: "bg-[oklch(var(--status-missing)/0.14)]",
    border: "border-[oklch(var(--status-missing)/0.4)]",
    highlight: "highlight-missing",
    token: "var(--status-missing)",
    glyph: "×",
  },
  [ConceptStatus.misconception]: {
    label: "Misconception",
    text: "text-[oklch(var(--status-misconception))]",
    bg: "bg-[oklch(var(--status-misconception)/0.14)]",
    border: "border-[oklch(var(--status-misconception)/0.45)]",
    highlight: "highlight-misconception",
    token: "var(--status-misconception)",
    glyph: "⚠",
  },
};

/** Statuses that still need student attention (used for nudges and counts). */
export const NON_COVERED_STATUSES: ConceptStatus[] = [
  ConceptStatus.partial,
  ConceptStatus.missing,
  ConceptStatus.misconception,
];

export function statusStyle(status: ConceptStatus): StatusStyle {
  return STATUS_STYLES[status];
}

export function isCovered(status: ConceptStatus): boolean {
  return status === ConceptStatus.covered;
}

/** Weighted coverage percentage from concept weights and their statuses. */
export function weightedCoverage(
  concepts: Array<{ id: bigint; weight: number }>,
  statuses: Map<string, ConceptStatus>,
): number {
  const totalWeight = concepts.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) return 0;
  const earned = concepts.reduce((sum, c) => {
    const status = statuses.get(c.id.toString());
    if (status === ConceptStatus.covered) return sum + c.weight;
    if (status === ConceptStatus.partial) return sum + c.weight * 0.5;
    return sum;
  }, 0);
  return Math.round((earned / totalWeight) * 100);
}
