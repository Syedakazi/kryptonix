import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserApproval "mo:caffeineai-user-approval/approval";

import Common "../types/common";
import Identity "../types/identity";

module {
  public type UserId = Common.UserId;
  public type AppRole = Common.AppRole;
  public type ApprovalState = Common.ApprovalState;
  public type Profile = Identity.Profile;
  public type ProfileView = Identity.ProfileView;
  public type ApprovalRequest = Identity.ApprovalRequest;
  public type ApprovalRequestView = Identity.ApprovalRequestView;
  public type AccessStatus = Identity.AccessStatus;

  /// Shared mutable state the identity domain reads and writes.
  public type State = {
    profiles : Map.Map<UserId, Profile>;
    approvalRequests : Map.Map<UserId, ApprovalRequest>;
    counters : { var nextId : Common.Id };
  };

  func toProfileView(p : Profile) : ProfileView {
    { id = p.id; role = p.role; name = p.name; createdAt = p.createdAt };
  };

  func toApprovalView(a : ApprovalRequest) : ApprovalRequestView {
    {
      user = a.user;
      role = a.role;
      name = a.name;
      state = a.state;
      requestedAt = a.requestedAt;
      decidedAt = a.decidedAt;
    };
  };

  /// Map the app role onto the authorization extension's role. Teachers are admins.
  func toUserRole(role : AppRole) : AccessControl.UserRole {
    switch (role) {
      case (#teacher) { #admin };
      case (#student) { #user };
    };
  };

  /// Map an approval state onto the user-approval extension's status.
  func toApprovalStatus(state : ApprovalState) : UserApproval.ApprovalStatus {
    switch (state) {
      case (#pending) { #pending };
      case (#approved) { #approved };
      case (#rejected) { #rejected };
    };
  };

  /// Register the caller's profile with a chosen role; creates a pending approval (R2).
  public func registerProfile(
    state : State,
    accessControlState : AccessControl.AccessControlState,
    approvalState : UserApproval.UserApprovalState,
    caller : UserId,
    role : AppRole,
    name : Text,
  ) : () {
    if (caller.isAnonymous()) {
      Runtime.trap("notAuthorized: sign-in required to register a profile");
    };
    if (state.profiles.containsKey(caller)) {
      Runtime.trap("invalidInput: profile already registered");
    };
    let now = Time.now();
    let profile : Profile = {
      id = caller;
      role;
      name;
      createdAt = now;
    };
    state.profiles.add(caller, profile);

    let request : ApprovalRequest = {
      user = caller;
      role;
      name;
      state = #pending;
      requestedAt = now;
      decidedAt = null;
    };
    state.approvalRequests.add(caller, request);

    // Mirror the role into the authorization extension and open a pending
    // approval entry so the user-approval extension stays the source of truth.
    AccessControl.assignRole(accessControlState, caller, caller, toUserRole(role));
    UserApproval.setApproval(approvalState, caller, #pending);
  };

  /// Read the caller's profile, if registered.
  public func getProfile(state : State, caller : UserId) : ?ProfileView {
    switch (state.profiles.get(caller)) {
      case (?p) { ?toProfileView(p) };
      case null { null };
    };
  };

  /// Update the caller's display name.
  public func updateProfileName(state : State, caller : UserId, name : Text) : () {
    switch (state.profiles.get(caller)) {
      case (?p) {
        state.profiles.add(caller, { p with name });
        switch (state.approvalRequests.get(caller)) {
          case (?a) { state.approvalRequests.add(caller, { a with name }) };
          case null {};
        };
      };
      case null {
        Runtime.trap("notFound: no profile registered for caller");
      };
    };
  };

  /// Combined registration/approval/role status for the caller.
  public func getAccessStatus(state : State, caller : UserId) : AccessStatus {
    switch (state.profiles.get(caller)) {
      case (?p) {
        let approved = switch (state.approvalRequests.get(caller)) {
          case (?a) { a.state == #approved };
          case null { false };
        };
        { registered = true; approved; role = ?p.role; name = ?p.name };
      };
      case null {
        { registered = false; approved = false; role = null; name = null };
      };
    };
  };

  /// List all approval requests (admin only).
  public func listApprovalRequests(
    state : State,
    accessControlState : AccessControl.AccessControlState,
    caller : UserId,
  ) : [ApprovalRequestView] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("notAuthorized: only an admin may list approval requests");
    };
    state.approvalRequests.values().map(toApprovalView).toArray();
  };

  /// Approve or reject a pending account (admin only).
  public func decideApproval(
    state : State,
    accessControlState : AccessControl.AccessControlState,
    approvalState : UserApproval.UserApprovalState,
    caller : UserId,
    user : UserId,
    decision : ApprovalState,
  ) : () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("notAuthorized: only an admin may decide approval requests");
    };
    switch (state.approvalRequests.get(user)) {
      case (?a) {
        state.approvalRequests.add(user, { a with state = decision; decidedAt = ?Time.now() });
        UserApproval.setApproval(approvalState, user, toApprovalStatus(decision));
      };
      case null {
        Runtime.trap("notFound: no approval request for that user");
      };
    };
  };

  /// Whether the caller is an approved member.
  public func isApproved(state : State, caller : UserId) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (state.approvalRequests.get(caller)) {
      case (?a) { a.state == #approved };
      case null { false };
    };
  };
};
