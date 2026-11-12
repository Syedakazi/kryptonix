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
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import MarginNoteTypeValue "MarginNoteTypeValue";

import Common "../types/common";
import Reading "../types/reading";

module {
  public type UserId = Common.UserId;
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type MarginNoteType = Common.MarginNoteType;
  public type Reading = Reading.Reading;
  public type ReadingView = Reading.ReadingView;
  public type MarginNote = Reading.MarginNote;
  public type MarginNoteView = Reading.MarginNoteView;
  public type ReadingEvaluation = Reading.ReadingEvaluation;
  public type ReadingEvaluationView = Reading.ReadingEvaluationView;

  /// Shared mutable state the reading domain reads and writes. Passed in by the
  /// composition root so the module stays stateless (R16, R17).
  public type State = {
    readings : Map.Map<Id, Reading>;
    marginNotes : Map.Map<Id, MarginNote>;
    readingEvaluations : Map.Map<Id, ReadingEvaluation>;
    counters : { var nextId : Id };
  };

  // --- Views ---------------------------------------------------------------

  func readingView(r : Reading) : ReadingView {
    { id = r.id; student = r.student; title = r.title; content = r.content; createdAt = r.createdAt };
  };

  func noteView(n : MarginNote) : MarginNoteView {
    {
      id = n.id;
      reading = n.reading;
      noteType = n.noteType;
      anchorText = n.anchorText;
      question = n.question;
      studentResponse = n.studentResponse;
      createdAt = n.createdAt;
    };
  };

  func evaluationView(e : ReadingEvaluation) : ReadingEvaluationView {
    {
      id = e.id;
      reading = e.reading;
      scoresJson = e.scoresJson;
      feedbackJson = e.feedbackJson;
      createdAt = e.createdAt;
    };
  };

  // --- Access helpers (R17) ------------------------------------------------

  /// Whether `caller` owns the given reading.
  func ownsReading(state : State, caller : UserId, reading : Id) : Bool {
    switch (state.readings.get(reading)) {
      case (?r) { r.student == caller };
      case null { false };
    };
  };

  /// Whether `caller` owns the reading a margin note belongs to.
  func ownsNote(state : State, caller : UserId, note : Id) : Bool {
    switch (state.marginNotes.get(note)) {
      case (?n) { ownsReading(state, caller, n.reading) };
      case null { false };
    };
  };

  // --- Readings ------------------------------------------------------------

  /// Create a reading for the caller student (R16).
  public func createReading(state : State, caller : UserId, title : Text, content : Text) : Id {
    if (caller.isAnonymous()) {
      Runtime.trap("notAuthorized: sign-in required to create a reading");
    };
    let id = state.counters.nextId;
    state.counters.nextId := id + 1;
    let reading : Reading = {
      id;
      student = caller;
      title;
      content;
      createdAt = Time.now();
    };
    state.readings.add(id, reading);
    id;
  };

  /// List the caller's readings (R17).
  public func listReadings(state : State, caller : UserId) : [ReadingView] {
    state.readings.values()
      .filter(func(r) { r.student == caller })
      .map(readingView)
      .toArray();
  };

  /// Read one reading the caller owns (R17).
  public func getReading(state : State, caller : UserId, reading : Id) : ?ReadingView {
    if (not ownsReading(state, caller, reading)) { return null };
    switch (state.readings.get(reading)) {
      case (?r) { ?readingView(r) };
      case null { null };
    };
  };

  // --- Margin notes --------------------------------------------------------

  /// Add a margin note to a reading (R16).
  public func addMarginNote(state : State, caller : UserId, reading : Id, noteType : MarginNoteType, anchorText : Text, question : Text) : Id {
    if (not ownsReading(state, caller, reading)) {
      Runtime.trap("notAuthorized: only the reading's owner may add margin notes");
    };
    let id = state.counters.nextId;
    state.counters.nextId := id + 1;
    let note : MarginNote = {
      id;
      reading;
      noteType;
      anchorText;
      question;
      studentResponse = null;
      createdAt = Time.now();
    };
    state.marginNotes.add(id, note);
    id;
  };

  /// List margin notes for a reading (R17).
  public func listMarginNotes(state : State, caller : UserId, reading : Id) : [MarginNoteView] {
    if (not ownsReading(state, caller, reading)) { return [] };
    state.marginNotes.values()
      .filter(func(n) { n.reading == reading })
      .map(noteView)
      .toArray();
  };

  /// Record the student's response to a margin note (R16).
  public func answerMarginNote(state : State, caller : UserId, note : Id, response : Text) : () {
    if (not ownsNote(state, caller, note)) {
      Runtime.trap("notAuthorized: only the reading's owner may answer this note");
    };
    let ?n = state.marginNotes.get(note) else {
      Runtime.trap("notFound: no such margin note");
    };
    state.marginNotes.add(note, { n with studentResponse = ?response });
  };

  // --- Reading evaluations -------------------------------------------------

  /// Save a reading evaluation (R16).
  public func saveReadingEvaluation(state : State, caller : UserId, reading : Id, scoresJson : Text, feedbackJson : Text) : Id {
    if (not ownsReading(state, caller, reading)) {
      Runtime.trap("notAuthorized: only the reading's owner may save an evaluation");
    };
    let id = state.counters.nextId;
    state.counters.nextId := id + 1;
    let evaluation : ReadingEvaluation = {
      id;
      reading;
      scoresJson;
      feedbackJson;
      createdAt = Time.now();
    };
    state.readingEvaluations.add(id, evaluation);
    id;
  };

  /// List reading evaluations for a reading (R17).
  public func listReadingEvaluations(state : State, caller : UserId, reading : Id) : [ReadingEvaluationView] {
    if (not ownsReading(state, caller, reading)) { return [] };
    state.readingEvaluations.values()
      .filter(func(e) { e.reading == reading })
      .map(evaluationView)
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

  /// Whether a scoped caller may read the reading row it owns.
  func canSeeReading(state : State, caller : Principal, owner : OQL.Value) : Bool {
    switch (asNat(owner)) {
      case (?id) { ownsReading(state, caller, id) };
      case null { false };
    };
  };

  /// Whether a scoped caller may read the margin-note row it owns.
  func canSeeNote(state : State, caller : Principal, owner : OQL.Value) : Bool {
    switch (asNat(owner)) {
      case (?id) { ownsNote(state, caller, id) };
      case null { false };
    };
  };

  /// Whether a scoped caller may read the evaluation row it owns.
  func canSeeEvaluation(state : State, caller : Principal, owner : OQL.Value) : Bool {
    switch (asNat(owner)) {
      case (?id) { ownsReading(state, caller, id) };
      case null { false };
    };
  };

  /// OQL entity declarations for the reading domain. The composition root
  /// registers these in its `Expose` call. Every entity is scoped so a caller
  /// reads only its own rows (R17).
  public func entities(state : State) : [Entity.Decl] {
    [
      state.readings.toEntity("reading", "Reading", "id")
        .sample({
          id = 0;
          student = Principal.fromText("aaaaa-aa");
          title = "";
          content = "";
          createdAt = 0;
        })
        .ownedByWith("id", func(caller, owner) = canSeeReading(state, caller, owner))
        .controllerOrScoped()
        .build(),
      state.marginNotes.toEntity("marginNote", "MarginNote", "id")
        .sample({
          id = 0;
          reading = 0;
          noteType = #question;
          anchorText = "";
          question = "";
          studentResponse = ?"";
          createdAt = 0;
        })
        .ownedByWith("reading", func(caller, owner) = canSeeNote(state, caller, owner))
        .controllerOrScoped()
        .build(),
      state.readingEvaluations.toEntity("readingEvaluation", "ReadingEvaluation", "id")
        .sample({
          id = 0;
          reading = 0;
          scoresJson = "";
          feedbackJson = "";
          createdAt = 0;
        })
        .ownedByWith("reading", func(caller, owner) = canSeeEvaluation(state, caller, owner))
        .controllerOrScoped()
        .build(),
    ];
  };
};
