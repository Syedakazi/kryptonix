import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, PenLine, Sparkles } from "lucide-react";

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Left-hand answer editor: a rich, well-styled textarea with a live
 * character/word count and the "Get Feedback" action. The textarea is a
 * plain-text editor with a clean academic treatment.
 */
export function AnswerEditor({
  value,
  onChange,
  onGetFeedback,
  isPending,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onGetFeedback: () => void;
  isPending: boolean;
  disabled: boolean;
  className?: string;
}) {
  const words = countWords(value);
  const chars = value.length;
  const canSubmit = value.trim().length > 0 && !isPending && !disabled;

  return (
    <Card
      data-ocid="answer.editor.panel"
      className={cn("rounded-2xl border shadow-card", className)}
    >
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <PenLine className="h-5 w-5 text-primary" aria-hidden="true" />
          Your answer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <label htmlFor="answer-editor" className="sr-only">
          Write your answer
        </label>
        <Textarea
          id="answer-editor"
          data-ocid="answer.editor.textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Explain your reasoning in your own words. The feedback looks at how well you cover each concept, not just the final answer."
          disabled={disabled}
          className="min-h-[280px] resize-y rounded-xl border-input bg-card/60 p-4 text-base leading-7 shadow-none focus-visible:ring-[3px]"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            data-ocid="answer.editor.count"
            className="text-sm tabular-nums text-muted-foreground"
          >
            {words} {words === 1 ? "word" : "words"} · {chars}{" "}
            {chars === 1 ? "character" : "characters"}
          </p>
          <Button
            type="button"
            data-ocid="answer.get_feedback_button"
            onClick={onGetFeedback}
            disabled={!canSubmit}
            className="rounded-full px-5 transition-smooth"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Getting feedback…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Get Feedback
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
