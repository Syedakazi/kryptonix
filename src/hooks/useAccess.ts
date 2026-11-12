import { createActor } from "@/backend";
import { queryKeys } from "@/lib/queryKeys";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/**
 * Registration + approval + role status for the caller. Drives the role/approval
 * gate and the header identity chip.
 */
export function useAccessStatus() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.accessStatus,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAccessStatus();
    },
    enabled: !!actor && !isFetching,
  });
}

/** The caller's own profile (role + display name). */
export function useMyProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching,
  });
}
