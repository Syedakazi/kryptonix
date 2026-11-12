import { AppRole, SubmissionStatus } from "@/backend";
import { AccessGate } from "@/components/AccessGate";
import { AnswerEditor } from "@/components/answer/AnswerEditor";
import { FeedbackPanel } from "@/components/answer/FeedbackPanel";
import {
  GrowthTimeline,
  VersionHistory,
} from "@/components/answer/GrowthTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAssignment,
  useConcepts,
  useGetFeedback,
  useGrowthTimeline,
  useSubmission,
  useSubmitToTeacher,
  useVersions,
} from "@/hooks/useAnswer";
import { relativeTime } from "@/lib/format";
import { notifyFeedbackError, notifySuccess } from "@/lib/toast";
import { useParams } from "@tanstack/react-router";
import { CheckCircle2, FileText, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function parseAssignmentId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function PageSkeleton() {
  return (
    <div data-ocid="answer.loading_state" className="space-y-6">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function AnswerWorkspace({ assignmentId }: { assignmentId: bigint }) {
  const assignmentQuery = useAssignment(assignmentId);
  const conceptsQuery = useConcepts(assignmentId);
  const submissionQuery = useSubmission(assignmentId);

  const submission = submissionQuery.data ?? null;
  const submissionId = submission?.id ?? null;

  const versionsQuery = useVersions(submissionId);
  const growthQuery = useGrowthTimeline(submissionId);

  const feedback = useGetFeedback(submissionId);
  const submitToTeacher = useSubmitToTeacher(submissionId);

  const [text, setText] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [hasResponse, setHasResponse] = useState(false);

  const versions = useMemo(
    () => versionsQuery.data ?? [],
    [versionsQuery.data],
  );
  const latestVersion = useMemo(() => {
    if (versions.length === 0) return null;
    return [...versions].sort((a, b) => Number(b.versionNo - a.versionNo))[0];
  }, [versions]);

  // Seed the editor once from the latest saved version, without clobbering a
  // draft the student is already typing.
  useEffect(() => {
    if (latestVersion && text === "" && submittedText === "") {
      setText(latestVersion.text);
      setSubmittedText(latestVersion.text);
      setHasResponse(true);
    }
  }, [latestVersion, text, submittedText]);

  const assignment = assignmentQuery.data ?? null;
  const concepts = conceptsQuery.data ?? [];
  const isSubmitted = submission?.status === SubmissionStatus.submitted;

  const handleGetFeedback = () => {
    const current = text;
    if (!current.trim()) return;
    feedback.mutate(current, {
      onSuccess: (result) => {
        setSubmittedText(current);
        setHasResponse(true);
        notifySuccess(
          "Feedback ready",
          `Coverage is now ${Math.round(result.coveragePct)}%.`,
        );
      },
      onError: () => {
        notifyFeedbackError();
      },
    });
  };

  const handleSubmitToTeacher = () => {
    submitToTeacher.mutate(undefined, {
      onSuccess: () => {
        notifySuccess(
          "Submitted to your teacher",
          "Your latest version is now with your teacher.",
        );
      },
      onError: () => {
        notifyFeedbackError();
      },
    });
  };

  if (assignmentQuery.isLoading || submissionQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (!assignment) {
    return (
      <Card
        data-ocid="answer.error_state"
        className="mx-auto max-w-lg rounded-2xl border shadow-card"
      >
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <FileText
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="font-display text-2xl font-semibold">
            Assignment not found
          </h2>
          <p className="text-muted-foreground">
            This assignment may have been removed or is not assigned to you.
          </p>
        </CardContent>
      </Card>
    );
  }

  const results = feedback.data?.results ?? [];
  const coveragePct = feedback.data?.coveragePct ?? 0;

  return (
    <div data-ocid="answer.page" className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {assignment.title}
          </h1>
          <Badge
            variant="outline"
            data-ocid="answer.submission_status"
            className={
              isSubmitted
                ? "rounded-full border-[oklch(var(--status-covered)/0.45)] bg-[oklch(var(--status-covered)/0.14)] text-[oklch(var(--status-covered))]"
                : "rounded-full border-border bg-secondary text-secondary-foreground"
            }
          >
            {isSubmitted ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Submitted
              </>
            ) : (
              "Draft"
            )}
          </Badge>
        </div>

        <Card className="rounded-2xl border shadow-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-semibold text-muted-foreground">
              Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-8 text-foreground">
              {assignment.prompt}
            </p>
          </CardContent>
        </Card>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnswerEditor
          value={text}
          onChange={setText}
          onGetFeedback={handleGetFeedback}
          isPending={feedback.isPending}
          disabled={isSubmitted}
        />
        <FeedbackPanel
          concepts={concepts}
          results={results}
          coveragePct={coveragePct}
          submittedText={submittedText}
          isLoading={feedback.isPending}
          hasResponse={hasResponse}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GrowthTimeline
          data={
            growthQuery.data ?? {
              points: [],
              diff: [],
              fixedCount: 0n,
            }
          }
        />
        <VersionHistory versions={versions} />
      </div>

      <Card className="rounded-2xl border shadow-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-foreground">
              Ready to hand it in?
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubmitted
                ? "Your submission is with your teacher."
                : "Submit your latest version to your teacher when you're happy with it."}
            </p>
          </div>
          <Button
            type="button"
            data-ocid="answer.submit_button"
            onClick={handleSubmitToTeacher}
            disabled={isSubmitted || submitToTeacher.isPending || !hasResponse}
            className="rounded-full px-5 transition-smooth"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {isSubmitted
              ? "Submitted"
              : submitToTeacher.isPending
                ? "Submitting…"
                : "Submit to teacher"}
          </Button>
        </CardContent>
      </Card>

      {latestVersion ? (
        <p className="text-center text-xs text-muted-foreground">
          Last saved {relativeTime(latestVersion.createdAt)} · Version{" "}
          {Number(latestVersion.versionNo)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Answer Page: the student's formative feedback loop. Gated to approved
 * students; the workspace reads the assignment, concept graph and submission
 * and drives the getFeedback / submitToTeacher loop.
 */
export function AnswerPage() {
  const params = useParams({ strict: false });
  const assignmentId = parseAssignmentId(params.assignmentId ?? "");

  return (
    <AccessGate requiredRole={AppRole.student}>
      {assignmentId === null ? (
        <Card
          data-ocid="answer.error_state"
          className="mx-auto max-w-lg rounded-2xl border shadow-card"
        >
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <FileText
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="font-display text-2xl font-semibold">
              Assignment not found
            </h2>
            <p className="text-muted-foreground">
              The assignment link looks invalid.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnswerWorkspace assignmentId={assignmentId} />
      )}
    </AccessGate>
  );
}
