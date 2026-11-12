import { AppRole } from "@/backend";
import { useAccessStatus } from "@/hooks/useAccess";
import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Signed-in identity chip: avatar initials, display name and role. */
export function IdentityChip({ className }: { className?: string }) {
  const { data: status } = useAccessStatus();
  const name = status?.name?.trim() || "Signed in";
  const roleLabel =
    status?.role === AppRole.teacher
      ? "Teacher"
      : status?.role === AppRole.student
        ? "Student"
        : "Member";

  return (
    <div
      data-ocid="layout.identity"
      className={cn("flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        {initials(name)}
      </span>
      <span className="hidden min-w-0 flex-col leading-tight sm:flex">
        <span className="truncate text-sm font-medium text-foreground">
          {name}
        </span>
        <span className="text-xs text-muted-foreground">{roleLabel}</span>
      </span>
    </div>
  );
}

/** Marginalia wordmark: serif logotype with a highlighter underline. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        Marginalia
      </span>
    </span>
  );
}
