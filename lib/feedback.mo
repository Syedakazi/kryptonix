import Common "../types/common";
import Assessment "../types/assessment";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Result "mo:core/Result";
import Json "mo:jayson/Json";
import { fromEnv } "mo:caffeineai-inference-client/Config";
import ChatApi "mo:caffeineai-inference-client/Apis/ChatApi";
import ChatCompletionRequest "mo:caffeineai-inference-client/Models/ChatCompletionRequest";
import ChatCompletionRequestMessageOneOf2 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf2";

module {
  public type UserId = Common.UserId;
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type ConceptStatus = Common.ConceptStatus;
  public type OverrideStatus = Common.OverrideStatus;
  public type AppError = Common.AppError;
  public type Assignment = Assessment.Assignment;
  public type Concept = Assessment.Concept;
  public type Submission = Assessment.Submission;
  public type Version = Assessment.Version;
  public type ConceptResult = Assessment.ConceptResult;
  public type VersionView = Assessment.VersionView;
  public type ConceptResultView = Assessment.ConceptResultView;
  public type FeedbackResult = Assessment.FeedbackResult;

  /// The mutable actor state this domain reads and writes. Passed in by the
  /// composition root so the module stays stateless (R10, R11, R12, R19).
  public type State = {
    assignments : Map.Map<Id, Assignment>;
    concepts : Map.Map<Id, Concept>;
    submissions : Map.Map<Id, Submission>;
    versions : Map.Map<Id, Version>;
    conceptResults : Map.Map<Id, ConceptResult>;
    counters : { var nextId : Id };
  };

  /// One parsed per-concept judgement from the model.
  type Judgement = {
    concept : Id;
    status : ConceptStatus;
    evidenceQuote : ?Text;
    nudge : Text;
    confidence : Float;
  };

  // --- Prompt construction -------------------------------------------------

  /// The system instruction. It states the no-answer-reveal rule (R19) and the
  /// exact JSON contract the model must answer with.
  func systemPrompt() : Text {
    "You are a Socratic tutor grading a student's written answer against a concept graph. " #
    "For every concept, judge how well the student's answer covers it. " #
    "CRITICAL RULE: never reveal, state, or paraphrase the correct answer or the concept's full explanation. " #
    "Your nudge must be a single guiding question that helps the student think further without giving the answer away. " #
    "Respond with ONLY a JSON object, no prose, in exactly this shape: " #
    "{\"results\":[{\"conceptId\":<number>,\"status\":\"covered\"|\"partial\"|\"missing\"|\"misconception\"," #
    "\"evidenceQuote\":<string or null>,\"nudge\":<string>,\"confidence\":<number between 0 and 1>}]}. " #
    "evidenceQuote must be an exact substring copied verbatim from the student's answer, or null when there is no such evidence. " #
    "Return one result object for every concept listed, using its conceptId.";
  };

  /// Render the concept graph and the student's answer as the user turn.
  func userPrompt(assignment : Assignment, concepts : [Concept], answer : Text) : Text {
    let conceptLines = concepts.map(
      func(c) {
        "- conceptId " # c.id.toText() # ": " # c.name #
        " | description: " # c.description #
        " | weight: " # c.weight.toText() #
        " | common misconception: " # c.misconception
      }
    );
    "Assignment: " # assignment.title # "\n" #
    "Prompt: " # assignment.prompt # "\n" #
    "Rubric: " # assignment.rubricText # "\n\n" #
    "Concept graph:\n" # conceptLines.values().join("\n") # "\n\n" #
    "Student answer:\n" # answer;
  };

  // --- Model call ----------------------------------------------------------

  /// Call the platform inference router and return the raw assistant text.
  /// Traps only when the platform has no credentials; every other failure is
  /// surfaced to the caller as `#llmFailed` by `evaluateAnswer`.
  func callModel<system>(prompt : Text) : async* Text {
    let config = fromEnv<system>();
    let userMessage = ChatCompletionRequestMessageOneOf2.JSON.init({
      content = #string(prompt);
      role = #user;
    });
    let req = ChatCompletionRequest.JSON.init({
      messages = [#user(userMessage)];
      model = "router";
    });
    let resp = await* ChatApi.createChatCompletion(config, req);
    if (resp.choices.size() == 0) {
      return "";
    };
    resp.choices[0].message.content ?? "";
  };

  // --- JSON helpers --------------------------------------------------------

  func field(obj : Json.Json, key : Text) : ?Json.Json {
    switch obj {
      case (#Object(fields)) {
        switch (fields.find(func((k, _)) { k == key })) {
          case (?(_, value)) { ?value };
          case null { null };
        };
      };
      case _ { null };
    };
  };

  func asText(value : Json.Json) : ?Text {
    switch value {
      case (#String(text)) { ?text };
      case _ { null };
    };
  };

  func asFloat(value : Json.Json) : ?Float {
    switch value {
      case (#Number(#Float(f))) { ?f };
      case (#Number(#Int(i))) { ?i.toFloat() };
      case _ { null };
    };
  };

  func asNat(value : Json.Json) : ?Nat {
    switch value {
      case (#Number(#Int(i))) { if (i < 0) null else ?i.toNat() };
      case (#Number(#Float(f))) { if (f < 0.0) null else ?f.toInt().toNat() };
      case _ { null };
    };
  };

  func parseStatus(text : Text) : ConceptStatus {
    switch text {
      case "covered" { #covered };
      case "partial" { #partial };
      case "misconception" { #misconception };
      case _ { #missing };
    };
  };

  /// Clamp a model-reported confidence into [0, 1].
  func clampConfidence(value : Float) : Float {
    if (value < 0.0) { 0.0 } else if (value > 1.0) { 1.0 } else { value };
  };

  // --- Validation ----------------------------------------------------------

  /// A nudge that states the concept's own description would reveal the answer.
  /// Replace any such nudge with a safe generic guiding question (R19).
  func sanitizeNudge(nudge : Text, concept : Concept) : Text {
    let trimmed = nudge.trim(#predicate(func(c) { c == ' ' or c == '\n' or c == '\t' }));
    let reveals = trimmed == "" or
      (concept.description != "" and trimmed.toLower().contains(#text (concept.description.toLower()))) or
      (concept.name != "" and trimmed.toLower().contains(#text (concept.name.toLower())));
    if (reveals) {
      genericNudge(concept)
    } else if (not trimmed.contains(#char '?')) {
      // A nudge must be a question; keep the model's wording but make it one.
      trimmed # " — what makes you say that?"
    } else {
      trimmed
    };
  };

  func genericNudge(concept : Concept) : Text {
    "What does your explanation say about " # concept.name # ", and how does it work?";
  };

  /// Keep an evidence quote only when it is an exact substring of the answer.
  func validateQuote(quote : ?Text, answer : Text) : ?Text {
    switch quote {
      case (?q) {
        if (q != "" and answer.contains(#text q)) { ?q } else { null };
      };
      case null { null };
    };
  };

  // --- Coverage ------------------------------------------------------------

  /// Weight-weighted share of concepts covered, as a percentage 0-100.
  /// `covered` counts fully, `partial` counts half, everything else zero (R11).
  func coveragePct(concepts : [Concept], judgements : [Judgement]) : Float {
    var weighted = 0.0;
    var total = 0.0;
    for (concept in concepts.values()) {
      total += concept.weight;
      let factor = switch (judgements.find(func(j) { j.concept == concept.id })) {
        case (?j) {
          switch j.status {
            case (#covered) { 1.0 };
            case (#partial) { 0.5 };
            case _ { 0.0 };
          };
        };
        case null { 0.0 };
      };
      weighted += concept.weight * factor;
    };
    if (total <= 0.0) { 0.0 } else { (weighted / total) * 100.0 };
  };

  // --- Views ---------------------------------------------------------------

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

  // --- Entry point ---------------------------------------------------------

  /// Run the LLM concept-graph feedback for a student's answer and persist a new
  /// version with its concept results (R10, R11, R12, R19). Backend inference
  /// path: an HTTPS outcall inside this update call. Never traps on model
  /// failure — returns `#llmFailed` so the frontend can show an error toast.
  public func evaluateAnswer<system>(
    caller : UserId,
    submission : Id,
    text : Text,
    state : State,
  ) : async* Result.Result<FeedbackResult, AppError> {
    let ?sub = state.submissions.get(submission) else {
      return #err(#notFound);
    };
    if (sub.student != caller) {
      return #err(#notAuthorized);
    };
    let ?assignment = state.assignments.get(sub.assignment) else {
      return #err(#notFound);
    };

    let concepts = state.concepts.values().filter(
      func(c) { c.assignment == sub.assignment }
    ).toArray();

    // --- Model call (failures become #llmFailed, never a trap) ---
    let raw = try {
      await* callModel<system>(systemPrompt() # "\n\n" # userPrompt(assignment, concepts, text));
    } catch _ {
      return #err(#llmFailed("We couldn't reach the feedback service. Please try again."));
    };

    let ?parsed = Json.parse(raw) else {
      return #err(#llmFailed("The feedback service returned an unreadable response. Please try again."));
    };
    let ?resultsJson = field(parsed, "results") else {
      return #err(#llmFailed("The feedback service returned no results. Please try again."));
    };
    let resultItems = switch resultsJson {
      case (#Array(items)) { items };
      case _ { return #err(#llmFailed("The feedback service returned no results. Please try again.")); };
    };

    // --- Build one validated judgement per concept ---
    let judgements = concepts.map(
      func(concept) {
        let entry = resultItems.find(
          func(item) {
            switch (field(item, "conceptId")) {
              case (?idJson) { asNat(idJson) == ?concept.id };
              case null { false };
            };
          }
        );
        let status = switch entry {
          case (?item) {
            switch (field(item, "status")) {
              case (?s) { switch (asText(s)) { case (?t) { parseStatus(t) }; case null { #missing } } };
              case null { #missing };
            };
          };
          case null { #missing };
        };
        let quote = switch entry {
          case (?item) {
            switch (field(item, "evidenceQuote")) {
              case (?q) { asText(q) };
              case null { null };
            };
          };
          case null { null };
        };
        let nudge = switch entry {
          case (?item) {
            switch (field(item, "nudge")) {
              case (?n) { switch (asText(n)) { case (?t) { t }; case null { "" } } };
              case null { "" };
            };
          };
          case null { "" };
        };
        let confidence = switch entry {
          case (?item) {
            switch (field(item, "confidence")) {
              case (?c) { switch (asFloat(c)) { case (?f) { clampConfidence(f) }; case null { 0.0 } } };
              case null { 0.0 };
            };
          };
          case null { 0.0 };
        };
        {
          concept = concept.id;
          status;
          evidenceQuote = validateQuote(quote, text);
          nudge = sanitizeNudge(nudge, concept);
          confidence;
        }
      }
    );

    let pct = coveragePct(concepts, judgements);
    let now = Time.now();

    // --- Persist a new version ---
    let versionId = state.counters.nextId;
    state.counters.nextId := versionId + 1;
    let version : Version = {
      id = versionId;
      submission;
      versionNo = state.versions.values().filter(
        func(v) { v.submission == submission }
      ).size() + 1;
      text;
      coveragePct = pct;
      createdAt = now;
    };
    state.versions.add(versionId, version);

    // --- Persist one concept result per concept ---
    let savedResults = judgements.map(
      func(j) {
        let resultId = state.counters.nextId;
        state.counters.nextId := resultId + 1;
        let result : ConceptResult = {
          id = resultId;
          version = versionId;
          concept = j.concept;
          status = j.status;
          evidenceQuote = j.evidenceQuote;
          nudge = j.nudge;
          confidence = j.confidence;
          teacherOverrideStatus = #none;
          teacherComment = null;
        };
        state.conceptResults.add(resultId, result);
        result
      }
    );

    #ok({
      version = versionView(version);
      results = savedResults.map(resultView);
      coveragePct = pct;
    });
  };
};
