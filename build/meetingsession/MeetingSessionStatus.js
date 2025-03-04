"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const SignalingProtocol_js_1 = require("../signalingprotocol/SignalingProtocol.js");
const MeetingSessionStatusCode_1 = require("./MeetingSessionStatusCode");
/**
 * [[MeetingSessionStatus]] indicates a status received regarding the session.
 */
class MeetingSessionStatus {
    constructor(_statusCode) {
        this._statusCode = _statusCode;
    }
    statusCode() {
        return this._statusCode;
    }
    isFailure() {
        switch (this._statusCode) {
            case MeetingSessionStatusCode_1.default.AudioAuthenticationRejected:
            case MeetingSessionStatusCode_1.default.AudioCallAtCapacity:
            case MeetingSessionStatusCode_1.default.AudioInternalServerError:
            case MeetingSessionStatusCode_1.default.AudioServiceUnavailable:
            case MeetingSessionStatusCode_1.default.AudioDisconnected:
            case MeetingSessionStatusCode_1.default.VideoCallAtSourceCapacity:
            case MeetingSessionStatusCode_1.default.SignalingBadRequest:
            case MeetingSessionStatusCode_1.default.SignalingInternalServerError:
            case MeetingSessionStatusCode_1.default.SignalingRequestFailed:
            case MeetingSessionStatusCode_1.default.StateMachineTransitionFailed:
            case MeetingSessionStatusCode_1.default.ICEGatheringTimeoutWorkaround:
            case MeetingSessionStatusCode_1.default.ConnectionHealthReconnect:
            case MeetingSessionStatusCode_1.default.RealtimeApiFailed:
            case MeetingSessionStatusCode_1.default.TaskFailed:
            case MeetingSessionStatusCode_1.default.NoAttendeePresent:
                return true;
            default:
                return false;
        }
    }
    isTerminal() {
        switch (this._statusCode) {
            case MeetingSessionStatusCode_1.default.Left:
            case MeetingSessionStatusCode_1.default.AudioJoinedFromAnotherDevice:
            case MeetingSessionStatusCode_1.default.AudioAuthenticationRejected:
            case MeetingSessionStatusCode_1.default.AudioCallAtCapacity:
            case MeetingSessionStatusCode_1.default.MeetingEnded:
            case MeetingSessionStatusCode_1.default.AudioDisconnected:
            case MeetingSessionStatusCode_1.default.TURNCredentialsForbidden:
            case MeetingSessionStatusCode_1.default.SignalingBadRequest:
            case MeetingSessionStatusCode_1.default.SignalingRequestFailed:
            case MeetingSessionStatusCode_1.default.VideoCallAtSourceCapacity:
            case MeetingSessionStatusCode_1.default.RealtimeApiFailed:
            case MeetingSessionStatusCode_1.default.AudioAttendeeRemoved:
                return true;
            default:
                return false;
        }
    }
    isAudioConnectionFailure() {
        switch (this._statusCode) {
            case MeetingSessionStatusCode_1.default.AudioAuthenticationRejected:
            case MeetingSessionStatusCode_1.default.AudioInternalServerError:
            case MeetingSessionStatusCode_1.default.AudioServiceUnavailable:
            case MeetingSessionStatusCode_1.default.StateMachineTransitionFailed:
            case MeetingSessionStatusCode_1.default.ICEGatheringTimeoutWorkaround:
            case MeetingSessionStatusCode_1.default.SignalingBadRequest:
            case MeetingSessionStatusCode_1.default.SignalingInternalServerError:
            case MeetingSessionStatusCode_1.default.SignalingRequestFailed:
            case MeetingSessionStatusCode_1.default.RealtimeApiFailed:
            case MeetingSessionStatusCode_1.default.NoAttendeePresent:
                return true;
            default:
                return false;
        }
    }
    toString() {
        switch (this._statusCode) {
            case MeetingSessionStatusCode_1.default.OK:
                return 'Everything is OK so far.';
            case MeetingSessionStatusCode_1.default.Left:
                return 'The attendee left the meeting.';
            case MeetingSessionStatusCode_1.default.AudioJoinedFromAnotherDevice:
                return 'The attendee joined from another device.';
            case MeetingSessionStatusCode_1.default.AudioDisconnectAudio:
                return 'The audio connection failed.';
            case MeetingSessionStatusCode_1.default.AudioAuthenticationRejected:
                return 'The meeting rejected the attendee.';
            case MeetingSessionStatusCode_1.default.AudioCallAtCapacity:
                return "The attendee couldn't join because the meeting was at capacity.";
            case MeetingSessionStatusCode_1.default.AudioCallEnded:
            case MeetingSessionStatusCode_1.default.TURNMeetingEnded:
            case MeetingSessionStatusCode_1.default.MeetingEnded:
                return 'The meeting ended.';
            case MeetingSessionStatusCode_1.default.AudioInternalServerError:
            case MeetingSessionStatusCode_1.default.AudioServiceUnavailable:
            case MeetingSessionStatusCode_1.default.AudioDisconnected:
                return 'The audio connection failed.';
            case MeetingSessionStatusCode_1.default.VideoCallSwitchToViewOnly:
                return "The attendee couldn't start the local video because the maximum video capacity was reached.";
            case MeetingSessionStatusCode_1.default.VideoCallAtSourceCapacity:
                return 'The connection failed due to an internal server error.';
            case MeetingSessionStatusCode_1.default.SignalingBadRequest:
            case MeetingSessionStatusCode_1.default.SignalingInternalServerError:
            case MeetingSessionStatusCode_1.default.SignalingRequestFailed:
                return 'The signaling connection failed.';
            case MeetingSessionStatusCode_1.default.StateMachineTransitionFailed:
                return 'The state transition failed.';
            case MeetingSessionStatusCode_1.default.ICEGatheringTimeoutWorkaround:
                return 'Gathering ICE candidates timed out. In Chrome, this might indicate that the browser is in a bad state after reconnecting to VPN.';
            case MeetingSessionStatusCode_1.default.ConnectionHealthReconnect:
                return 'The meeting was reconnected.';
            case MeetingSessionStatusCode_1.default.RealtimeApiFailed:
                return 'The real-time API failed. This status code might indicate that the callback you passed to the real-time API threw an exception.';
            case MeetingSessionStatusCode_1.default.TaskFailed:
                return 'The connection failed. See the error message for more details.';
            case MeetingSessionStatusCode_1.default.AudioDeviceSwitched:
                return 'The attendee chose another audio device.';
            case MeetingSessionStatusCode_1.default.IncompatibleSDP:
                return 'The connection failed due to incompatible SDP.';
            case MeetingSessionStatusCode_1.default.TURNCredentialsForbidden:
                return 'The meeting ended, or the attendee was removed.';
            case MeetingSessionStatusCode_1.default.NoAttendeePresent:
                return 'The attendee was not present.';
            case MeetingSessionStatusCode_1.default.AudioAttendeeRemoved:
                return 'The meeting ended because attendee removed.';
            /* istanbul ignore next */
            default: {
                // You get a compile-time error if you do not handle any status code.
                const exhaustiveCheck = this._statusCode;
                throw new Error(`Unhandled case: ${exhaustiveCheck}`);
            }
        }
    }
    static fromSignalFrame(frame) {
        if (frame.error && frame.error.status) {
            return this.fromSignalingStatus(frame.error.status);
        }
        else if (frame.type === SignalingProtocol_js_1.SdkSignalFrame.Type.AUDIO_STATUS) {
            if (frame.audioStatus) {
                return this.fromAudioStatus(frame.audioStatus.audioStatus);
            }
            return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.SignalingRequestFailed);
        }
        return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.OK);
    }
    static fromAudioStatus(status) {
        // TODO: Add these numbers to proto definition and reference them here.
        switch (status) {
            case 200:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.OK);
            case 301:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.AudioJoinedFromAnotherDevice);
            case 302:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.AudioDisconnectAudio);
            case 403:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.AudioAuthenticationRejected);
            case 409:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.AudioCallAtCapacity);
            case 410:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.MeetingEnded);
            case 411:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.AudioAttendeeRemoved);
            case 500:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.AudioInternalServerError);
            case 503:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.AudioServiceUnavailable);
            default:
                switch (Math.floor(status / 100)) {
                    case 2:
                        return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.OK);
                    default:
                        return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.AudioDisconnected);
                }
        }
    }
    static fromSignalingStatus(status) {
        // TODO: Add these numbers to proto definition and reference them here.
        switch (status) {
            case 206:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.VideoCallSwitchToViewOnly);
            case 509:
                return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.VideoCallAtSourceCapacity);
            default:
                switch (Math.floor(status / 100)) {
                    case 2:
                        return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.OK);
                    case 4:
                        return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.SignalingBadRequest);
                    case 5:
                        return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.SignalingInternalServerError);
                    default:
                        return new MeetingSessionStatus(MeetingSessionStatusCode_1.default.SignalingRequestFailed);
                }
        }
    }
}
exports.default = MeetingSessionStatus;
//# sourceMappingURL=MeetingSessionStatus.js.map