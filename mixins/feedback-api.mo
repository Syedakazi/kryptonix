import Common "../types/common";
import Assessment "../types/assessment";
import FeedbackLib "../lib/feedback";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";

mixin (state : FeedbackLib.State) {
  public type FeedbackResult = Assessment.FeedbackResult;

  /// Send the answer + concept graph to the LLM and persist a new version with
  /// per-concept results and weighted coverage (R10, R11, R12, R19).
  /// Backend inference path: HTTPS outcall inside this update call.
  public shared ({ caller }) func getFeedback(submission : Common.Id, text : Text) : async FeedbackResult {
    let result = await* FeedbackLib.evaluateAnswer<system>(caller, submission, text, state);
    switch result {
      case (#ok(feedback)) { feedback };
      case (#err(error)) {
        switch error {
          case (#notAuthorized) { Runtime.trap("notAuthorized: only the submission's student may request feedback") };
          case (#notFound) { Runtime.trap("notFound: no such submission") };
          case (#invalidInput(message)) { Runtime.trap("invalidInput: " # message) };
          case (#notApproved) { Runtime.trap("notApproved: account is not approved") };
          case (#llmFailed(message)) { Runtime.trap("llmFailed: " # message) };
        };
      };
    };
  };
};
