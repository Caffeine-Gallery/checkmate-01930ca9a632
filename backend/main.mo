import Bool "mo:base/Bool";

import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";

actor {
    public type ShoppingItem = {
        id: Nat;
        text: Text;
        completed: Bool;
    };

    private stable var nextId: Nat = 0;
    private stable var itemEntries: [(Nat, ShoppingItem)] = [];
    private stable var suggestionEntries: [(Text, Nat)] = [];
    
    private var items = HashMap.HashMap<Nat, ShoppingItem>(0, Nat.equal, Hash.hash);
    private var suggestions = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);

    system func preupgrade() {
        itemEntries := Iter.toArray(items.entries());
        suggestionEntries := Iter.toArray(suggestions.entries());
    };

    system func postupgrade() {
        items := HashMap.fromIter<Nat, ShoppingItem>(itemEntries.vals(), 1, Nat.equal, Hash.hash);
        suggestions := HashMap.fromIter<Text, Nat>(suggestionEntries.vals(), 1, Text.equal, Text.hash);
    };

    public func addItem(text: Text) : async ShoppingItem {
        let id = nextId;
        nextId += 1;
        
        let item: ShoppingItem = {
            id;
            text;
            completed = false;
        };
        
        items.put(id, item);
        
        // Update suggestions
        switch (suggestions.get(text)) {
            case (null) { suggestions.put(text, 1); };
            case (?count) { suggestions.put(text, count + 1); };
        };
        
        return item;
    };

    public query func getItems() : async [ShoppingItem] {
        return Iter.toArray(items.vals());
    };

    public query func getSuggestions(input: Text) : async [Text] {
        let inputLower = Text.toLowercase(input);
        let allSuggestions = Iter.toArray(suggestions.entries());
        let filtered = Array.filter<(Text, Nat)>(allSuggestions, func((text, _)) {
            let textLower = Text.toLowercase(text);
            input == "" or Text.contains(textLower, #text inputLower)
        });
        
        // Sort by frequency and take top 5
        let sorted = Array.sort<(Text, Nat)>(filtered, func(a, b) {
            if (a.1 > b.1) { #less }
            else if (a.1 < b.1) { #greater }
            else { #equal }
        });
        
        return Array.map<(Text, Nat), Text>(
            Array.tabulate<(Text, Nat)>(
                if (sorted.size() > 5) { 5 } else { sorted.size() },
                func(i) { sorted[i] }
            ),
            func((text, _)) { text }
        );
    };

    public func toggleItem(id: Nat) : async ?ShoppingItem {
        switch (items.get(id)) {
            case (null) { null };
            case (?item) {
                let updatedItem: ShoppingItem = {
                    id = item.id;
                    text = item.text;
                    completed = not item.completed;
                };
                items.put(id, updatedItem);
                ?updatedItem
            };
        };
    };

    public func deleteItem(id: Nat) : async Bool {
        switch (items.remove(id)) {
            case (null) { false };
            case (?_) { true };
        };
    };
}
