import Debug "mo:core/Debug";
import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type Id = Common.Id;
  public type MarginNoteType = Common.MarginNoteType;

  /// A reading stored for a student (R16).
  public type Reading = {
    id : Id;
    student : UserId;
    title : Text;
    content : Text;
    createdAt : Timestamp;
  };

  public type ReadingView = {
    id : Id;
    student : UserId;
    title : Text;
    content : Text;
    createdAt : Timestamp;
  };

  /// A margin note anchored in a reading (R16).
  public type MarginNote = {
    id : Id;
    reading : Id;
    noteType : MarginNoteType;
    anchorText : Text;
    question : Text;
    studentResponse : ?Text;
    createdAt : Timestamp;
  };

  public type MarginNoteView = {
    id : Id;
    reading : Id;
    noteType : MarginNoteType;
    anchorText : Text;
    question : Text;
    studentResponse : ?Text;
    createdAt : Timestamp;
  };

  /// A reading evaluation with JSON-encoded scores and feedback (R16).
  public type ReadingEvaluation = {
    id : Id;
    reading : Id;
    scoresJson : Text;
    feedbackJson : Text;
    createdAt : Timestamp;
  };

  public type ReadingEvaluationView = {
    id : Id;
    reading : Id;
    scoresJson : Text;
    feedbackJson : Text;
    createdAt : Timestamp;
  };
};
