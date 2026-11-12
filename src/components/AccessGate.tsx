import { AppRole } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccessStatus } from "@/hooks/useAccess";
import { Clock, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

function GateShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center px-4 py-16">
      <Card className="w-full rounded-2xl border shadow-card animate-fade-in-up">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Shared role/approval gate. Reads `getAccessStatus` and renders the
 * pending-approval state for unapproved accounts. The sign-in page owns role
 * selection itself, so this gate only guards the private dashboard and Answer
 * Page routes.
 */
export function AccessGate({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: AppRole;
}) {
  const { data: status, isLoading, isError, refetch } = useAccessStatus();

  if (isLoading) {
    return (
      <div
        data-ocid="access.loading_state"
        className="mx-auto w-full max-w-3xl space-y-4 px-4 py-16"
      >
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !status) {
    return (
      <GateShell>
        <ShieldAlert
          className="h-10 w-10 text-destructive"
          aria-hidden="true"
        />
        <h2 className="font-display text-2xl font-semibold">
          We couldn&apos;t load your access
        </h2>
        <p className="text-muted-foreground">
          Something interrupted the connection to your account.
        </p>
        <Button
          type="button"
          data-ocid="access.retry_button"
          className="rounded-full"
          onClick={() => void refetch()}
        >
          Try again
        </Button>
      </GateShell>
    );
  }

  if (!status.registered) {
    return (
      <GateShell>
        <ShieldAlert className="h-10 w-10 text-primary" aria-hidden="true" />
        <h2 className="font-display text-2xl font-semibold">
          Finish setting up your account
        </h2>
        <p className="text-muted-foreground">
          Choose your role on the sign-in page to continue.
        </p>
      </GateShell>
    );
  }

  if (!status.approved) {
    return (
      <GateShell>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/25 text-accent-foreground animate-pulse-soft">
          <Clock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2
          data-ocid="access.pending_state"
          className="font-display text-2xl font-semibold"
        >
          Waiting for approval
        </h2>
        <p className="text-muted-foreground">
          Your account is pending a teacher&apos;s approval. You&apos;ll get
          access as soon as it&apos;s granted.
        </p>
      </GateShell>
    );
  }

  if (requiredRole && status.role !== requiredRole) {
    return (
      <GateShell>
        <ShieldAlert
          className="h-10 w-10 text-destructive"
          aria-hidden="true"
        />
        <h2 className="font-display text-2xl font-semibold">
          This area is for{" "}
          {requiredRole === AppRole.teacher ? "teachers" : "students"}
        </h2>
        <p className="text-muted-foreground">
          Your account is registered as a{" "}
          {status.role === AppRole.teacher ? "teacher" : "student"}.
        </p>
      </GateShell>
    );
  }

  return <>{children}</>;
}
