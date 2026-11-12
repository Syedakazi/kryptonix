import AccessControl "mo:caffeineai-authorization/access-control";
import UserApproval "mo:caffeineai-user-approval/approval";
import Invites "mo:caffeineai-user-approval/invites";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // --- Inlined domain types (migrations must be self-contained) ---
  type UserId = Principal;
  type Timestamp = Int;
  type Id = Nat;

  type AppRole = { #teacher; #student };
  type ApprovalState = { #pending; #approved; #rejected };
  type ConceptStatus = { #covered; #partial; #missing; #misconception };
  type OverrideStatus = { #none; #accepted; #overridden };
  type SubmissionStatus = { #draft; #submitted };
  type MarginNoteType = { #question; #highlight; #summary };

  type Profile = { id : UserId; role : AppRole; name : Text; createdAt : Timestamp };
  type ApprovalRequest = {
    user : UserId;
    role : AppRole;
    name : Text;
    state : ApprovalState;
    requestedAt : Timestamp;
    decidedAt : ?Timestamp;
  };
  type Assignment = {
    id : Id;
    teacher : UserId;
    title : Text;
    prompt : Text;
    rubricText : Text;
    createdAt : Timestamp;
  };
  type Concept = {
    id : Id;
    assignment : Id;
    name : Text;
    description : Text;
    weight : Float;
    misconception : Text;
  };
  type Submission = {
    id : Id;
    assignment : Id;
    student : UserId;
    status : SubmissionStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };
  type Version = {
    id : Id;
    submission : Id;
    versionNo : Nat;
    text : Text;
    coveragePct : Float;
    createdAt : Timestamp;
  };
  type ConceptResult = {
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
  type Reading = { id : Id; student : UserId; title : Text; content : Text; createdAt : Timestamp };
  type MarginNote = {
    id : Id;
    reading : Id;
    noteType : MarginNoteType;
    anchorText : Text;
    question : Text;
    studentResponse : ?Text;
    createdAt : Timestamp;
  };
  type ReadingEvaluation = {
    id : Id;
    reading : Id;
    scoresJson : Text;
    feedbackJson : Text;
    createdAt : Timestamp;
  };

  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    approvalState : UserApproval.UserApprovalState;
    invitesState : Invites.InvitesState;
    profiles : Map.Map<UserId, Profile>;
    approvalRequests : Map.Map<UserId, ApprovalRequest>;
    assignments : Map.Map<Id, Assignment>;
    concepts : Map.Map<Id, Concept>;
    submissions : Map.Map<Id, Submission>;
    versions : Map.Map<Id, Version>;
    conceptResults : Map.Map<Id, ConceptResult>;
    readings : Map.Map<Id, Reading>;
    marginNotes : Map.Map<Id, MarginNote>;
    readingEvaluations : Map.Map<Id, ReadingEvaluation>;
    counters : { var nextId : Id };
  };

  public func migration(_ : OldActor) : NewActor {
    let accessControlState = AccessControl.initState();
    {
      accessControlState;
      approvalState = UserApproval.initState(accessControlState);
      invitesState = Invites.initState();
      profiles = Map.empty();
      approvalRequests = Map.empty();
      assignments = Map.empty();
      concepts = Map.empty();
      submissions = Map.empty();
      versions = Map.empty();
      conceptResults = Map.empty();
      readings = Map.empty();
      marginNotes = Map.empty();
      readingEvaluations = Map.empty();
      counters = { var nextId = 0 };
    };
  };
};
