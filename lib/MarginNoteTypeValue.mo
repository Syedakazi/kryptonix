/// OQL implicit instance: MarginNoteType -> Value (tag text).
import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : { #question; #highlight; #summary }) : OQL.Value =
    #text(
      switch self {
        case (#question) { "question" };
        case (#highlight) { "highlight" };
        case (#summary) { "summary" };
      }
    );
};
