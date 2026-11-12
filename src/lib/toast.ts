import { toast } from "sonner";

/**
 * Shared toast helpers built on sonner. Every LLM call surfaces failures through
 * `notifyError` so the copy stays friendly and consistent.
 */
export function notifySuccess(message: string, description?: string): void {
  toast.success(message, { description });
}

export function notifyError(message: string, description?: string): void {
  toast.error(message, { description });
}

export function notifyInfo(message: string, description?: string): void {
  toast(message, { description });
}

/** Friendly copy for a failed inference / feedback call. */
export function notifyFeedbackError(): void {
  notifyError(
    "Couldn't reach the feedback engine",
    "Your answer is safe. Check your connection and try again.",
  );
}

/** Normalize an unknown thrown value into a readable message. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}
