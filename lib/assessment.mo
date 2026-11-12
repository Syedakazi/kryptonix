import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import OQL "mo:caffeineai-oql";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import ConceptStatusValue "ConceptStatusValue";
import OverrideStatusValue "OverrideStatusValue";
import SubmissionStatusValue "SubmissionStatusValue";

import Common "../types/common";
import Assessment "../types/assessment";

module {
  public type UserId = Common.UserId;
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type ConceptStatus = Common.ConceptStatus;
  public type OverrideStatus = Common.OverrideStatus;
  public type SubmissionStatus = Common.SubmissionStatus;
  public type Assignment = Assessment.Assignment;
  public type AssignmentView = Assessment.AssignmentView;
  public type Concept = Assessment.Concept;
  public type ConceptView = Assessment.ConceptView;
  public type Submission = Assessment.Submission;
  public type SubmissionView = Assessment.SubmissionView;
  public type Version = Assessment.Version;
  public type VersionView = Assessment.VersionView;
  public type ConceptResult = Assessment.ConceptResult;
  public type ConceptResultView = Assessment.ConceptResultView;
  public type AssignedTask = Assessment.AssignedTask;
  public type GrowthPoint = Assessment.GrowthPoint;
  public type ConceptDiffEntry = Assessment.ConceptDiffEntry;
  public type GrowthTimeline = Assessment.GrowthTimeline;

  /// Shared mutable state the assessment domain reads and writes. Passed in by
  /// the composition root so the module stays stateless (R16, R17).
  public type State = {
    assignments : Map.Map<Id, Assignment>;
    concepts : Map.Map<Id, Concept>;
    submissions : Map.Map<Id, Submission>;
    versions : Map.Map<Id, Version>;
    conceptResults : Map.Map<Id, ConceptResult>;
    counters : { var nextId : Id };
  };

  // --- Views ---------------------------------------------------------------

  func assignmentView(a : Assignment) : AssignmentView {
    {
      id = a.id;
      teacher = a.teacher;
      title = a.title;
      prompt = a.prompt;
      rubricText = a.rubricText;
      createdAt = a.createdAt;
    };
  };

  func conceptView(c : Concept) : ConceptView {
    {
      id = c.id;
      assignment = c.assignment;
      name = c.name;
      description = c.description;
      weight = c.weight;
      misconception = c.misconception;
    };
  };

  func submissionView(s : Submission) : SubmissionView {
    {
      id = s.id;
      assignment = s.assignment;
      student = s.student;
      status = s.status;
      createdAt = s.createdAt;
      updatedAt = s.updatedAt;
    };
  };

  func versionView(v : Version) : VersionView {
    {
      id = v.id;
      submission = v.submission;
      versionNo = v.versionNo;
      text = v.text;
      coveragePct = v.coveragePct;
      createdAt = v.createdAt;
    };
  };

  func resultView(r : ConceptResult) : ConceptResultView {
    {
      id = r.id;
      version = r.version;
      concept = r.concept;
      status = r.status;
      evidenceQuote = r.evidenceQuote;
      nudge = r.nudge;
      confidence = r.confidence;
      teacherOverrideStatus = r.teacherOverrideStatus;
      teacherComment = r.teacherComment;
    };
  };

  // --- Access helpers (R17) ------------------------------------------------

  /// Whether `caller` may read the given assignment: its teacher, or a student
  /// who has a submission for it.
  func canReadAssignment(state : State, caller : UserId, assignment : Id) : Bool {
    switch (state.assignments.get(assignment)) {
      case (?a) {
        if (a.teacher == caller) { return true };
        state.submissions.values().any(
          func(s) { s.assignment == assignment and s.student == caller }
        );
      };
      case null { false };
    };
  };

  /// Whether `caller` may read the given submission: its student, or the
  /// teacher who owns the parent assignment.
  func canReadSubmission(state : State, caller : UserId, submission : Id) : Bool {
    switch (state.submissions.get(submission)) {
      case (?s) {
        if (s.student == caller) { return true };
        switch (state.assignments.get(s.assignment)) {
          case (?a) { a.teacher == caller };
          case null { false };
        };
      };
      case null { false };
    };
  };

  /// Whether `caller` may read the given version: through its submission.
  func canReadVersion(state : State, caller : UserId, version : Id) : Bool {
    switch (state.versions.get(version)) {
      case (?v) { canReadSubmission(state, caller, v.submission) };
      case null { false };
    };
  };

  /// Whether `caller` may read the given concept result: through its version.
  func canReadResult(state : State, caller : UserId, result : Id) : Bool {
    switch (state.conceptResults.get(result)) {
      case (?r) { canReadVersion(state, caller, r.version) };
      case null { false };
    };
  };

  // --- Assignment + concept authoring (teacher) ----------------------------

  /// Create an assignment (teacher only).
  public func createAssignment(state : State, caller : UserId, title : Text, prompt : Text, rubricText : Text) : Id {
    if (caller.isAnonymous()) {
      Runtime.trap("notAuthorized: sign-in required to create an assignment");
    };
    let id = state.counters.nextId;
    state.counters.nextId := id + 1;
    let assignment : Assignment = {
      id;
      teacher = caller;
      title;
      prompt;
      rubricText;
      createdAt = Time.now();
    };
    state.assignments.add(id, assignment);
    id;
  };

  /// List assignments authored by the caller (teacher only).
  public func listTeacherAssignments(state : State, caller : UserId) : [AssignmentView] {
    state.assignments.values()
      .filter(func(a) { a.teacher == caller })
      .map(assignmentView)
      .toArray();
  };

  /// Read one assignment the caller may see (R17).
  public func getAssignment(state : State, caller : UserId, assignment : Id) : ?AssignmentView {
    if (not canReadAssignment(state, caller, assignment)) { return null };
    switch (state.assignments.get(assignment)) {
      case (?a) { ?assignmentView(a) };
      case null { null };
    };
  };

  /// Add a concept to an assignment's concept graph (teacher only).
  public func addConcept(state : State, caller : UserId, assignment : Id, name : Text, description : Text, weight : Float, misconception : Text) : Id {
    let ?a = state.assignments.get(assignment) else {
      Runtime.trap("notFound: no such assignment");
    };
    if (a.teacher != caller) {
      Runtime.trap("notAuthorized: only the assignment's teacher may add concepts");
    };
    let id = state.counters.nextId;
    state.counters.nextId := id + 1;
    let concept : Concept = {
      id;
      assignment;
      name;
      description;
      weight;
      misconception;
    };
    state.concepts.add(id, concept);
    id;
  };

  /// List an assignment's concepts (R17).
  public func listConcepts(state : State, caller : UserId, assignment : Id) : [ConceptView] {
    if (not canReadAssignment(state, caller, assignment)) { return [] };
    state.concepts.values()
      .filter(func(c) { c.assignment == assignment })
      .map(conceptView)
      .toArray();
  };

  // --- Student submissions -------------------------------------------------

  /// List the caller student's assigned tasks for the dashboard (R9, R17).
  public func listAssignedTasks(state : State, caller : UserId) : [AssignedTask] {
    let tasks = state.assignments.values().filter(
      func(a) {
        state.submissions.values().any(
          func(s) { s.assignment == a.id and s.student == caller }
        )
      }
    );
    tasks.map(
      func(a) {
        let sub = state.submissions.values().find(
          func(s) { s.assignment == a.id and s.student == caller }
        );
        var latestCoveragePct : ?Float = null;
        switch sub {
          case (?s) {
            let ordered = state.versions.values()
              .filter(func(v) { v.submission == s.id })
              .toArray()
              .sort(func(x, y) { Nat.compare(x.versionNo, y.versionNo) });
            if (ordered.size() > 0) {
              latestCoveragePct := ?ordered[ordered.size() - 1].coveragePct;
            };
          };
          case null {};
        };
        {
          assignment = assignmentView(a);
          submission = switch sub { case (?s) { ?submissionView(s) }; case null { null } };
          latestCoveragePct;
        };
      }
    ).toArray();
  };

  /// Get or create the caller's submission for an assignment (R17).
  public func getOrCreateSubmission(state : State, caller : UserId, assignment : Id) : SubmissionView {
    if (caller.isAnonymous()) {
      Runtime.trap("notAuthorized: sign-in required to open a submission");
    };
    let ?a = state.assignments.get(assignment) else {
      Runtime.trap("notFound: no such assignment");
    };
    if (a.teacher == caller) {
      Runtime.trap("notAuthorized: a teacher cannot submit to their own assignment");
    };
    switch (state.submissions.values().find(
      func(s) { s.assignment == assignment and s.student == caller }
    )) {
      case (?s) { submissionView(s) };
      case null {
        let id = state.counters.nextId;
        state.counters.nextId := id + 1;
        let now = Time.now();
        let submission : Submission = {
          id;
          assignment;
          student = caller;
          status = #draft;
          createdAt = now;
          updatedAt = now;
        };
        state.submissions.add(id, submission);
        submissionView(submission);
      };
    };
  };

  /// List the caller's versions for a submission, oldest first (R12).
  public func listVersions(state : State, caller : UserId, submission : Id) : [VersionView] {
    if (not canReadSubmission(state, caller, submission)) { return [] };
    state.versions.values()
      .filter(func(v) { v.submission == submission })
      .toArray()
      .sort(func(x, y) { Nat.compare(x.versionNo, y.versionNo) })
      .map(versionView);
  };

  /// Read one version the caller may see (R17).
  public func getVersion(state : State, caller : UserId, version : Id) : ?VersionView {
    if (not canReadVersion(state, caller, version)) { return null };
    switch (state.versions.get(version)) {
      case (?v) { ?versionView(v) };
      case null { null };
    };
  };

  /// List concept results for a version (R17).
  public func listConceptResults(state : State, caller : UserId, version : Id) : [ConceptResultView] {
    if (not canReadVersion(state, caller, version)) { return [] };
    state.conceptResults.values()
      .filter(func(r) { r.version == version })
      .map(resultView)
      .toArray();
  };

  // --- Growth timeline (R12) -----------------------------------------------

  /// Rank a concept status for the diff: covered is best, misconception worst.
  func statusRank(s : ConceptStatus) : Nat {
    switch s {
      case (#covered) { 3 };
      case (#partial) { 2 };
      case (#missing) { 1 };
      case (#misconception) { 0 };
    };
  };

  /// Growth timeline + before/after concept diff across a submission's versions (R12).
  public func getGrowthTimeline(state : State, caller : UserId, submission : Id) : GrowthTimeline {
    if (not canReadSubmission(state, caller, submission)) {
      return { points = []; diff = []; fixedCount = 0 };
    };
    let ordered = state.versions.values()
      .filter(func(v) { v.submission == submission })
      .toArray()
      .sort(func(x, y) { Nat.compare(x.versionNo, y.versionNo) });

    let points = ordered.map(
      func(v) { { versionNo = v.versionNo; coveragePct = v.coveragePct; createdAt = v.createdAt } }
    );

    // Diff between the latest two versions, when both exist.
    var diff : [ConceptDiffEntry] = [];
    var fixedCount = 0;
    if (ordered.size() >= 2) {
      let prev = ordered[ordered.size() - 2];
      let curr = ordered[ordered.size() - 1];
      let prevResults = state.conceptResults.values()
        .filter(func(r) { r.version == prev.id })
        .toArray();
      let currResults = state.conceptResults.values()
        .filter(func(r) { r.version == curr.id })
        .toArray();
      let entries = currResults.map(
        func(cr) {
          let fromStatus = switch (prevResults.find(func(pr) { pr.concept == cr.concept })) {
            case (?pr) { pr.status };
            case null { #missing };
          };
          let name = switch (state.concepts.get(cr.concept)) {
            case (?c) { c.name };
            case null { "" };
          };
          let improved = statusRank(cr.status) > statusRank(fromStatus);
          {
            concept = cr.concept;
            conceptName = name;
            fromStatus;
            toStatus = cr.status;
            improved;
          };
        }
      );
      diff := entries;
      fixedCount := entries.filter(
        func(e) {
          let wasUncovered = switch (e.fromStatus) {
            case (#covered) { false };
            case _ { true };
          };
          wasUncovered and e.toStatus == #covered;
        }
      ).size();
    };

    { points; diff; fixedCount };
  };

  // --- Submission lifecycle + teacher override -----------------------------

  /// Mark a submission as submitted to the teacher (R12).
  public func submitToTeacher(state : State, caller : UserId, submission : Id) : () {
    let ?s = state.submissions.get(submission) else {
      Runtime.trap("notFound: no such submission");
    };
    if (s.student != caller) {
      Runtime.trap("notAuthorized: only the student may submit this work");
    };
    state.submissions.add(submission, { s with status = #submitted; updatedAt = Time.now() });
  };

  /// Teacher override of one AI judgement (R19).
  public func overrideConceptResult(state : State, caller : UserId, result : Id, status : OverrideStatus, comment : ?Text) : () {
    let ?r = state.conceptResults.get(result) else {
      Runtime.trap("notFound: no such concept result");
    };
    let ?v = state.versions.get(r.version) else {
      Runtime.trap("notFound: no such version");
    };
    let ?s = state.submissions.get(v.submission) else {
      Runtime.trap("notFound: no such submission");
    };
    let ?a = state.assignments.get(s.assignment) else {
      Runtime.trap("notFound: no such assignment");
    };
    if (a.teacher != caller) {
      Runtime.trap("notAuthorized: only the assignment's teacher may override a judgement");
    };
    state.conceptResults.add(result, { r with teacherOverrideStatus = status; teacherComment = comment });
  };

  /// List submissions for one of the caller teacher's assignments (R17).
  public func listAssignmentSubmissions(state : State, caller : UserId, assignment : Id) : [SubmissionView] {
    switch (state.assignments.get(assignment)) {
      case (?a) {
        if (a.teacher != caller) { return [] };
      };
      case null { return [] };
    };
    state.submissions.values()
      .filter(func(s) { s.assignment == assignment })
      .map(submissionView)
      .toArray();
  };

  // --- OQL entities (R16, R17) ---------------------------------------------

  /// Parse a Nat column value delivered to an OQL owner check.
  func asNat(value : OQL.Value) : ?Nat {
    switch value {
      case (#nat n) { ?n };
      case (#int i) { if (i < 0) null else ?i.toNat() };
      case _ { null };
    };
  };

  /// Whether a scoped caller may read the assignment row it owns.
  func canSeeAssignment(state : State, caller : Principal, owner : OQL.Value) : Bool {
    switch (asNat(owner)) {
      case (?id) { canReadAssignment(state, caller, id) };
      case null { false };
    };
  };

  /// Whether a scoped caller may read the submission row it owns.
  func canSeeSubmission(state : State, caller : Principal, owner : OQL.Value) : Bool {
    switch (asNat(owner)) {
      case (?id) { canReadSubmission(state, caller, id) };
      case null { false };
    };
  };

  /// Whether a scoped caller may read the version row it owns.
  func canSeeVersion(state : State, caller : Principal, owner : OQL.Value) : Bool {
    switch (asNat(owner)) {
      case (?id) { canReadVersion(state, caller, id) };
      case null { false };
    };
  };

  /// Whether a scoped caller may read the concept-result row it owns.
  func canSeeResult(state : State, caller : Principal, owner : OQL.Value) : Bool {
    switch (asNat(owner)) {
      case (?id) { canReadResult(state, caller, id) };
      case null { false };
    };
  };

  /// Whether a scoped caller may read the concept row it owns.
  func canSeeConcept(state : State, caller : Principal, owner : OQL.Value) : Bool {
    switch (asNat(owner)) {
      case (?id) { canReadAssignment(state, caller, id) };
      case null { false };
    };
  };

  /// OQL entity declarations for the assessment domain. The composition root
  /// registers these in its `Expose` call. Every entity is scoped so a caller
  /// reads only rows it is authorized to see (R17).
  public func entities(state : State) : [Entity.Decl] {
    [
      state.assignments.toEntity("assignment", "Assignment", "id")
        .sample({
          id = 0;
          teacher = Principal.fromText("aaaaa-aa");
          title = "";
          prompt = "";
          rubricText = "";
          createdAt = 0;
        })
        .ownedByWith("id", func(caller, owner) = canSeeAssignment(state, caller, owner))
        .controllerOrScoped()
        .build(),
      state.concepts.toEntity("concept", "Concept", "id")
        .sample({
          id = 0;
          assignment = 0;
          name = "";
          description = "";
          weight = 0.0;
          misconception = "";
        })
        .ownedByWith("assignment", func(caller, owner) = canSeeConcept(state, caller, owner))
        .controllerOrScoped()
        .build(),
      state.submissions.toEntity("submission", "Submission", "id")
        .sample({
          id = 0;
          assignment = 0;
          student = Principal.fromText("aaaaa-aa");
          status = #draft;
          createdAt = 0;
          updatedAt = 0;
        })
        .ownedByWith("id", func(caller, owner) = canSeeSubmission(state, caller, owner))
        .controllerOrScoped()
        .build(),
      state.versions.toEntity("version", "Version", "id")
        .sample({
          id = 0;
          submission = 0;
          versionNo = 0;
          text = "";
          coveragePct = 0.0;
          createdAt = 0;
        })
        .ownedByWith("submission", func(caller, owner) = canSeeVersion(state, caller, owner))
        .controllerOrScoped()
        .build(),
      state.conceptResults.toEntity("conceptResult", "ConceptResult", "id")
        .sample({
          id = 0;
          version = 0;
          concept = 0;
          status = #missing;
          evidenceQuote = ?"";
          nudge = "";
          confidence = 0.0;
          teacherOverrideStatus = #none;
          teacherComment = ?"";
        })
        .ownedByWith("version", func(caller, owner) = canSeeResult(state, caller, owner))
        .controllerOrScoped()
        .build(),
    ];
  };
};
