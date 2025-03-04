import type Eq from './Eq';
import type PartialOrd from './PartialOrd';
import VideoPreference from './VideoPreference';
declare class ObjectSet<T extends Eq & PartialOrd> implements Iterable<T> {
    private items;
    constructor(items?: T[]);
    static default(): ObjectSet<VideoPreference>;
    [Symbol.iterator](): Iterator<T, T, undefined>;
    first(): T | undefined;
    add(item: T): void;
    replaceFirst(newItem: T, f: (item: T) => boolean): void;
    remove(item: T): void;
    clear(): void;
    isEmpty(): boolean;
    equals(other: this): boolean;
    has(item: T): boolean;
    some(f: (item: T) => boolean): boolean;
    clone(): ObjectSet<T>;
    sort(): void;
    modify(): SetBuilder<T>;
}
declare class SetBuilder<T extends Eq & PartialOrd> {
    private items;
    private copied;
    constructor(items?: ObjectSet<T>);
    private cow;
    add(item: T): void;
    replaceFirst(newItem: T, f: (item: T) => boolean): void;
    remove(item: T): void;
    some(f: (preference: T) => boolean): boolean;
    clear(): void;
    build(): ObjectSet<T>;
}
export declare class MutableVideoPreferences {
    private builder;
    constructor(builder: SetBuilder<VideoPreference>);
    add(pref: VideoPreference): void;
    replaceFirst(newPref: VideoPreference, f: (pref: VideoPreference) => boolean): void;
    remove(pref: VideoPreference): void;
    some(f: (preference: VideoPreference) => boolean): boolean;
    clear(): void;
    build(): VideoPreferences;
}
export declare class VideoPreferences implements Iterable<VideoPreference>, Eq {
    private items;
    static prepare(): MutableVideoPreferences;
    static default(): VideoPreferences;
    [Symbol.iterator](): Iterator<VideoPreference, VideoPreference, undefined>;
    highestPriority(): number | undefined;
    sorted(): Iterator<VideoPreference, VideoPreference, undefined>;
    equals(other: this): boolean;
    modify(): MutableVideoPreferences;
    some(f: (pref: VideoPreference) => boolean): boolean;
    isEmpty(): boolean;
}
export default VideoPreferences;
