/**
 * Central query-key registry. Every React Query hook reads its key from here so
 * invalidation stays consistent across the app.
 */
export const queryKeys = {
  accessStatus: ["accessStatus"] as const,
  myProfile: ["myProfile"] as const,
  assignedTasks: ["assignedTasks"] as const,
  assignment: (assignmentId: bigint) =>
    ["assignment", assignmentId.toString()] as const,
  concepts: (assignmentId: bigint) =>
    ["concepts", assignmentId.toString()] as const,
  submission: (assignmentId: bigint) =>
    ["submission", assignmentId.toString()] as const,
  versions: (submissionId: bigint) =>
    ["versions", submissionId.toString()] as const,
  version: (versionId: bigint) => ["version", versionId.toString()] as const,
  conceptResults: (versionId: bigint) =>
    ["conceptResults", versionId.toString()] as const,
  growthTimeline: (submissionId: bigint) =>
    ["growthTimeline", submissionId.toString()] as const,
  readings: ["readings"] as const,
  reading: (readingId: bigint) => ["reading", readingId.toString()] as const,
  marginNotes: (readingId: bigint) =>
    ["marginNotes", readingId.toString()] as const,
  readingEvaluations: (readingId: bigint) =>
    ["readingEvaluations", readingId.toString()] as const,
  teacherAssignments: ["teacherAssignments"] as const,
  assignmentSubmissions: (assignmentId: bigint) =>
    ["assignmentSubmissions", assignmentId.toString()] as const,
  approvalRequests: ["approvalRequests"] as const,
} as const;
