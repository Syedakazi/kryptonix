import { PocketIc, createIdentity } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory, type _SERVICE } from "../../src/frontend/src/declarations/backend.did.js";
import { registerCaller } from "./test-utils";

// The lane runner hands the sidecar URL and the built wasm path through the
// environment; without them there is no replica to test against.
const POCKET_IC_URL = process.env.POCKET_IC_URL;
const BACKEND_WASM = process.env.BACKEND_WASM;

const describeIfReplica = POCKET_IC_URL && BACKEND_WASM ? describe : describe.skip;

describeIfReplica("backend assessment + identity lane", () => {
  let pic: PocketIc;
  let canisterId: Principal;
  // The first caller to initialize access control becomes the canister's only
  // admin, so the teacher is registered once and shared by every test.
  let teacher: ReturnType<typeof pic.createActor<_SERVICE>>;

  beforeAll(async () => {
    pic = await PocketIc.create(POCKET_IC_URL as string);
    const fixture = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM as string,
    });
    canisterId = fixture.canisterId;

    teacher = await registerCaller(
      pic.createActor<_SERVICE>(idlFactory, canisterId),
      createIdentity("teacher-seed"),
    );
    await teacher.registerProfile({ teacher: null }, "Prof. Turing");
  });

  afterAll(async () => {
    await pic?.tearDown();
  });

  /** A fresh actor for one identity, so each caller has its own principal. */
  function actorFor(seed: string) {
    const actor = pic.createActor<_SERVICE>(idlFactory, canisterId);
    actor.setIdentity(createIdentity(seed));
    return actor;
  }

  it("registers the first teacher as an admin with a pending approval request", async () => {
    // R2: the first caller to initialize access control is the admin.
    expect(await teacher.isCallerAdmin()).toBe(true);

    // R2: registration records the profile and opens a pending approval request.
    const status = await teacher.getAccessStatus();
    expect(status.registered).toBe(true);
    expect(status.role).toEqual([{ teacher: null }]);
    expect(status.name).toEqual(["Prof. Turing"]);

    const requests = await teacher.listApprovalRequests();
    const mine = requests.find((r) => r.name === "Prof. Turing");
    expect(mine?.state).toEqual({ pending: null });
  });

  it("authors an assignment with a concept graph the teacher can read back", async () => {
    // R9: the teacher authors an assignment with a concept graph.
    const assignmentId = await teacher.createAssignment(
      "Explain how backpropagation trains a neural network",
      "Describe how gradients flow backwards through the network.",
      "Cover each concept.",
    );
    await teacher.addConcept(
      assignmentId,
      "Chain rule",
      "Derivatives compose along the path.",
      2,
      "Gradients are computed forwards.",
    );

    const concepts = await teacher.listConcepts(assignmentId);
    expect(concepts).toHaveLength(1);
    expect(concepts[0].name).toBe("Chain rule");
    expect(concepts[0].weight).toBe(2);

    const mine = await teacher.listTeacherAssignments();
    expect(mine.map((a) => a.id)).toContain(assignmentId);
  });

  it("lists the student's assigned task and keeps their work private", async () => {
    const assignmentId = await teacher.createAssignment("Private task", "Prompt", "Rubric");
    const student = actorFor("student-seed");
    const stranger = actorFor("stranger-seed");

    // R9: opening a submission makes the task appear on the student's dashboard.
    const submission = await student.getOrCreateSubmission(assignmentId);
    expect(submission.status).toEqual({ draft: null });

    const tasks = await student.listAssignedTasks();
    const task = tasks.find((t) => t.assignment.id === assignmentId);
    expect(task).toBeDefined();
    expect(task?.assignment.title).toBe("Private task");

    // R17: a different student cannot read the owner's versions or growth.
    expect(await stranger.listVersions(submission.id)).toEqual([]);
    expect(await stranger.getGrowthTimeline(submission.id)).toEqual({
      points: [],
      diff: [],
      fixedCount: 0n,
    });

    // R12: only the owner may submit their own work.
    await expect(stranger.submitToTeacher(submission.id)).rejects.toThrow();
    await student.submitToTeacher(submission.id);

    // R17: the owning teacher sees the submission; the student sees it submitted.
    const submissions = await teacher.listAssignmentSubmissions(assignmentId);
    expect(submissions.map((s) => s.id)).toContain(submission.id);
    const afterSubmit = await student.listAssignedTasks();
    const submittedTask = afterSubmit.find((t) => t.assignment.id === assignmentId);
    expect(submittedTask).toBeDefined();
    // `submission` is an optional, decoded by the actor as a 0/1-element array.
    expect(submittedTask?.submission).toHaveLength(1);
    expect(submittedTask?.submission[0].status).toEqual({ submitted: null });
  });

  it("rejects a teacher submitting to their own assignment", async () => {
    const assignmentId = await teacher.createAssignment("Own task", "Prompt", "Rubric");

    // R17: a teacher cannot open a submission against their own assignment.
    await expect(teacher.getOrCreateSubmission(assignmentId)).rejects.toThrow();
  });
});
