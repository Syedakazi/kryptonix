import { createActor } from "@/backend";
import { queryKeys } from "@/lib/queryKeys";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Data + mutation hooks for the Answer Page formative loop. Every call goes
 * through the generated backend bindings; the backend owns inference and
 * persistence, so the frontend simply awaits the ordinary method.
 */

/** One assignment the caller may see. */
export function useAssignment(assignmentId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.assignment(assignmentId),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAssignment(assignmentId);
    },
    enabled: !!actor && !isFetching,
  });
}

/** The assignment's concept graph. */
export function useConcepts(assignmentId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.concepts(assignmentId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.listConcepts(assignmentId);
    },
    enabled: !!actor && !isFetching,
  });
}

/** The caller's submission for an assignment, created on first read. */
export function useSubmission(assignmentId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.submission(assignmentId),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOrCreateSubmission(assignmentId);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Every saved version for a submission, newest first. */
export function useVersions(submissionId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.versions(submissionId ?? 0n),
    queryFn: async () => {
      if (!actor || submissionId === null) return [];
      return actor.listVersions(submissionId);
    },
    enabled: !!actor && !isFetching && submissionId !== null,
  });
}

/** Concept results for one version. */
export function useConceptResults(versionId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.conceptResults(versionId ?? 0n),
    queryFn: async () => {
      if (!actor || versionId === null) return [];
      return actor.listConceptResults(versionId);
    },
    enabled: !!actor && !isFetching && versionId !== null,
  });
}

/** Growth timeline + concept diff across a submission's versions. */
export function useGrowthTimeline(submissionId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.growthTimeline(submissionId ?? 0n),
    queryFn: async () => {
      if (!actor || submissionId === null) return null;
      return actor.getGrowthTimeline(submissionId);
    },
    enabled: !!actor && !isFetching && submissionId !== null,
  });
}

/**
 * Send the answer to the LLM and persist a new version. Invalidates the
 * version list, growth timeline and submission so the loop refreshes.
 */
export function useGetFeedback(submissionId: bigint | null) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor || submissionId === null) {
        throw new Error("Backend is not ready");
      }
      return actor.getFeedback(submissionId, text);
    },
    onSuccess: () => {
      if (submissionId === null) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.versions(submissionId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.growthTimeline(submissionId),
      });
    },
  });
}

/** Submit the caller's submission to the teacher. */
export function useSubmitToTeacher(submissionId: bigint | null) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor || submissionId === null) {
        throw new Error("Backend is not ready");
      }
      return actor.submitToTeacher(submissionId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignedTasks });
      void queryClient.invalidateQueries({ queryKey: ["submission"] });
    },
  });
}
