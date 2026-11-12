import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinUserApproval "mo:caffeineai-user-approval/MixinUserApproval";
import MixinMemberInvites "mo:caffeineai-user-approval/MixinMemberInvites";
import UserApproval "mo:caffeineai-user-approval/approval";
import Invites "mo:caffeineai-user-approval/invites";
import Expose "mo:caffeineai-oql/Expose";
import Map "mo:core/Map";

import Common "types/common";
import Identity "types/identity";
import Assessment "types/assessment";
import Reading "types/reading";

import AssessmentLib "lib/assessment";
import ReadingLib "lib/reading";

import IdentityApi "mixins/identity-api";
import AssessmentApi "mixins/assessment-api";
import ReadingApi "mixins/reading-api";
import FeedbackApi "mixins/feedback-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // --- Authorization + approval state (R2) ---
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);
  let approvalState : UserApproval.UserApprovalState;
  include MixinUserApproval(accessControlState, approvalState);
  let invitesState : Invites.InvitesState;
  include MixinMemberInvites(accessControlState, approvalState, invitesState);

  // --- Domain state (R16) ---
  let profiles : Map.Map<Common.UserId, Identity.Profile>;
  let approvalRequests : Map.Map<Common.UserId, Identity.ApprovalRequest>;
  let assignments : Map.Map<Common.Id, Assessment.Assignment>;
  let concepts : Map.Map<Common.Id, Assessment.Concept>;
  let submissions : Map.Map<Common.Id, Assessment.Submission>;
  let versions : Map.Map<Common.Id, Assessment.Version>;
  let conceptResults : Map.Map<Common.Id, Assessment.ConceptResult>;
  let readings : Map.Map<Common.Id, Reading.Reading>;
  let marginNotes : Map.Map<Common.Id, Reading.MarginNote>;
  let readingEvaluations : Map.Map<Common.Id, Reading.ReadingEvaluation>;
  let counters : { var nextId : Common.Id };

  // --- Domain API surface ---
  include IdentityApi({ profiles; approvalRequests; counters }, accessControlState, approvalState);
  include AssessmentApi({ assignments; concepts; submissions; versions; conceptResults; counters });
  include ReadingApi({ readings; marginNotes; readingEvaluations; counters });
  include FeedbackApi({ assignments; concepts; submissions; versions; conceptResults; counters });

  // --- OQL exposure (R16, R17) ---
  // Every entity is scoped so a caller reads only rows it is authorized to see:
  // students their own submissions/readings, teachers their own assignments.
  include Expose({
    entities = AssessmentLib.entities({ assignments; concepts; submissions; versions; conceptResults; counters })
      .concat(ReadingLib.entities({ readings; marginNotes; readingEvaluations; counters }));
  });

  // --- Behavioral API documentation ---
  include ApiDocMixin();
};
