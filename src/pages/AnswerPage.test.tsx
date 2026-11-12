import { renderWithActor } from "@/__tests__/test-utils";
import {
  AppRole,
  ConceptStatus,
  type ConceptView,
  type FeedbackResult,
  type GrowthTimeline,
  OverrideStatus,
  SubmissionStatus,
  type SubmissionView,
  type VersionView,
  type backendInterface,
} from "@/backend";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { AnswerPage } from "./AnswerPage";

// recharts' ResponsiveContainer observes its box; jsdom has no ResizeObserver.
beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

// The Toaster lives in the root route, which these focused tests do not mount,
// so assert the toast call itself rather than rendered toast text.
const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: toastMock }));

// The Answer Page reads the route param through `useParams`; the router is not
// mounted in these focused tests, so the param is supplied directly.
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useParams: () => ({ assignmentId: "7" }),
}));

const ASSIGNMENT_ID = 7n;
const SUBMISSION_ID = 42n;

const assignment = {
  id: ASSIGNMENT_ID,
  teacher: "teacher" as never,
  title: "Explain how backpropagation trains a neural network",
  prompt: "Describe how gradients flow backwards through the network.",
  rubricText: "Cover each concept.",
  createdAt: 0n,
};

const concepts: ConceptView[] = [
  {
    id: 1n,
    assignment: ASSIGNMENT_ID,
    name: "Chain rule",
    description: "Derivatives compose along the path.",
    weight: 2,
    misconception: "Gradients are computed forwards.",
  },
  {
    id: 2n,
    assignment: ASSIGNMENT_ID,
    name: "Weight update",
    description: "Weights move opposite the gradient.",
    weight: 1,
    misconception: "Weights move along the gradient.",
  },
];

const submission: SubmissionView = {
  id: SUBMISSION_ID,
  assignment: ASSIGNMENT_ID,
  student: "student" as never,
  status: SubmissionStatus.draft,
  createdAt: 0n,
  updatedAt: 0n,
};

const ANSWER_TEXT =
  "The chain rule lets gradients flow backwards and each weight is nudged.";

const feedback: FeedbackResult = {
  coveragePct: 75,
  version: {
    id: 100n,
    submission: SUBMISSION_ID,
    versionNo: 1n,
    text: ANSWER_TEXT,
    coveragePct: 75,
    createdAt: 0n,
  },
  results: [
    {
      id: 200n,
      version: 100n,
      concept: 1n,
      status: ConceptStatus.covered,
      evidenceQuote: "The chain rule lets gradients flow backwards",
      nudge: "How does the chain rule connect the layers?",
      confidence: 0.9,
      teacherOverrideStatus: OverrideStatus.none,
    },
    {
      id: 201n,
      version: 100n,
      concept: 2n,
      status: ConceptStatus.missing,
      evidenceQuote: undefined,
      nudge: "Which direction should each weight move?",
      confidence: 0.6,
      teacherOverrideStatus: OverrideStatus.none,
    },
  ],
};

const growth: GrowthTimeline = {
  points: [
    { versionNo: 1n, coveragePct: 50, createdAt: 0n },
    { versionNo: 2n, coveragePct: 75, createdAt: 0n },
  ],
  diff: [
    {
      concept: 1n,
      conceptName: "Chain rule",
      fromStatus: ConceptStatus.partial,
      toStatus: ConceptStatus.covered,
      improved: true,
    },
  ],
  fixedCount: 1n,
};

const versions: VersionView[] = [
  {
    id: 100n,
    submission: SUBMISSION_ID,
    versionNo: 1n,
    text: ANSWER_TEXT,
    coveragePct: 75,
    createdAt: 0n,
  },
];

function makeActor(overrides: Partial<backendInterface> = {}) {
  const actor = {
    getAccessStatus: vi.fn<backendInterface["getAccessStatus"]>(async () => ({
      registered: true,
      approved: true,
      role: AppRole.student,
      name: "Ada",
    })),
    getAssignment: vi.fn<backendInterface["getAssignment"]>(async () =>
      structuredClone(assignment),
    ),
    listConcepts: vi.fn<backendInterface["listConcepts"]>(async () =>
      structuredClone(concepts),
    ),
    getOrCreateSubmission: vi.fn<backendInterface["getOrCreateSubmission"]>(
      async () => structuredClone(submission),
    ),
    listVersions: vi.fn<backendInterface["listVersions"]>(async () =>
      structuredClone(versions),
    ),
    getGrowthTimeline: vi.fn<backendInterface["getGrowthTimeline"]>(async () =>
      structuredClone(growth),
    ),
    getFeedback: vi.fn<backendInterface["getFeedback"]>(async () =>
      structuredClone(feedback),
    ),
    submitToTeacher: vi.fn<backendInterface["submitToTeacher"]>(async () => {}),
    ...overrides,
  };
  return actor as unknown as backendInterface;
}

