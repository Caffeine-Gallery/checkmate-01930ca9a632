import Array "mo:base/Array";
import Bool "mo:base/Bool";

import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

actor {
    // Type definition for shopping list item
    public type ShoppingItem = {
        id: Nat;
        text: Text;
        completed: Bool;
    };

    private stable var nextId: Nat = 0;
    private stable var itemEntries: [(Nat, ShoppingItem)] = [];
    
    private var items = HashMap.HashMap<Nat, ShoppingItem>(0, Nat.equal, Hash.hash);

    // Initialize items from stable storage after upgrade
    system func preupgrade() {
        itemEntries := Iter.toArray(items.entries());
    };

    system func postupgrade() {
        items := HashMap.fromIter<Nat, ShoppingItem>(itemEntries.vals(), 1, Nat.equal, Hash.hash);
    };

    // Add new item to the shopping list
    public func addItem(text: Text) : async ShoppingItem {
        let id = nextId;
        nextId += 1;
        
        let item: ShoppingItem = {
            id;
            text;
            completed = false;
        };
        
        items.put(id, item);
        return item;
    };

    // Get all items
    public query func getItems() : async [ShoppingItem] {
        return Iter.toArray(items.vals());
    };

    // Toggle item completion status
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

    // Delete an item
    public func deleteItem(id: Nat) : async Bool {
        switch (items.remove(id)) {
            case (null) { false };
            case (?_) { true };
        };
    };
}
