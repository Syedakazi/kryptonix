import Common "../types/common";
import Reading "../types/reading";
import ReadingLib "../lib/reading";

mixin (state : ReadingLib.State) {
  public type MarginNoteType = Common.MarginNoteType;
  public type ReadingView = Reading.ReadingView;
  public type MarginNoteView = Reading.MarginNoteView;
  public type ReadingEvaluationView = Reading.ReadingEvaluationView;

  /// Create a reading for the caller student (R16).
  public shared ({ caller }) func createReading(title : Text, content : Text) : async Common.Id {
    ReadingLib.createReading(state, caller, title, content);
  };

  /// List the caller's readings (R17).
  public query ({ caller }) func listReadings() : async [ReadingView] {
    ReadingLib.listReadings(state, caller);
  };

  /// Read one reading the caller owns (R17).
  public query ({ caller }) func getReading(reading : Common.Id) : async ?ReadingView {
    ReadingLib.getReading(state, caller, reading);
  };

  /// Add a margin note to a reading (R16).
  public shared ({ caller }) func addMarginNote(reading : Common.Id, noteType : MarginNoteType, anchorText : Text, question : Text) : async Common.Id {
    ReadingLib.addMarginNote(state, caller, reading, noteType, anchorText, question);
  };

  /// List margin notes for a reading (R17).
  public query ({ caller }) func listMarginNotes(reading : Common.Id) : async [MarginNoteView] {
    ReadingLib.listMarginNotes(state, caller, reading);
  };

  /// Record the student's response to a margin note (R16).
  public shared ({ caller }) func answerMarginNote(note : Common.Id, response : Text) : async () {
    ReadingLib.answerMarginNote(state, caller, note, response);
  };

  /// Save a reading evaluation (R16).
  public shared ({ caller }) func saveReadingEvaluation(reading : Common.Id, scoresJson : Text, feedbackJson : Text) : async Common.Id {
    ReadingLib.saveReadingEvaluation(state, caller, reading, scoresJson, feedbackJson);
  };

  /// List reading evaluations for a reading (R17).
  public query ({ caller }) func listReadingEvaluations(reading : Common.Id) : async [ReadingEvaluationView] {
    ReadingLib.listReadingEvaluations(state, caller, reading);
  };
};
