"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoPreferences = exports.MutableVideoPreferences = void 0;
class ObjectSet {
    constructor(items = []) {
        this.items = items;
    }
    static default() {
        return new ObjectSet([]);
    }
    // Returns the items in sorted order.
    [Symbol.iterator]() {
        let i = 0;
        const items = this.items;
        return {
            next() {
                if (i < items.length) {
                    return {
                        done: false,
                        value: items[i++],
                    };
                }
                return {
                    done: true,
                    value: null,
                };
            },
        };
    }
    first() {
        return this.items[0];
    }
    add(item) {
        // If this is used elsewhere, there needs to be a duplicate check here
        this.items.push(item);
    }
    replaceFirst(newItem, f) {
        const pos = this.items.findIndex(f);
        if (pos === -1) {
            // If this is used elsewhere, there needs to be a duplicate check here
            this.items.push(newItem);
        }
        else if (!this.has(newItem)) {
            this.items[pos] = newItem;
        }
        else {
            this.items.splice(pos, 1);
        }
    }
    remove(item) {
        this.items = this.items.filter(a => !a.equals(item));
    }
    clear() {
        this.items = [];
    }
    isEmpty() {
        return this.items.length === 0;
    }
    equals(other) {
        if (other === this) {
            return true;
        }
        if (other.items.length !== this.items.length) {
            return false;
        }
        // TODO: if we keep the arrays sorted correctly, not just by priority, then
        // we don't need to do this painstaking O(n^2) work.
        for (const item of this.items) {
            if (!other.items.some(a => a.equals(item))) {
                return false;
            }
        }
        return true;
    }
    has(item) {
        return this.items.some(a => a.equals(item));
    }
    some(f) {
        return this.items.some(f);
    }
    clone() {
        return new ObjectSet([...this.items]);
    }
    sort() {
        this.items.sort((a, b) => a.partialCompare(b));
    }
    modify() {
        // COW.
        return new SetBuilder(this);
    }
}
class SetBuilder {
    constructor(items = new ObjectSet()) {
        this.items = items;
        this.copied = false;
    }
    cow() {
        if (this.copied) {
            return;
        }
        this.items = this.items.clone();
        this.copied = true;
    }
    add(item) {
        // Don't actually need to COW unless the item is there to add.
        if (this.items.has(item)) {
            return;
        }
        this.cow();
        this.items.add(item);
    }
    replaceFirst(newItem, f) {
        // Don't actually need to COW unless the item is already there
        // and there are no items to replace
        if (this.items.has(newItem) && !this.items.some(f)) {
            return;
        }
        this.cow();
        this.items.replaceFirst(newItem, f);
    }
    remove(item) {
        // Don't actually need to COW unless the item is there to remove.
        if (!this.items.has(item)) {
            return;
        }
        this.cow();
        this.items.remove(item);
    }
    some(f) {
        return this.items.some(f);
    }
    clear() {
        if (this.items.isEmpty()) {
            return;
        }
        this.cow();
        this.items.clear();
    }
    build() {
        // Immutable sets are always kept sorted!
        if (this.copied) {
            this.items.sort();
        }
        this.copied = false;
        return this.items;
    }
}
class MutableVideoPreferences {
    constructor(builder) {
        this.builder = builder;
    }
    add(pref) {
        this.builder.add(pref);
    }
    replaceFirst(newPref, f) {
        this.builder.replaceFirst(newPref, f);
    }
    remove(pref) {
        this.builder.remove(pref);
    }
    some(f) {
        return this.builder.some(f);
    }
    clear() {
        this.builder.clear();
    }
    build() {
        return new VideoPreferences(this.builder.build());
    }
}
exports.MutableVideoPreferences = MutableVideoPreferences;
class VideoPreferences {
    /** @internal */
    constructor(items) {
        this.items = items;
    }
    static prepare() {
        return new MutableVideoPreferences(new SetBuilder());
    }
    static default() {
        return new VideoPreferences(ObjectSet.default());
    }
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
    highestPriority() {
        var _a;
        return (_a = this.items.first()) === null || _a === void 0 ? void 0 : _a.priority;
    }
    // Our items happen to always be sorted!
    sorted() {
        return this.items[Symbol.iterator]();
    }
    equals(other) {
        return other === this || this.items.equals(other.items);
    }
    modify() {
        return new MutableVideoPreferences(this.items.modify());
    }
    some(f) {
        return this.items.some(f);
    }
    isEmpty() {
        return this.items.isEmpty();
    }
}
exports.VideoPreferences = VideoPreferences;
exports.default = VideoPreferences;
//# sourceMappingURL=VideoPreferences.js.map