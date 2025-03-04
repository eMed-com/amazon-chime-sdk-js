export default interface PartialOrd {
    /**
     * Compare this value to another, returning a relative value as documented by
     * [`Array.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description)
     *
     * @param other the value against which to compare.
     */
    partialCompare(other: this): number;
}
