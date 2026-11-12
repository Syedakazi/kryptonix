import {
  type ConceptResultView,
  type ConceptView,
  OverrideStatus,
} from "@/backend";
import { Badge } from "@/components/ui/badge";
import { isCovered, statusStyle } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Info, Lightbulb, ShieldCheck } from "lucide-react";

function overrideLabel(status: OverrideStatus): string {
  switch (status) {
    case OverrideStatus.accepted:
      return "Teacher accepted this judgement";
    case OverrideStatus.overridden:
      return "Teacher overrode this judgement";
    default:
      return "Teacher can override";
  }
}

function ConceptRow({
  concept,
  result,
  index,
}: {
  concept: ConceptView | undefined;
  result: ConceptResultView;
  index: number;
}) {
  const style = statusStyle(result.status);
  const covered = isCovered(result.status);
  const name = concept?.name ?? "Concept";
  const weight = concept?.weight ?? 0;
  const confidencePct = Math.round(result.confidence * 100);

  return (
    <li
      data-ocid={`answer.concept.item.${index + 1}`}
      className="rounded-xl border border-border bg-card/60 p-4 transition-smooth hover:border-primary/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{name}</p>
          {concept?.description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {concept.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border font-medium",
              style.text,
              style.bg,
              style.border,
            )}
          >
            <span aria-hidden="true">{style.glyph}</span>
            {style.label}
          </Badge>
          <span className="text-xs tabular-nums text-muted-foreground">
            weight {weight}
          </span>
        </div>
      </div>

      {!covered ? (
        <div className="mt-3 flex gap-2.5 rounded-lg border border-accent/40 bg-accent/10 p-3">
          <Lightbulb
            className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground"
            aria-hidden="true"
          />
          <p className="text-sm leading-6 text-foreground">{result.nudge}</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Confidence {confidencePct}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {overrideLabel(result.teacherOverrideStatus)}
        </span>
      </div>

      {result.teacherComment ? (
        <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground">
          <span className="font-medium">Teacher note: </span>
          {result.teacherComment}
        </p>
      ) : null}
    </li>
  );
}

/**
 * Concept checklist: one row per concept with a status chip, weight, the
 * Socratic nudge under non-covered concepts, the judgement confidence and a
 * teacher-overridable affordance. No student-facing override action.
 */
export function ConceptChecklist({
  concepts,
  results,
  className,
}: {
  concepts: ConceptView[];
  results: ConceptResultView[];
  className?: string;
}) {
  const conceptById = new Map(concepts.map((c) => [c.id.toString(), c]));
  const ordered = [...results].sort((a, b) => {
    const wa = conceptById.get(a.concept.toString())?.weight ?? 0;
    const wb = conceptById.get(b.concept.toString())?.weight ?? 0;
    return wb - wa;
  });

  return (
    <ul data-ocid="answer.concept.list" className={cn("space-y-3", className)}>
      {ordered.map((result, index) => (
        <ConceptRow
          key={result.id.toString()}
          concept={conceptById.get(result.concept.toString())}
          result={result}
          index={index}
        />
      ))}
    </ul>
  );
}