describe("AnswerPage formative loop", () => {
  it("shows the answer editor and feedback panel, then renders per-concept feedback", async () => {
    const user = userEvent.setup();
    const actor = makeActor();
    renderWithActor(<AnswerPage />, actor);

    // C2: rich textarea on the left, feedback panel on the right.
    const textarea = await screen.findByTestId("answer.editor.textarea");
    expect(screen.getByTestId("answer.feedback.panel")).toBeInTheDocument();

    // The editor is seeded from the latest saved version.
    await waitFor(() => expect(textarea).toHaveValue(ANSWER_TEXT));
    await user.click(screen.getByTestId("answer.get_feedback_button"));

    // C2: per-concept status, evidence_quote, nudge and confidence.
    await waitFor(() =>
      expect(actor.getFeedback).toHaveBeenCalledWith(
        SUBMISSION_ID,
        ANSWER_TEXT,
      ),
    );
    const checklist = await screen.findByTestId("answer.concept.list");
    expect(within(checklist).getByText("Chain rule")).toBeInTheDocument();
    expect(within(checklist).getByText("Covered")).toBeInTheDocument();
    expect(within(checklist).getByText("Missing")).toBeInTheDocument();
    expect(
      within(checklist).getByText("Which direction should each weight move?"),
    ).toBeInTheDocument();
    expect(within(checklist).getByText("Confidence 90%")).toBeInTheDocument();
  });

  it("highlights evidence spans and shows the weighted meter with no letter grade", async () => {
    const user = userEvent.setup();
    const actor = makeActor();
    renderWithActor(<AnswerPage />, actor);

    const textarea = await screen.findByTestId("answer.editor.textarea");
    await waitFor(() => expect(textarea).toHaveValue(ANSWER_TEXT));
    await user.click(screen.getByTestId("answer.get_feedback_button"));

    // C4: evidence span highlighted with the status color.
    const evidence = await screen.findByTestId("answer.evidence_text");
    const mark = within(evidence).getByText(
      "The chain rule lets gradients flow backwards",
    );
    expect(mark.tagName).toBe("MARK");
    expect(mark.className).toContain("highlight-covered");

    // C4: weighted coverage percentage, no letter grade.
    const meter = screen.getByTestId("answer.understanding_meter");
    expect(within(meter).getByText("75%")).toBeInTheDocument();
    expect(meter.textContent).not.toMatch(/\b[ABCDF]\b/);
  });

  it("plots the growth timeline, reports fixed concepts and offers submit to teacher", async () => {
    const user = userEvent.setup();
    const actor = makeActor();
    renderWithActor(<AnswerPage />, actor);

    const textarea = await screen.findByTestId("answer.editor.textarea");
    await waitFor(() => expect(textarea).toHaveValue(ANSWER_TEXT));
    await user.click(screen.getByTestId("answer.get_feedback_button"));

    // C5: growth timeline chart, before/after diff and fixed-concept headline.
    expect(
      await screen.findByTestId("answer.growth.chart"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("answer.growth.fixed_headline"),
    ).toHaveTextContent("You fixed 1 concept!");
    expect(screen.getByTestId("answer.growth.diff_list")).toHaveTextContent(
      "Chain rule",
    );

    // C5: submit to teacher is available and calls the backend.
    const submit = screen.getByTestId("answer.submit_button");
    expect(submit).toBeEnabled();
    await user.click(submit);
    await waitFor(() =>
      expect(actor.submitToTeacher).toHaveBeenCalledWith(SUBMISSION_ID),
    );
  });

  it("shows a skeleton loader while feedback is in flight", async () => {
    const user = userEvent.setup();
    let resolveFeedback: (value: FeedbackResult) => void = () => {};
    const actor = makeActor({
      getFeedback: vi.fn<backendInterface["getFeedback"]>(
        () =>
          new Promise<FeedbackResult>((resolve) => {
            resolveFeedback = resolve;
          }),
      ),
    });
    renderWithActor(<AnswerPage />, actor);

    const textarea = await screen.findByTestId("answer.editor.textarea");
    await waitFor(() => expect(textarea).toHaveValue(ANSWER_TEXT));
    await user.click(screen.getByTestId("answer.get_feedback_button"));

    // C6: skeleton loader while the LLM call is pending.
    expect(
      await screen.findByTestId("answer.feedback.loading_state"),
    ).toBeInTheDocument();

    resolveFeedback(structuredClone(feedback));
    await waitFor(() =>
      expect(
        screen.queryByTestId("answer.feedback.loading_state"),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows a friendly error toast when the feedback call fails", async () => {
    const user = userEvent.setup();
    const actor = makeActor({
      getFeedback: vi.fn<backendInterface["getFeedback"]>(async () => {
        throw new Error("llmFailed");
      }),
    });
    renderWithActor(<AnswerPage />, actor);

    const textarea = await screen.findByTestId("answer.editor.textarea");
    await waitFor(() => expect(textarea).toHaveValue(ANSWER_TEXT));
    await user.click(screen.getByTestId("answer.get_feedback_button"));

    // C6: friendly error toast on failure.
    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        "Couldn't reach the feedback engine",
        expect.objectContaining({
          description: expect.stringContaining("Your answer is safe"),
        }),
      ),
    );
  });
});
