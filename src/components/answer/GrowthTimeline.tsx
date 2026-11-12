import type { GrowthTimeline as GrowthTimelineData } from "@/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { coverageLabel, relativeTime } from "@/lib/format";
import { statusStyle } from "@/lib/status";
import { cn } from "@/lib/utils";
import { PartyPopper, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartPoint {
  versionNo: number;
  coveragePct: number;
}

function toChartData(data: GrowthTimelineData): ChartPoint[] {
  return [...data.points]
    .sort((a, b) => Number(a.versionNo - b.versionNo))
    .map((p) => ({
      versionNo: Number(p.versionNo),
      coveragePct: Math.round(p.coveragePct),
    }));
}

/**
 * Growth Timeline: a recharts line chart of coverage % across versions plus the
 * before/after concept diff and the "You fixed N concepts!" headline.
 */
export function GrowthTimeline({
  data,
  className,
}: {
  data: GrowthTimelineData;
  className?: string;
}) {
  const chartData = toChartData(data);
  const fixedCount = Number(data.fixedCount);
  const improved = data.diff.filter((d) => d.improved);

  return (
    <Card
      data-ocid="answer.growth.panel"
      className={cn("rounded-2xl border shadow-card", className)}
    >
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
          Growth Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {fixedCount > 0 ? (
          <div
            data-ocid="answer.growth.fixed_headline"
            className="flex items-center gap-2.5 rounded-xl border border-[oklch(var(--status-covered)/0.4)] bg-[oklch(var(--status-covered)/0.12)] px-4 py-3"
          >
            <PartyPopper
              className="h-5 w-5 shrink-0 text-[oklch(var(--status-covered))]"
              aria-hidden="true"
            />
            <p className="font-display text-lg font-semibold text-foreground">
              You fixed {fixedCount} {fixedCount === 1 ? "concept" : "concepts"}
              !
            </p>
          </div>
        ) : null}

        {chartData.length > 0 ? (
          <div
            data-ocid="answer.growth.chart"
            className="h-56 w-full"
            aria-label="Coverage percentage across versions"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, bottom: 4, left: -18 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="versionNo"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "oklch(var(--muted-foreground))",
                  }}
                  tickFormatter={(value: number) => `v${value}`}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{
                    fontSize: 12,
                    fill: "oklch(var(--muted-foreground))",
                  }}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <Tooltip
                  cursor={{ stroke: "oklch(var(--border))" }}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid oklch(var(--border))",
                    background: "oklch(var(--popover))",
                    color: "oklch(var(--popover-foreground))",
                    fontSize: "0.8rem",
                  }}
                  labelFormatter={(value) => `Version ${value}`}
                  formatter={(value: number) => [
                    coverageLabel(value),
                    "Coverage",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="coveragePct"
                  stroke="oklch(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "oklch(var(--primary))" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your coverage across versions will appear here after your first
            feedback.
          </p>
        )}

        {improved.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-display text-base font-semibold text-foreground">
              What changed
            </h3>
            <ul data-ocid="answer.growth.diff_list" className="space-y-2">
              {improved.map((entry, index) => {
                const from = statusStyle(entry.fromStatus);
                const to = statusStyle(entry.toStatus);
                return (
                  <li
                    key={entry.concept.toString()}
                    data-ocid={`answer.growth.diff_item.${index + 1}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {entry.conceptName}
                    </span>
                    <span className={cn("font-medium", from.text)}>
                      {from.label}
                    </span>
                    <span className="text-muted-foreground" aria-hidden="true">
                      →
                    </span>
                    <span className={cn("font-medium", to.text)}>
                      {to.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Compact version history list (version number, coverage %, relative time). */
export function VersionHistory({
  versions,
  className,
}: {
  versions: Array<{
    id: bigint;
    versionNo: bigint;
    coveragePct: number;
    createdAt: bigint;
  }>;
  className?: string;
}) {
  const ordered = [...versions].sort((a, b) =>
    Number(b.versionNo - a.versionNo),
  );

  return (
    <Card
      data-ocid="answer.versions.panel"
      className={cn("rounded-2xl border shadow-card", className)}
    >
      <CardHeader className="border-b border-border">
        <CardTitle className="font-display text-xl">Version history</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No versions saved yet.
          </p>
        ) : (
          <ul data-ocid="answer.versions.list" className="space-y-2">
            {ordered.map((version, index) => (
              <li
                key={version.id.toString()}
                data-ocid={`answer.versions.item.${index + 1}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">
                  Version {Number(version.versionNo)}
                </span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span className="tabular-nums text-foreground">
                    {coverageLabel(version.coveragePct)}
                  </span>
                  <span>{relativeTime(version.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
