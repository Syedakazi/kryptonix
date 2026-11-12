import Common "../types/common";
import Identity "../types/identity";
import IdentityLib "../lib/identity";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserApproval "mo:caffeineai-user-approval/approval";
import Principal "mo:core/Principal";

mixin (
  state : IdentityLib.State,
  accessControlState : AccessControl.AccessControlState,
  approvalState : UserApproval.UserApprovalState,
) {
  public type AppRole = Common.AppRole;
  public type ApprovalState = Common.ApprovalState;
  public type ProfileView = Identity.ProfileView;
  public type ApprovalRequestView = Identity.ApprovalRequestView;
  public type AccessStatus = Identity.AccessStatus;

  /// Register the caller with a chosen Teacher/Student role (R2). Signed-in only.
  public shared ({ caller }) func registerProfile(role : AppRole, name : Text) : async () {
    IdentityLib.registerProfile(state, accessControlState, approvalState, caller, role, name);
  };

  /// Read the caller's own profile.
  public query ({ caller }) func getMyProfile() : async ?ProfileView {
    IdentityLib.getProfile(state, caller);
  };

  /// Update the caller's display name.
  public shared ({ caller }) func updateProfileName(name : Text) : async () {
    IdentityLib.updateProfileName(state, caller, name);
  };

  /// Registration + approval + role status for the caller (R2).
  public query ({ caller }) func getAccessStatus() : async AccessStatus {
    IdentityLib.getAccessStatus(state, caller);
  };

  /// List pending/all approval requests (admin only).
  public query ({ caller }) func listApprovalRequests() : async [ApprovalRequestView] {
    IdentityLib.listApprovalRequests(state, accessControlState, caller);
  };

  /// Approve or reject an account (admin only).
  public shared ({ caller }) func decideApproval(user : Principal, decision : ApprovalState) : async () {
    IdentityLib.decideApproval(state, accessControlState, approvalState, caller, user, decision);
  };
};
