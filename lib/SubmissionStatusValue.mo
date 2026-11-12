/// OQL implicit instance: SubmissionStatus -> Value (tag text).
import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : { #draft; #submitted }) : OQL.Value =
    #text(
      switch self {
        case (#draft) { "draft" };
        case (#submitted) { "submitted" };
      }
    );
};
