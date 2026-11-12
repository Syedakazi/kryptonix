import Debug "mo:core/Debug";

module {
  /// Signed-in caller identity. Every persisted owner/author field is a Principal.
  public type UserId = Principal;

  /// Nanosecond timestamp from Time.now() (signed Int).
  public type Timestamp = Int;

  /// Monotonic per-entity identifier.
  public type Id = Nat;

  /// Role chosen at signup. Mirrors the authorization extension's UserRole.
  public type AppRole = {
    #teacher;
    #student;
  };

  /// Approval lifecycle for a new account (R2).
  public type ApprovalState = {
    #pending;
    #approved;
    #rejected;
  };

  /// Per-concept judgement status returned by the LLM (R10).
  public type ConceptStatus = {
    #covered;
    #partial;
    #missing;
    #misconception;
  };

  /// Teacher override of an AI judgement (R19).
  public type OverrideStatus = {
    #none;
    #accepted;
    #overridden;
  };

  /// Submission lifecycle (R12).
  public type SubmissionStatus = {
    #draft;
    #submitted;
  };

  /// Margin note kind for Reading Mode (R16).
  public type MarginNoteType = {
    #question;
    #highlight;
    #summary;
  };

  /// Shared error variant for all domain mutations.
  public type AppError = {
    #notAuthorized;
    #notFound;
    #invalidInput : Text;
    #notApproved;
    #llmFailed : Text;
  };
};
