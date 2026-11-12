import Common "../types/common";
import Assessment "../types/assessment";
import AssessmentLib "../lib/assessment";

mixin (state : AssessmentLib.State) {
  public type Id = Common.Id;
  public type OverrideStatus = Common.OverrideStatus;
  public type AssignmentView = Assessment.AssignmentView;
  public type ConceptView = Assessment.ConceptView;
  public type SubmissionView = Assessment.SubmissionView;
  public type VersionView = Assessment.VersionView;
  public type ConceptResultView = Assessment.ConceptResultView;
  public type AssignedTask = Assessment.AssignedTask;
  public type GrowthTimeline = Assessment.GrowthTimeline;

  /// Create an assignment (teacher only).
  public shared ({ caller }) func createAssignment(title : Text, prompt : Text, rubricText : Text) : async Id {
    AssessmentLib.createAssignment(state, caller, title, prompt, rubricText);
  };

  /// List the caller teacher's assignments.
  public query ({ caller }) func listTeacherAssignments() : async [AssignmentView] {
    AssessmentLib.listTeacherAssignments(state, caller);
  };

  /// Read one assignment the caller may see (R17).
  public query ({ caller }) func getAssignment(assignment : Id) : async ?AssignmentView {
    AssessmentLib.getAssignment(state, caller, assignment);
  };

  /// Add a concept to an assignment (teacher only).
  public shared ({ caller }) func addConcept(assignment : Id, name : Text, description : Text, weight : Float, misconception : Text) : async Id {
    AssessmentLib.addConcept(state, caller, assignment, name, description, weight, misconception);
  };

  /// List an assignment's concepts (R17).
  public query ({ caller }) func listConcepts(assignment : Id) : async [ConceptView] {
    AssessmentLib.listConcepts(state, caller, assignment);
  };

  /// List the caller student's assigned tasks (R9, R17).
  public query ({ caller }) func listAssignedTasks() : async [AssignedTask] {
    AssessmentLib.listAssignedTasks(state, caller);
  };

  /// Get or create the caller's submission for an assignment (R17).
  public shared ({ caller }) func getOrCreateSubmission(assignment : Id) : async SubmissionView {
    AssessmentLib.getOrCreateSubmission(state, caller, assignment);
  };

  /// List the caller's versions for a submission (R12).
  public query ({ caller }) func listVersions(submission : Id) : async [VersionView] {
    AssessmentLib.listVersions(state, caller, submission);
  };

  /// Read one version the caller may see (R17).
  public query ({ caller }) func getVersion(version : Id) : async ?VersionView {
    AssessmentLib.getVersion(state, caller, version);
  };

  /// List concept results for a version (R17).
  public query ({ caller }) func listConceptResults(version : Id) : async [ConceptResultView] {
    AssessmentLib.listConceptResults(state, caller, version);
  };

  /// Growth timeline + concept diff across a submission's versions (R12).
  public query ({ caller }) func getGrowthTimeline(submission : Id) : async GrowthTimeline {
    AssessmentLib.getGrowthTimeline(state, caller, submission);
  };

  /// Submit the caller's submission to the teacher (R12).
  public shared ({ caller }) func submitToTeacher(submission : Id) : async () {
    AssessmentLib.submitToTeacher(state, caller, submission);
  };

  /// Teacher override of one AI judgement (R19).
  public shared ({ caller }) func overrideConceptResult(result : Id, status : OverrideStatus, comment : ?Text) : async () {
    AssessmentLib.overrideConceptResult(state, caller, result, status, comment);
  };

  /// List submissions for one of the caller teacher's assignments (R17).
  public query ({ caller }) func listAssignmentSubmissions(assignment : Id) : async [SubmissionView] {
    AssessmentLib.listAssignmentSubmissions(state, caller, assignment);
  };
};
