import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AccessStatus {
    name?: string;
    role?: AppRole;
    approved: boolean;
    registered: boolean;
}
export interface ApprovalRequestView {
    name: string;
    role: AppRole;
    user: UserId;
    state: ApprovalState;
    decidedAt?: Timestamp;
    requestedAt: Timestamp;
}
export interface AssignedTask {
    assignment: AssignmentView;
    submission?: SubmissionView;
    latestCoveragePct?: number;
}
export interface AssignmentView {
    id: Id;
    title: string;
    createdAt: Timestamp;
    teacher: UserId;
    rubricText: string;
    prompt: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface ConceptDiffEntry {
    concept: Id;
    conceptName: string;
    toStatus: ConceptStatus;
    fromStatus: ConceptStatus;
    improved: boolean;
}
export interface ConceptResultView {
    id: Id;
    evidenceQuote?: string;
    status: ConceptStatus;
    concept: Id;
    version: Id;
    teacherComment?: string;
    nudge: string;
    teacherOverrideStatus: OverrideStatus;
    confidence: number;
}
export interface ConceptView {
    id: Id;
    weight: number;
    assignment: Id;
    misconception: string;
    name: string;
    description: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface FeedbackResult {
    results: Array<ConceptResultView>;
    version: VersionView;
    coveragePct: number;
}
export interface GrowthPoint {
    versionNo: bigint;
    createdAt: Timestamp;
    coveragePct: number;
}
export interface GrowthTimeline {
    fixedCount: bigint;
    diff: Array<ConceptDiffEntry>;
    points: Array<GrowthPoint>;
}
export type Id = bigint;
export interface InviteInfo {
    expiresAt?: Time;
    revoked: boolean;
    code: string;
    name: string;
    createdAt: Time;
    createdBy: Principal;
    redemptions: Array<Redemption>;
    maxUses?: bigint;
}
export interface MarginNoteView {
    id: Id;
    reading: Id;
    question: string;
    studentResponse?: string;
    createdAt: Timestamp;
    noteType: MarginNoteType;
    anchorText: string;
}
export interface ProfileView {
    id: UserId;
    name: string;
    createdAt: Timestamp;
    role: AppRole;
}
export interface ReadingEvaluationView {
    id: Id;
    reading: Id;
    scoresJson: string;
    createdAt: Timestamp;
    feedbackJson: string;
}
export interface ReadingView {
    id: Id;
    title: string;
    content: string;
    createdAt: Timestamp;
    student: UserId;
}
export interface Redemption {
    at: Time;
    user: Principal;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface SubmissionView {
    id: Id;
    status: SubmissionStatus;
    assignment: Id;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    student: UserId;
}
export type Time = bigint;
export type Timestamp = bigint;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export type UserId = Principal;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface VersionView {
    id: Id;
    versionNo: bigint;
    createdAt: Timestamp;
    text: string;
    coveragePct: number;
    submission: Id;
}
export enum AppRole {
    teacher = "teacher",
    student = "student"
}
export enum ApprovalState {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ConceptStatus {
    missing = "missing",
    misconception = "misconception",
    covered = "covered",
    partial = "partial"
}
export enum InviteStatus {
    revoked = "revoked",
    expired = "expired",
    valid = "valid",
    invalid = "invalid",
    usedUp = "usedUp"
}
export enum MarginNoteType {
    question = "question",
    summary = "summary",
    highlight = "highlight"
}
export enum OverrideStatus {
    none = "none",
    accepted = "accepted",
    overridden = "overridden"
}
export enum RedeemResult {
    revoked = "revoked",
    expired = "expired",
    invalid = "invalid",
    usedUp = "usedUp",
    blocked = "blocked",
    joined = "joined",
    alreadyMember = "alreadyMember"
}
export enum SubmissionStatus {
    submitted = "submitted",
    draft = "draft"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Add a concept to an assignment (teacher only).
     */
    addConcept(assignment: Id, name: string, description: string, weight: number, misconception: string): Promise<Id>;
    /**
     * / Add a margin note to a reading (R16).
     */
    addMarginNote(reading: Id, noteType: MarginNoteType, anchorText: string, question: string): Promise<Id>;
    /**
     * / Record the student's response to a margin note (R16).
     */
    answerMarginNote(note: Id, response: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkInvite(code: string): Promise<InviteStatus>;
    /**
     * / Create an assignment (teacher only).
     */
    createAssignment(title: string, prompt: string, rubricText: string): Promise<Id>;
    createInvite(name: string, maxUses: bigint | null, expiresAt: Time | null): Promise<string>;
    /**
     * / Create a reading for the caller student (R16).
     */
    createReading(title: string, content: string): Promise<Id>;
    /**
     * / Approve or reject an account (admin only).
     */
    decideApproval(user: Principal, decision: ApprovalState): Promise<void>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Registration + approval + role status for the caller (R2).
     */
    getAccessStatus(): Promise<AccessStatus>;
    /**
     * / Static behavioral API documentation for AI assistants reading this canister
     * / through the ICP MCP connector. Authored from source; reads no runtime state.
     */
    getApiDoc(): Promise<string>;
    /**
     * / Read one assignment the caller may see (R17).
     */
    getAssignment(assignment: Id): Promise<AssignmentView | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Send the answer + concept graph to the LLM and persist a new version with
     * / per-concept results and weighted coverage (R10, R11, R12, R19).
     * / Backend inference path: HTTPS outcall inside this update call.
     */
    getFeedback(submission: Id, text: string): Promise<FeedbackResult>;
    /**
     * / Growth timeline + concept diff across a submission's versions (R12).
     */
    getGrowthTimeline(submission: Id): Promise<GrowthTimeline>;
    /**
     * / Read the caller's own profile.
     */
    getMyProfile(): Promise<ProfileView | null>;
    /**
     * / Get or create the caller's submission for an assignment (R17).
     */
    getOrCreateSubmission(assignment: Id): Promise<SubmissionView>;
    /**
     * / Read one reading the caller owns (R17).
     */
    getReading(reading: Id): Promise<ReadingView | null>;
    /**
     * / Read one version the caller may see (R17).
     */
    getVersion(version: Id): Promise<VersionView | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    /**
     * / List pending/all approval requests (admin only).
     */
    listApprovalRequests(): Promise<Array<ApprovalRequestView>>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    /**
     * / List the caller student's assigned tasks (R9, R17).
     */
    listAssignedTasks(): Promise<Array<AssignedTask>>;
    /**
     * / List submissions for one of the caller teacher's assignments (R17).
     */
    listAssignmentSubmissions(assignment: Id): Promise<Array<SubmissionView>>;
    /**
     * / List concept results for a version (R17).
     */
    listConceptResults(version: Id): Promise<Array<ConceptResultView>>;
    /**
     * / List an assignment's concepts (R17).
     */
    listConcepts(assignment: Id): Promise<Array<ConceptView>>;
    listInvites(): Promise<Array<InviteInfo>>;
    /**
     * / List margin notes for a reading (R17).
     */
    listMarginNotes(reading: Id): Promise<Array<MarginNoteView>>;
    /**
     * / List reading evaluations for a reading (R17).
     */
    listReadingEvaluations(reading: Id): Promise<Array<ReadingEvaluationView>>;
    /**
     * / List the caller's readings (R17).
     */
    listReadings(): Promise<Array<ReadingView>>;
    /**
     * / List the caller teacher's assignments.
     */
    listTeacherAssignments(): Promise<Array<AssignmentView>>;
    /**
     * / List the caller's versions for a submission (R12).
     */
    listVersions(submission: Id): Promise<Array<VersionView>>;
    /**
     * / Teacher override of one AI judgement (R19).
     */
    overrideConceptResult(result: Id, status: OverrideStatus, comment: string | null): Promise<void>;
    redeemInvite(code: string): Promise<RedeemResult>;
    /**
     * / Register the caller with a chosen Teacher/Student role (R2). Signed-in only.
     */
    registerProfile(role: AppRole, name: string): Promise<void>;
    removeApproval(user: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    revokeInvite(code: string): Promise<void>;
    /**
     * / Save a reading evaluation (R16).
     */
    saveReadingEvaluation(reading: Id, scoresJson: string, feedbackJson: string): Promise<Id>;
    schema(): Promise<string>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    /**
     * / Submit the caller's submission to the teacher (R12).
     */
    submitToTeacher(submission: Id): Promise<void>;
    /**
     * / Update the caller's display name.
     */
    updateProfileName(name: string): Promise<void>;
}
