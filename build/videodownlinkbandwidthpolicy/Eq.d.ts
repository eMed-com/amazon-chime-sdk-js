export default interface Eq {
    /**
     * Return true if the other value is exactly equal to this value.
     *
     * @param other the value against which to compare.
     */
    equals(other: this): boolean;
}
