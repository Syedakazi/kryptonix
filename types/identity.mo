import Debug "mo:core/Debug";
import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type AppRole = Common.AppRole;
  public type ApprovalState = Common.ApprovalState;

  /// Persisted profile (R16): role + display name, keyed by principal.
  public type Profile = {
    id : UserId;
    role : AppRole;
    name : Text;
    createdAt : Timestamp;
  };

  /// Shared view of a profile.
  public type ProfileView = {
    id : UserId;
    role : AppRole;
    name : Text;
    createdAt : Timestamp;
  };

  /// Approval record for a new account (R2).
  public type ApprovalRequest = {
    user : UserId;
    role : AppRole;
    name : Text;
    state : ApprovalState;
    requestedAt : Timestamp;
    decidedAt : ?Timestamp;
  };

  /// Shared view of an approval request.
  public type ApprovalRequestView = {
    user : UserId;
    role : AppRole;
    name : Text;
    state : ApprovalState;
    requestedAt : Timestamp;
    decidedAt : ?Timestamp;
  };

  /// Combined signup/access status the frontend polls after sign-in.
  public type AccessStatus = {
    registered : Bool;
    approved : Bool;
    role : ?AppRole;
    name : ?Text;
  };
};
