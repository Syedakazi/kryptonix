/// OQL implicit instance: OverrideStatus -> Value (tag text).
import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : { #none; #accepted; #overridden }) : OQL.Value =
    #text(
      switch self {
        case (#none) { "none" };
        case (#accepted) { "accepted" };
        case (#overridden) { "overridden" };
      }
    );
};
