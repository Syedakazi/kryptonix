import { coverageLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Weighted "Understanding Meter": a progress ring with the coverage percentage
 * label. Deliberately shows no letter grade and no pass/fail verdict.
 */
export function UnderstandingMeter({
  coveragePct,
  className,
}: {
  coveragePct: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(coveragePct)));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div
      data-ocid="answer.understanding_meter"
      className={cn("flex items-center gap-5", className)}
    >
      <div className="relative h-32 w-32 shrink-0">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={`Understanding meter: ${coverageLabel(clamped)} of concepts covered`}
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-muted"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="stroke-primary transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold tabular-nums text-foreground">
            {coverageLabel(clamped)}
          </span>
          <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
            covered
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold text-foreground">
          Understanding Meter
        </p>
        <p className="text-sm text-muted-foreground">
          Weighted coverage across the assignment&apos;s concepts. Keep revising
          to move the needle.
        </p>
      </div>
    </div>
  );
}
