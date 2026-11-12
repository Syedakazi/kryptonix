import type { ConceptStatus } from "@/backend";
import { statusStyle } from "@/lib/status";
import { cn } from "@/lib/utils";

export interface EvidenceSpan {
  quote: string;
  status: ConceptStatus;
}

interface Segment {
  text: string;
  status: ConceptStatus | null;
}

/**
 * Split `text` into plain and highlighted segments for every evidence quote
 * that is an exact substring. Quotes not found in the text are skipped
 * silently. Overlapping quotes resolve to the first match so the render never
 * breaks.
 */
function buildSegments(text: string, spans: EvidenceSpan[]): Segment[] {
  const matches: Array<{ start: number; end: number; status: ConceptStatus }> =
    [];

  for (const span of spans) {
    const quote = span.quote;
    if (!quote) continue;
    const start = text.indexOf(quote);
    if (start === -1) continue;
    const end = start + quote.length;
    const overlaps = matches.some((m) => start < m.end && end > m.start);
    if (overlaps) continue;
    matches.push({ start, end, status: span.status });
  }

  matches.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ text: text.slice(cursor, match.start), status: null });
    }
    segments.push({
      text: text.slice(match.start, match.end),
      status: match.status,
    });
    cursor = match.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), status: null });
  }
  return segments;
}

/**
 * Renders the student's submitted text with each evidence quote highlighted in
 * its status color using the `.highlight-*` utilities.
 */
export function EvidenceText({
  text,
  spans,
  className,
}: {
  text: string;
  spans: EvidenceSpan[];
  className?: string;
}) {
  const segments = buildSegments(text, spans);

  return (
    <p
      data-ocid="answer.evidence_text"
      className={cn(
        "whitespace-pre-wrap break-words text-[0.95rem] leading-7 text-foreground",
        className,
      )}
    >
      {segments.map((segment, index) =>
        segment.status ? (
          <mark
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional slices of one immutable string
            key={`seg-${index}`}
            className={cn(
              "bg-transparent px-0.5 text-foreground",
              statusStyle(segment.status).highlight,
            )}
          >
            {segment.text}
          </mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional slices of one immutable string
          <span key={`seg-${index}`}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
