/// OQL implicit instance: ConceptStatus -> Value (tag text).
import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : { #covered; #partial; #missing; #misconception }) : OQL.Value =
    #text(
      switch self {
        case (#covered) { "covered" };
        case (#partial) { "partial" };
        case (#missing) { "missing" };
        case (#misconception) { "misconception" };
      }
    );
};
