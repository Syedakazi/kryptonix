import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";

/**
 * Typed actor access built on the generated backend bindings. Call at React hook
 * top level only — never inside a query or mutation callback.
 */
export function useBackendActor() {
  return useActor(createActor);
}

/** True once the actor is connected and ready to serve calls. */
export function isActorReady(actor: unknown, isFetching: boolean): boolean {
  return !!actor && !isFetching;
}
