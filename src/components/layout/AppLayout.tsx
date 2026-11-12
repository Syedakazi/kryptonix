import { SignInButton } from "@/components/InternetIdentity";
import { IdentityChip, Wordmark } from "@/components/layout/IdentityChip";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Shared app shell: sticky cream header with the Marginalia wordmark, the
 * signed-in user's name and role, and a sign-out control, plus a responsive
 * content container and a quiet closing footer band.
 */
export function AppLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const year = new Date().getFullYear();
  const attribution = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
    typeof window === "undefined" ? "" : window.location.hostname,
  )}`;

  return (
    <div className="flex min-h-dvh flex-col bg-background paper-texture">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href="/dashboard"
            data-ocid="layout.home_link"
            className="rounded-md transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Wordmark />
          </a>
          <div className="flex items-center gap-3">
            <IdentityChip />
            <SignInButton
              className={cn(
                "rounded-full border border-input bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-smooth",
                "hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
              )}
            />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10",
          className,
        )}
      >
        {children}
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p className="font-display text-base text-foreground">
            Grade the thinking, not just the answer.
          </p>
          <a
            href={attribution}
            target="_blank"
            rel="noreferrer"
            className="transition-smooth hover:text-foreground"
          >
            © {year}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
