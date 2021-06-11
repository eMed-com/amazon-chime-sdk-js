import DataMessage from '../datamessage/DataMessage';
import RealtimeAttendeePositionInFrame from './RealtimeAttendeePositionInFrame';
import type VolumeIndicatorCallback from './VolumeIndicatorCallback';
/**
 * [[RealtimeController]] controls aspects meetings concerning realtime UX
 * that for performance, privacy, or other reasons should be implemented using
 * the most direct path. Callbacks generated by this interface should be
 * consumed synchronously and without business logic dependent on the UI state
 * where possible. All methods are prefixed with `realtime` to make it easier to
 * perform audits of realtime control paths.
 *
 * For an example involving performance implications, consider that volume
 * indicator state is received for each attendee multiple times a second.
 * The handler that receives WebSocket messages derives which indicators have
 * updated and passes that information synchronously through the
 * RealtimeController, which in turn provides the consumer of the volume
 * indicator callbacks an opportunity to immediately render the information to
 * the UI.
 *
 * For an example involving privacy implications, consider that a mute button
 * must accurately represent the mute state as otherwise a user may think they
 * are muted when they are not. Creating a direct path from the mute button
 * to the place where the underlying media stream is disabled ensures that
 * muting is instantaneous and cannot fail.
 *
 * When you are done using a `RealtimeController`, you should perform some
 * cleanup steps in order to avoid memory leaks:
 *
 * 1. Unsubscribe from listeners; e.g., presence callbacks via
 *    {@link RealtimeController.realtimeUnsubscribeToAttendeeIdPresence}.
 * 2. Drop your reference to the controller to allow it to be garbage collected.
 */
export default interface RealtimeController {
    /**
     * Subscribes to changes in attendee ids in order to discover attendee ids to
     * subscribe and unsubscribe to for volume indicator updates.
     */
    realtimeSubscribeToAttendeeIdPresence(callback: (attendeeId: string, present: boolean, externalUserId?: string, dropped?: boolean, posInFrame?: RealtimeAttendeePositionInFrame | null) => void): void;
    /**
     * Unsubscribes to changes in attendee ids
     */
    realtimeUnsubscribeToAttendeeIdPresence(callback: (attendeeId: string, present: boolean, externalUserId?: string, dropped?: boolean, posInFrame?: RealtimeAttendeePositionInFrame | null) => void): void;
    /**
     * Sets the audio input and stores the current mute state. Any previous media
     * stream is first muted before it is replaced.
     */
    realtimeSetLocalAudioInput(audioInput: MediaStream | null): void;
    /**
     * Sets whether the user will be able to mute and then synchronously fires the
     * callbacks if can-mute state changed.
     */
    realtimeSetCanUnmuteLocalAudio(canUnmute: boolean): void;
    /**
     * Subscribes to the changes to the can unmute local audio state.
     */
    realtimeSubscribeToSetCanUnmuteLocalAudio(callback: (canUnmute: boolean) => void): void;
    /**
     * Unsubscribes to the changes to the can unmute local audio state.
     */
    realtimeUnsubscribeToSetCanUnmuteLocalAudio(callback: (canUnmute: boolean) => void): void;
    /**
     * Returns whether the user can unmute.
     */
    realtimeCanUnmuteLocalAudio(): boolean;
    /**
     * Mutes the audio input. If there is an active audio input, then a volume
     * indicator update is also sent with the mute status for the current attendee
     * id. It then synchronously notifies the callbacks if mute state
     * changed. This mute is local and overrides any remote unmuted state received
     * for the same attendee id.
     */
    realtimeMuteLocalAudio(): void;
    /**
     * Unmutes the audio input if currently allowed. If there is an active audio
     * input, then a volume indicator update is also sent with the mute status for
     * the current attendee id. It then synchronously notifies the callbacks
     * if mute state changed. This unmute is local and overrides any remote muted
     * state received for the same attendee id.
     */
    realtimeUnmuteLocalAudio(): boolean;
    /**
     * Subscribes to local audio mutes and unmutes
     */
    realtimeSubscribeToMuteAndUnmuteLocalAudio(callback: (muted: boolean) => void): void;
    /**
     * Unsubscribes to local audio mutes and unmutes
     */
    realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback: (muted: boolean) => void): void;
    /**
     * Returns whether the current user is muted.
     */
    realtimeIsLocalAudioMuted(): boolean;
    /**
     * Subscribes to volume indicator changes for a specific attendee id with a
     * callback. Volume is between 0.0 (min volume) and 1.0 (max volume).
     * Signal strength can be 0 (no signal), 0.5 (weak signal), or 1 (good signal).
     * A null value for any field means that it has not changed.
     */
    realtimeSubscribeToVolumeIndicator(attendeeId: string, callback: VolumeIndicatorCallback): void;
    /**
     * Unsubscribes to volume indicator changes for a specific attendee id.
     * Optionally, you can pass a callback parameter to unsubscribe from a specific callback.
     * Otherwise, all callbacks will be unsubscribed (e.g. activeSpeaker).
     */
    realtimeUnsubscribeFromVolumeIndicator(attendeeId: string, callback?: VolumeIndicatorCallback): void;
    /**
     * Subscribes to changes in local signal strength
     */
    realtimeSubscribeToLocalSignalStrengthChange(callback: (signalStrength: number) => void): void;
    /**
     * Unsubscribes to changes in local signal strength
     */
    realtimeUnsubscribeToLocalSignalStrengthChange(callback: (signalStrength: number) => void): void;
    /**
     * Subscribe to local send message event
     */
    realtimeSubscribeToSendDataMessage(// eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (topic: string, data: Uint8Array | string | any, lifetimeMs?: number) => void): void;
    /**
     * Unsubscribe from local send message event
     */
    realtimeUnsubscribeFromSendDataMessage(// eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (topic: string, data: Uint8Array | string | any, lifetimeMs?: number) => void): void;
    /**
     * Send message via data channel
     */
    realtimeSendDataMessage(topic: string, data: Uint8Array | string | any, // eslint-disable-line @typescript-eslint/no-explicit-any
    lifetimeMs?: number): void;
    /**
     * Subscribe to receiving message on a topic
     */
    realtimeSubscribeToReceiveDataMessage(topic: string, callback: (dataMessage: DataMessage) => void): void;
    /**
     * Unsubscribe from a message topic
     */
    realtimeUnsubscribeFromReceiveDataMessage(topic: string): void;
    /**
     * Trigger callbacks when receiving a message from data channel
     */
    realtimeReceiveDataMessage(dataMessage: DataMessage): void;
    /**
     * Subscribes to receive a callback when a fatal error is generated while
     * processing an action. Receiving this callback potentially means that it was
     * not possible to successfully mute, and so should be handled by tearing down
     * the current connection and starting over.
     */
    realtimeSubscribeToFatalError(callback: (error: Error) => void): void;
    /**
     * Unsubscribes from receiving callbacks when fatal errors occur
     */
    realtimeUnsubscribeToFatalError(callback: (error: Error) => void): void;
}
