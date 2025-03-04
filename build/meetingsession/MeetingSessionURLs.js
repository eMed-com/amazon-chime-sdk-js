"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[MeetingSessionURLs]] contains the URLs that will be used to reach the
 * meeting service.
 */
class MeetingSessionURLs {
    constructor() {
        /**
         * The audio host URL of the session
         */
        this._audioHostURL = null;
        /**
         * The screen data URL of the session
         */
        this._screenDataURL = null;
        /**
         * The screen sharing URL of the session
         */
        this._screenSharingURL = null;
        /**
         * The screen viewing URL of the session
         */
        this._screenViewingURL = null;
        /**
         * The signaling URL of the session
         */
        this._signalingURL = null;
        /**
         * The TURN control URL of the session
         */
        this._turnControlURL = null;
        /**
         * Function to transform URLs. Use this to rewrite URLs to traverse proxies.
         * The default implementation returns the original URL unchanged.
         */
        this.urlRewriter = (url) => {
            return url;
        };
    }
    /**
     * Gets or sets the audio host URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get audioHostURL() {
        return this.urlRewriter(this._audioHostURL);
    }
    set audioHostURL(value) {
        this._audioHostURL = value;
    }
    /**
     * Gets or sets the screen data URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get screenDataURL() {
        return this.urlRewriter(this._screenDataURL);
    }
    set screenDataURL(value) {
        this._screenDataURL = value;
    }
    /**
     * Gets or sets the screen sharing URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get screenSharingURL() {
        return this.urlRewriter(this._screenSharingURL);
    }
    set screenSharingURL(value) {
        this._screenSharingURL = value;
    }
    /**
     * Gets or sets the screen viewing URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get screenViewingURL() {
        return this.urlRewriter(this._screenViewingURL);
    }
    set screenViewingURL(value) {
        this._screenViewingURL = value;
    }
    /**
     * Gets or sets the signaling URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get signalingURL() {
        return this.urlRewriter(this._signalingURL);
    }
    set signalingURL(value) {
        this._signalingURL = value;
    }
    /**
     * Gets or sets the TURN control URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get turnControlURL() {
        return this.urlRewriter(this._turnControlURL);
    }
    set turnControlURL(value) {
        this._turnControlURL = value;
    }
}
exports.default = MeetingSessionURLs;
//# sourceMappingURL=MeetingSessionURLs.js.map