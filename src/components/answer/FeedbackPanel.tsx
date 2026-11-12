import type { ConceptResultView, ConceptView } from "@/backend";
import { ConceptChecklist } from "@/components/answer/ConceptChecklist";
import { EvidenceText } from "@/components/answer/EvidenceText";
import { UnderstandingMeter } from "@/components/answer/UnderstandingMeter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `answer-skeleton-${i}`,
);

function FeedbackSkeleton() {
  return (
    <div data-ocid="answer.feedback.loading_state" className="space-y-4">
      <div className="flex items-center gap-5">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="space-y-3">
        {SKELETON_IDS.map((id) => (
          <Skeleton key={id} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function FeedbackEmpty() {
  return (
    <div
      data-ocid="answer.feedback.empty_state"
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="font-display text-lg font-semibold text-foreground">
        No feedback yet
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Write your answer, then press{" "}
        <span className="font-medium">Get Feedback</span> to see how well you
        covered each concept.
      </p>
    </div>
  );
}

/**
 * Right-hand feedback panel: the Understanding Meter, the concept checklist and
 * the evidence-highlighted answer. Renders skeleton loaders while a call is in
 * flight and an empty state before the first response.
 */
export function FeedbackPanel({
  concepts,
  results,
  coveragePct,
  submittedText,
  isLoading,
  hasResponse,
}: {
  concepts: ConceptView[];
  results: ConceptResultView[];
  coveragePct: number;
  submittedText: string;
  isLoading: boolean;
  hasResponse: boolean;
}) {
  const evidenceSpans = results
    .filter((r): r is ConceptResultView & { evidenceQuote: string } =>
      Boolean(r.evidenceQuote),
    )
    .map((r) => ({ quote: r.evidenceQuote, status: r.status }));

  return (
    <Card
      data-ocid="answer.feedback.panel"
      className="rounded-2xl border shadow-card"
    >
      <CardHeader className="border-b border-border">
        <CardTitle className="font-display text-xl">Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {isLoading ? (
          <FeedbackSkeleton />
        ) : !hasResponse ? (
          <FeedbackEmpty />
        ) : (
          <>
            <UnderstandingMeter coveragePct={coveragePct} />

            <div className="space-y-3">
              <h3 className="font-display text-base font-semibold text-foreground">
                Concept checklist
              </h3>
              <ConceptChecklist concepts={concepts} results={results} />
            </div>

            {evidenceSpans.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Your answer, annotated
                </h3>
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  <EvidenceText text={submittedText} spans={evidenceSpans} />
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
