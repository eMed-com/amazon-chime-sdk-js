import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import ExtendedBrowserBehavior from '../browserbehavior/ExtendedBrowserBehavior';
import type { Destroyable } from '../destroyable/Destroyable';
import DeviceChangeObserver from '../devicechangeobserver/DeviceChangeObserver';
import Logger from '../logger/Logger';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import AudioInputDevice from './AudioInputDevice';
import Device from './Device';
import RemovableAnalyserNode from './RemovableAnalyserNode';
import VideoInputDevice from './VideoInputDevice';
import VideoQualitySettings from './VideoQualitySettings';
export default class DefaultDeviceController implements DeviceControllerBasedMediaStreamBroker, Destroyable {
    private logger;
    private browserBehavior;
    private static permissionDeniedOriginDetectionThresholdMs;
    private static defaultVideoWidth;
    private static defaultVideoHeight;
    private static defaultVideoFrameRate;
    private static defaultVideoMaxBandwidthKbps;
    private static defaultSampleRate;
    private static defaultSampleSize;
    private static defaultChannelCount;
    private static audioContext;
    private deviceInfoCache;
    private transform;
    private activeDevices;
    private chosenVideoTransformDevice;
    private audioOutputDeviceId;
    private deviceChangeObservers;
    private boundAudioVideoController;
    private deviceLabelTrigger;
    private audioInputDestinationNode;
    private audioInputSourceNode;
    private mediaDeviceWrapper;
    private onDeviceChangeCallback?;
    private muteCallback;
    private videoInputQualitySettings;
    private readonly useWebAudio;
    private inputDeviceCount;
    private lastNoVideoInputDeviceCount;
    constructor(logger: Logger, options?: {
        enableWebAudio?: boolean;
    }, browserBehavior?: ExtendedBrowserBehavior);
    private isWatchingForDeviceChanges;
    private ensureWatchingDeviceChanges;
    /**
     * Unsubscribe from the `devicechange` event, which allows the device controller to
     * update its device cache.
     */
    private stopWatchingDeviceChanges;
    private shouldObserveDeviceChanges;
    private watchForDeviceChangesIfNecessary;
    destroy(): Promise<void>;
    listAudioInputDevices(): Promise<MediaDeviceInfo[]>;
    listVideoInputDevices(): Promise<MediaDeviceInfo[]>;
    listAudioOutputDevices(): Promise<MediaDeviceInfo[]>;
    private pushAudioMeetingStateForPermissions;
    private pushVideoMeetingStateForPermissions;
    chooseAudioInputDevice(device: AudioInputDevice): Promise<void>;
    private chooseAudioTransformInputDevice;
    private chooseVideoTransformInputDevice;
    chooseVideoInputDevice(device: VideoInputDevice): Promise<void>;
    chooseAudioOutputDevice(deviceId: string | null): Promise<void>;
    addDeviceChangeObserver(observer: DeviceChangeObserver): void;
    removeDeviceChangeObserver(observer: DeviceChangeObserver): void;
    createAnalyserNodeForAudioInput(): RemovableAnalyserNode | null;
    createAnalyserNodeForRawAudioInput(): RemovableAnalyserNode | null;
    private createAnalyserNodeForStream;
    startVideoPreviewForVideoInput(element: HTMLVideoElement): void;
    stopVideoPreviewForVideoInput(element: HTMLVideoElement): void;
    setDeviceLabelTrigger(trigger: () => Promise<MediaStream>): void;
    mixIntoAudioInput(stream: MediaStream): MediaStreamAudioSourceNode;
    chooseVideoInputQuality(width: number, height: number, frameRate: number, maxBandwidthKbps: number): void;
    getVideoInputQualitySettings(): VideoQualitySettings | null;
    acquireAudioInputStream(): Promise<MediaStream>;
    acquireVideoInputStream(): Promise<MediaStream>;
    acquireDisplayInputStream(streamConstraints: MediaStreamConstraints): Promise<MediaStream>;
    /**
     * This function helps `releaseMediaStream` do the right thing.
     *
     * We need to do three things:
     *
     * * Close the tracks of the source stream.
     * * Remove the transform.
     * * Clean up the _source_ stream's callback, as if `releaseMediaStream` had
     *   been called with that stream -- that's the stream that's tracked in
     *   `activeDevices` and needs to have its callbacks removed.
     *
     * This is a little fiddly because the stream broker interface doesn't
     * know about the innards of the device controller, and only has the
     * meeting session state's stream to work with.
     *
     */
    private releaseAudioTransformStream;
    private releaseVideoTransformStream;
    private stopTracksAndRemoveCallback;
    private releaseOrdinaryStream;
    releaseMediaStream(mediaStreamToRelease: MediaStream | null): void;
    private chosenVideoInputIsTransformDevice;
    bindToAudioVideoController(audioVideoController: AudioVideoController): void;
    private subscribeToMuteAndUnmuteLocalAudio;
    private unsubscribeFromMuteAndUnmuteLocalAudio;
    static getIntrinsicDeviceId(device: Device): string | string[] | null;
    static createEmptyAudioDevice(): MediaStream;
    static createEmptyVideoDevice(): MediaStream | null;
    static synthesizeAudioDevice(toneHz: number): MediaStream;
    static synthesizeVideoDevice(colorOrPattern: string): MediaStream | null;
    private updateMaxBandwidthKbps;
    private listDevicesOfKind;
    private updateDeviceInfoCacheFromBrowser;
    private listCachedDevicesOfKind;
    private alreadyHandlingDeviceChange;
    private handleDeviceChange;
    private handleDeviceStreamEnded;
    private forEachObserver;
    private areDeviceListsEqual;
    private intrinsicDeviceAsMediaStream;
    private hasSameGroupId;
    private getGroupIdFromDeviceId;
    private getActiveDeviceId;
    private restartLocalVideoAfterSelection;
    private handleGetUserMediaError;
    private releaseActiveDevice;
    /**
     * Check whether a device is already selected.
     *
     * @param kind typically 'audio' or 'video'.
     * @param device the device about to be selected.
     * @param selection the existing device selection of this kind.
     * @param proposedConstraints the constraints that will be used when this device is selected.
     * @returns whether `device` matches `selection` — that is, whether this device is already selected.
     */
    private matchesDeviceSelection;
    private chooseInputIntrinsicDevice;
    private handleNewInputDevice;
    private bindAudioOutput;
    private calculateMediaStreamConstraints;
    private deviceInfoFromDeviceId;
    private acquireInputStream;
    hasAppliedTransform(): boolean;
    private isMediaStreamReusableByDeviceId;
    private getMediaTrackSettings;
    private reconnectAudioInputs;
    private setTransform;
    private removeTransform;
    private attachAudioInputStreamToAudioContext;
    /**
     * Return the end of the Web Audio graph: post-transform audio.
     */
    private getMediaStreamDestinationNode;
    /**
     * Return the start of the Web Audio graph: pre-transform audio.
     * If there's no transform node, this is the destination node.
     */
    private getMediaStreamOutputNode;
    static getAudioContext(): AudioContext;
    static closeAudioContext(): void;
    private supportSampleRateConstraint;
    private supportSampleSizeConstraint;
    private supportChannelCountConstraint;
    private trace;
}
