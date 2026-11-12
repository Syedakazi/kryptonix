import Debug "mo:core/Debug";
import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type Id = Common.Id;
  public type ConceptStatus = Common.ConceptStatus;
  public type OverrideStatus = Common.OverrideStatus;
  public type SubmissionStatus = Common.SubmissionStatus;

  /// Assignment authored by a teacher (R16).
  public type Assignment = {
    id : Id;
    teacher : UserId;
    title : Text;
    prompt : Text;
    rubricText : Text;
    createdAt : Timestamp;
  };

  public type AssignmentView = {
    id : Id;
    teacher : UserId;
    title : Text;
    prompt : Text;
    rubricText : Text;
    createdAt : Timestamp;
  };

  /// Concept in an assignment's concept graph (R16).
  public type Concept = {
    id : Id;
    assignment : Id;
    name : Text;
    description : Text;
    weight : Float;
    misconception : Text;
  };

  public type ConceptView = {
    id : Id;
    assignment : Id;
    name : Text;
    description : Text;
    weight : Float;
    misconception : Text;
  };

  /// A student's submission for an assignment (R16).
  public type Submission = {
    id : Id;
    assignment : Id;
    student : UserId;
    status : SubmissionStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type SubmissionView = {
    id : Id;
    assignment : Id;
    student : UserId;
    status : SubmissionStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// One saved revision of a submission (R12, R16).
  public type Version = {
    id : Id;
    submission : Id;
    versionNo : Nat;
    text : Text;
    coveragePct : Float;
    createdAt : Timestamp;
  };

  public type VersionView = {
    id : Id;
    submission : Id;
    versionNo : Nat;
    text : Text;
    coveragePct : Float;
    createdAt : Timestamp;
  };

  /// Per-concept AI judgement for a version (R10, R16, R19).
  public type ConceptResult = {
    id : Id;
    version : Id;
    concept : Id;
    status : ConceptStatus;
    evidenceQuote : ?Text;
    nudge : Text;
    confidence : Float;
    teacherOverrideStatus : OverrideStatus;
    teacherComment : ?Text;
  };

  public type ConceptResultView = {
    id : Id;
    version : Id;
    concept : Id;
    status : ConceptStatus;
    evidenceQuote : ?Text;
    nudge : Text;
    confidence : Float;
    teacherOverrideStatus : OverrideStatus;
    teacherComment : ?Text;
  };

  /// Result of one "Get Feedback" call: per-concept results + weighted coverage (R10, R11).
  public type FeedbackResult = {
    version : VersionView;
    results : [ConceptResultView];
    coveragePct : Float;
  };

  /// One point on the Growth Timeline (R12).
  public type GrowthPoint = {
    versionNo : Nat;
    coveragePct : Float;
    createdAt : Timestamp;
  };

  /// Before/after concept diff between two versions (R12).
  public type ConceptDiffEntry = {
    concept : Id;
    conceptName : Text;
    fromStatus : ConceptStatus;
    toStatus : ConceptStatus;
    improved : Bool;
  };

  public type GrowthTimeline = {
    points : [GrowthPoint];
    diff : [ConceptDiffEntry];
    fixedCount : Nat;
  };

  /// A student's assigned task row for the dashboard (R9).
  public type AssignedTask = {
    assignment : AssignmentView;
    submission : ?SubmissionView;
    latestCoveragePct : ?Float;
  };
};
