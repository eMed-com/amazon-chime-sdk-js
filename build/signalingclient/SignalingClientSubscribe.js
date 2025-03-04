"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[SignalingClientSubscribe]] contains settings for the Subscribe SignalFrame.
 */
class SignalingClientSubscribe {
    /** Initializes a SignalingClientSubscribe with the given properties.
     *
     * @param attendeeId Attendee ID of the client
     * @param sdpOffer SDP offer created by WebRTC
     * @param audioHost host
     * @param audioMuted Whether audio from client is muted
     * @param audioCheckin Whether audio is in checked-in state
     * @param receiveStreamIds Which video streams to receive
     * @param localVideoEnabled Whether to send a video stream for the local camera
     * @param array of local video stream description
     * @param connectionTypeHasVideo Whether connection type has video
     */
    constructor(attendeeId, sdpOffer, audioHost, audioMuted, audioCheckin, receiveStreamIds, localVideoEnabled, videoStreamDescriptions, connectionTypeHasVideo) {
        this.attendeeId = attendeeId;
        this.sdpOffer = sdpOffer;
        this.audioHost = audioHost;
        this.audioMuted = audioMuted;
        this.audioCheckin = audioCheckin;
        this.receiveStreamIds = receiveStreamIds;
        this.localVideoEnabled = localVideoEnabled;
        this.videoStreamDescriptions = videoStreamDescriptions;
        this.connectionTypeHasVideo = connectionTypeHasVideo;
    }
}
exports.default = SignalingClientSubscribe;
//# sourceMappingURL=SignalingClientSubscribe.js.map