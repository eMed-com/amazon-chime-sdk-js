"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultBrowserBehavior_1 = require("../browserbehavior/DefaultBrowserBehavior");
const Maybe_1 = require("../maybe/Maybe");
const DefaultMediaDeviceFactory_1 = require("../mediadevicefactory/DefaultMediaDeviceFactory");
const AsyncScheduler_1 = require("../scheduler/AsyncScheduler");
const IntervalScheduler_1 = require("../scheduler/IntervalScheduler");
const DefaultVideoTile_1 = require("../videotile/DefaultVideoTile");
const AudioTransformDevice_1 = require("./AudioTransformDevice");
const DeviceSelection_1 = require("./DeviceSelection");
const GetUserMediaError_1 = require("./GetUserMediaError");
const NotFoundError_1 = require("./NotFoundError");
const NotReadableError_1 = require("./NotReadableError");
const OverconstrainedError_1 = require("./OverconstrainedError");
const PermissionDeniedError_1 = require("./PermissionDeniedError");
const TypeError_1 = require("./TypeError");
const VideoQualitySettings_1 = require("./VideoQualitySettings");
const VideoTransformDevice_1 = require("./VideoTransformDevice");
function fillSMPTEColorBars(canvas, xShift) {
    const w = canvas.width;
    const h = canvas.height;
    const h1 = (h * 2) / 3;
    const h2 = (h * 3) / 4;
    const h3 = h;
    const top = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    const middle = ['#0000c0', '#000000', '#c000c0', '#000000', '#00c0c0', '#000000', '#c0c0c0'];
    const bottom = [
        '#00214c',
        '#ffffff',
        '#32006a',
        '#131313',
        '#090909',
        '#131313',
        '#1d1d1d',
        '#131313',
    ];
    const bottomX = [
        w * 0,
        ((w * 1) / 4) * (5 / 7),
        ((w * 2) / 4) * (5 / 7),
        ((w * 3) / 4) * (5 / 7),
        w * (5 / 7),
        w * (5 / 7 + 1 / 21),
        w * (5 / 7 + 2 / 21),
        w * (6 / 7),
        w * 1,
    ];
    const segmentWidth = w / top.length;
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < top.length; i++) {
        ctx.fillStyle = top[i];
        ctx.fillRect(xShift + i * segmentWidth, 0, segmentWidth, h1);
        ctx.fillStyle = middle[i];
        ctx.fillRect(xShift + i * segmentWidth, h1, segmentWidth, h2 - h1);
    }
    for (let i = 0; i < bottom.length; i++) {
        ctx.fillStyle = bottom[i];
        ctx.fillRect(xShift + bottomX[i], h2, bottomX[i + 1] - bottomX[i], h3 - h2);
    }
}
// This is a top-level function so that its captured environment is as small as possible,
// minimizing leaks -- the interval scheduler will cause everything here to be retained
// until it is stopped.
function makeColorBars(canvas, colorOrPattern) {
    const scheduler = new IntervalScheduler_1.default(1000);
    const context = canvas.getContext('2d');
    // @ts-ignore
    const stream = canvas.captureStream(5) || null;
    if (!stream) {
        return undefined;
    }
    const onTick = () => {
        if (colorOrPattern === 'smpte') {
            fillSMPTEColorBars(canvas, 0);
        }
        else {
            context.fillStyle = colorOrPattern;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    };
    scheduler.start(onTick);
    const listener = () => {
        scheduler.stop();
    };
    // This event listener will leak unless you remove it.
    stream.getVideoTracks()[0].addEventListener('ended', listener);
    return { listener, scheduler, stream };
}
class DefaultDeviceController {
    constructor(logger, options, browserBehavior = new DefaultBrowserBehavior_1.default()) {
        this.logger = logger;
        this.browserBehavior = browserBehavior;
        this.deviceInfoCache = null;
        this.activeDevices = { audio: null, video: null };
        // `chosenVideoTransformDevice` is tracked and owned by device controller.
        // It is saved when `chooseVideoInputDevice` is called with VideoTransformDevice object.
        this.chosenVideoTransformDevice = null;
        this.audioOutputDeviceId = null;
        this.deviceChangeObservers = new Set();
        this.deviceLabelTrigger = () => {
            return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        };
        this.audioInputDestinationNode = null;
        this.audioInputSourceNode = null;
        this.videoInputQualitySettings = null;
        this.useWebAudio = false;
        this.inputDeviceCount = 0;
        this.alreadyHandlingDeviceChange = false;
        const { enableWebAudio = false } = options || {};
        this.useWebAudio = enableWebAudio;
        this.muteCallback = (muted) => {
            var _a;
            (_a = this.transform) === null || _a === void 0 ? void 0 : _a.device.mute(muted);
        };
        this.videoInputQualitySettings = new VideoQualitySettings_1.default(DefaultDeviceController.defaultVideoWidth, DefaultDeviceController.defaultVideoHeight, DefaultDeviceController.defaultVideoFrameRate, DefaultDeviceController.defaultVideoMaxBandwidthKbps);
        const dimension = this.browserBehavior.requiresResolutionAlignment(this.videoInputQualitySettings.videoWidth, this.videoInputQualitySettings.videoHeight);
        this.videoInputQualitySettings.videoWidth = dimension[0];
        this.videoInputQualitySettings.videoHeight = dimension[1];
        this.logger.info(`DefaultDeviceController video dimension ${this.videoInputQualitySettings.videoWidth} x ${this.videoInputQualitySettings.videoHeight}`);
        try {
            this.mediaDeviceWrapper = new DefaultMediaDeviceFactory_1.default().create();
            const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
            this.logger.info(`Supported Constraints in this browser ${JSON.stringify(supportedConstraints)}`);
        }
        catch (error) {
            logger.error(error.message);
        }
    }
    isWatchingForDeviceChanges() {
        return !!this.onDeviceChangeCallback;
    }
    ensureWatchingDeviceChanges() {
        if (this.isWatchingForDeviceChanges()) {
            return;
        }
        this.logger.info('Starting devicechange listener.');
        this.onDeviceChangeCallback = () => this.handleDeviceChange();
        this.mediaDeviceWrapper.addEventListener('devicechange', this.onDeviceChangeCallback);
    }
    /**
     * Unsubscribe from the `devicechange` event, which allows the device controller to
     * update its device cache.
     */
    stopWatchingDeviceChanges() {
        if (!this.isWatchingForDeviceChanges()) {
            return;
        }
        this.logger.info('Stopping devicechange listener.');
        this.mediaDeviceWrapper.removeEventListener('devicechange', this.onDeviceChangeCallback);
        this.onDeviceChangeCallback = undefined;
    }
    shouldObserveDeviceChanges() {
        if (this.deviceChangeObservers.size) {
            return true;
        }
        const hasActiveDevices = (this.activeDevices['audio'] && this.activeDevices['audio'].constraints !== null) ||
            (this.activeDevices['video'] && this.activeDevices['video'].constraints !== null) ||
            !!this.audioOutputDeviceId;
        return hasActiveDevices;
    }
    watchForDeviceChangesIfNecessary() {
        if (this.shouldObserveDeviceChanges()) {
            this.ensureWatchingDeviceChanges();
        }
        else {
            this.stopWatchingDeviceChanges();
        }
    }
    destroy() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Remove device change callbacks.
            this.stopWatchingDeviceChanges();
            // Deselect any audio input devices and throw away the streams.
            // Discard the current video device, if there is one.
            // Discard any audio or video transforms.
            yield this.chooseAudioInputDevice(null);
            yield this.chooseVideoInputDevice(null);
            // Tear down any Web Audio infrastructure we have hanging around.
            (_a = this.audioInputSourceNode) === null || _a === void 0 ? void 0 : _a.disconnect();
            (_b = this.audioInputDestinationNode) === null || _b === void 0 ? void 0 : _b.disconnect();
            this.audioInputSourceNode = undefined;
            this.audioInputDestinationNode = undefined;
        });
    }
    listAudioInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.listDevicesOfKind('audioinput');
            this.trace('listAudioInputDevices', null, result);
            return result;
        });
    }
    listVideoInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.listDevicesOfKind('videoinput');
            this.trace('listVideoInputDevices', null, result);
            return result;
        });
    }
    listAudioOutputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.listDevicesOfKind('audiooutput');
            this.trace('listAudioOutputDevices', null, result);
            return result;
        });
    }
    pushAudioMeetingStateForPermissions(device) {
        var _a, _b;
        (_b = (_a = this.boundAudioVideoController) === null || _a === void 0 ? void 0 : _a.eventController) === null || _b === void 0 ? void 0 : _b.publishEvent(device === null ? 'audioInputUnselected' : 'audioInputSelected');
    }
    pushVideoMeetingStateForPermissions(device) {
        var _a, _b;
        (_b = (_a = this.boundAudioVideoController) === null || _a === void 0 ? void 0 : _a.eventController) === null || _b === void 0 ? void 0 : _b.publishEvent(device === null ? 'videoInputUnselected' : 'videoInputSelected');
    }
    chooseAudioInputDevice(device) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (device === undefined) {
                this.logger.error('Audio input device cannot be undefined');
                return;
            }
            /*
             * This block of code is a workaround for a Chromium bug:
             * https://bugs.chromium.org/p/chromium/issues/detail?id=1173656
             *
             * In short: if we are about to select an audio device with a transform, which we assume for
             * safety's sake uses AudioWorklet, we recreate the audio context and the nodes that
             * are linked to it.
             *
             * This causes Chrome to rejig its buffers and the second context works correctly.
             *
             * This is theoretically worse for performance, but in practice it is fine.
             *
             * This is not safe in the general case: an application that already
             * retrieved the audio context in order to build an audio graph for some other purpose
             * will fail at this point as we pull the context out from under it.
             *
             * An application that always uses the supplied context in an
             * `AudioTransformDevice.createAudioNode` call should work correctly.
             *
             * If you are confident that your application does not use AudioWorklet, does not run in
             * an un-fixed Chromium version, or will never be used with sample-rate-switching Bluetooth
             * devices, you can disable this workaround by suppling a custom {@link ExtendedBrowserBehavior}
             * when you create your device controller.
             *
             * We can't tell in advance whether we need to give the device a different audio context,
             * because checking whether the resulting node is an AudioWorkletNode needs it to have been
             * created first.
             */
            // Ideally we would only do this work if we knew the device was going to change.
            // By definition, this is only needed for Web Audio.
            let recreateAudioContext = this.useWebAudio;
            if (!this.useWebAudio) {
                this.logger.debug('Not using Web Audio. No need to recreate audio context.');
            }
            // We have a suspended audio context. There's nothing we can do, and there's
            // certainly no point in recreating it. Choosing the transform device will try to resume.
            if (((_a = DefaultDeviceController.audioContext) === null || _a === void 0 ? void 0 : _a.state) === 'suspended') {
                recreateAudioContext = false;
            }
            // Only Chrome needs this fix.
            if (recreateAudioContext && !this.browserBehavior.requiresContextRecreationForAudioWorklet()) {
                this.logger.debug('Browser does not require audio context recreation hack.');
                recreateAudioContext = false;
            }
            // Only need to do this if either device has an audio worklet.
            if (recreateAudioContext && !this.transform && AudioTransformDevice_1.isAudioTransformDevice(device)) {
                this.logger.debug('Neither device is a transform. No need to recreate audio context.');
                recreateAudioContext = false;
            }
            if (recreateAudioContext) {
                this.logger.info('Recreating audio context when selecting new device.');
                /* istanbul ignore else */
                if (this.transform) {
                    /* istanbul ignore else */
                    if (this.transform.nodes) {
                        this.transform.nodes.end.disconnect();
                        this.transform.nodes = undefined;
                    }
                    this.transform = undefined;
                }
                /* istanbul ignore else */
                if (this.audioInputSourceNode) {
                    this.audioInputSourceNode.disconnect();
                    this.audioInputSourceNode = undefined;
                }
                /* istanbul ignore else */
                if (this.audioInputDestinationNode) {
                    this.audioInputDestinationNode.disconnect();
                    this.audioInputDestinationNode = undefined;
                }
                DefaultDeviceController.closeAudioContext();
            }
            if (AudioTransformDevice_1.isAudioTransformDevice(device)) {
                // N.B., do not JSON.stringify here — for some kinds of devices this
                // will cause a cyclic object reference error.
                this.logger.info(`Choosing transform input device ${device}`);
                yield this.chooseAudioTransformInputDevice(device);
            }
            else {
                this.logger.info(`Choosing intrinsic input device ${device}`);
                this.removeTransform();
                yield this.chooseInputIntrinsicDevice('audio', device, false);
                this.trace('chooseAudioInputDevice', device, `success`);
            }
            // Only recreate if there's a peer connection, otherwise `restartLocalAudio` will throw.
            // This hack is off by default, so tests don't cover it. We can remove this skip soon.
            /* istanbul ignore next */
            if (recreateAudioContext && ((_b = this.boundAudioVideoController) === null || _b === void 0 ? void 0 : _b.rtcPeerConnection)) {
                this.boundAudioVideoController.restartLocalAudio(() => {
                    this.logger.info('Local audio restarted.');
                });
            }
            this.pushAudioMeetingStateForPermissions(device);
        });
    }
    chooseAudioTransformInputDevice(device) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.transform) === null || _a === void 0 ? void 0 : _a.device) === device) {
                return;
            }
            if (!this.useWebAudio) {
                throw new Error('Cannot apply transform device without enabling Web Audio.');
            }
            const context = DefaultDeviceController.getAudioContext();
            if (context instanceof OfflineAudioContext) {
                // Nothing to do.
            }
            else {
                switch (context.state) {
                    case 'running':
                        // Nothing to do.
                        break;
                    case 'closed':
                        // A closed context cannot be used for creating nodes, so the correct
                        // thing to do is to raise a descriptive error sooner.
                        throw new Error('Cannot choose a transform device with a closed audio context.');
                    case 'suspended':
                        // A context might be suspended after page load. We try to resume it
                        // here, otherwise audio won't work.
                        yield context.resume();
                }
            }
            let nodes;
            try {
                nodes = yield device.createAudioNode(context);
            }
            catch (e) {
                this.logger.error(`Unable to create transform device node: ${e}.`);
                throw e;
            }
            // Pick the plain ol' inner device as the source. It will be
            // connected to the node.
            const inner = yield device.intrinsicDevice();
            yield this.chooseInputIntrinsicDevice('audio', inner, false);
            this.logger.debug(`Got inner stream: ${inner}.`);
            // Otherwise, continue: hook up the new node.
            this.setTransform(device, nodes);
        });
    }
    chooseVideoTransformInputDevice(device) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (device === this.chosenVideoTransformDevice) {
                this.logger.info('Reselecting same VideoTransformDevice');
                return;
            }
            const prevVideoTransformDevice = this.chosenVideoTransformDevice;
            if (prevVideoTransformDevice) {
                this.logger.info('Switched from previous VideoTransformDevice');
            }
            const wasUsingTransformDevice = !!prevVideoTransformDevice;
            const inner = yield device.intrinsicDevice();
            const canReuseMediaStream = this.isMediaStreamReusableByDeviceId((_a = this.activeDevices['video']) === null || _a === void 0 ? void 0 : _a.stream, inner);
            if (!canReuseMediaStream) {
                this.logger.info('video transform device needs new intrinsic device');
                if (wasUsingTransformDevice) {
                    // detach input media stream - turn off the camera or leave it be if inner is media stream
                    prevVideoTransformDevice.onOutputStreamDisconnect();
                }
                this.chosenVideoTransformDevice = device;
                // VideoTransformDevice owns input MediaStream
                this.activeDevices['video'] = null;
                yield this.chooseInputIntrinsicDevice('video', inner, false, true);
                return;
            }
            // When saved stream is reusable, only switch the saved stream to filtered stream for sending
            // but keep the saved stream intact.
            // Note: to keep the chosen media stream intact, it is important to avoid a full stop
            // because videoTileUpdate can be called when video is stopped and user might call `bindVideoElement` to disconnect the element.
            // In current implementation, disconnecting the element will `hard` stop the media stream.
            // Update device and stream
            this.chosenVideoTransformDevice = device;
            const newMediaStream = this.activeDevices['video'].stream;
            this.logger.info('video transform device uses previous stream');
            // Input is not a MediaStream. Update constraints
            if (!inner.id) {
                const constraint = inner;
                constraint.width = constraint.width || this.videoInputQualitySettings.videoWidth;
                constraint.height = constraint.height || this.videoInputQualitySettings.videoHeight;
                constraint.frameRate = constraint.frameRate || this.videoInputQualitySettings.videoFrameRate;
                yield newMediaStream.getVideoTracks()[0].applyConstraints(constraint);
            }
            // `transformStream` will start processing.
            yield device.transformStream(this.activeDevices['video'].stream);
            // Replace video to send
            if ((_b = this.boundAudioVideoController) === null || _b === void 0 ? void 0 : _b.videoTileController.hasStartedLocalVideoTile()) {
                // optimized method exists, a negotiation can be avoided
                if (this.boundAudioVideoController.replaceLocalVideo) {
                    this.restartLocalVideoAfterSelection(null, false, true);
                }
                else {
                    // non-optimized path, a negotiation is coming
                    yield this.boundAudioVideoController.update();
                }
            }
        });
    }
    chooseVideoInputDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device === undefined) {
                this.logger.error('Video input device cannot be undefined');
                return;
            }
            if (VideoTransformDevice_1.isVideoTransformDevice(device)) {
                this.logger.info(`Choosing video transform device ${device}`);
                return this.chooseVideoTransformInputDevice(device);
            }
            this.updateMaxBandwidthKbps();
            // handle direct switching from VideoTransformDevice to Device
            // From WebRTC point, it is a device switching.
            if (this.chosenVideoInputIsTransformDevice()) {
                // disconnect old stream
                this.chosenVideoTransformDevice.onOutputStreamDisconnect();
                this.chosenVideoTransformDevice = null;
            }
            yield this.chooseInputIntrinsicDevice('video', device, false);
            this.trace('chooseVideoInputDevice', device);
            this.pushVideoMeetingStateForPermissions(device);
        });
    }
    chooseAudioOutputDevice(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.audioOutputDeviceId = deviceId;
            this.watchForDeviceChangesIfNecessary();
            yield this.bindAudioOutput();
            this.trace('chooseAudioOutputDevice', deviceId, null);
            return;
        });
    }
    addDeviceChangeObserver(observer) {
        this.logger.info('adding device change observer');
        this.deviceChangeObservers.add(observer);
        this.watchForDeviceChangesIfNecessary();
        this.trace('addDeviceChangeObserver');
    }
    removeDeviceChangeObserver(observer) {
        this.logger.info('removing device change observer');
        this.deviceChangeObservers.delete(observer);
        this.watchForDeviceChangesIfNecessary();
        this.trace('removeDeviceChangeObserver');
    }
    createAnalyserNodeForAudioInput() {
        var _a, _b;
        if (!this.activeDevices['audio']) {
            return null;
        }
        // If there is a WebAudio node in the graph, we use that as the source instead of the stream.
        const node = (_b = (_a = this.transform) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.end;
        if (node) {
            const analyser = node.context.createAnalyser();
            analyser.removeOriginalInputs = () => {
                try {
                    node.disconnect(analyser);
                }
                catch (e) {
                    // This can fail in some unusual cases, but this is best-effort.
                }
            };
            node.connect(analyser);
            return analyser;
        }
        return this.createAnalyserNodeForRawAudioInput();
    }
    //
    // N.B., this bypasses any applied transform node.
    //
    createAnalyserNodeForRawAudioInput() {
        if (!this.activeDevices['audio']) {
            return null;
        }
        return this.createAnalyserNodeForStream(this.activeDevices['audio'].stream);
    }
    createAnalyserNodeForStream(stream) {
        const audioContext = DefaultDeviceController.getAudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        this.trace('createAnalyserNodeForAudioInput');
        analyser.removeOriginalInputs = () => {
            try {
                source.disconnect(analyser);
            }
            catch (e) {
                // This can fail in some unusual cases, but this is best-effort.
            }
        };
        return analyser;
    }
    startVideoPreviewForVideoInput(element) {
        if (!this.activeDevices['video']) {
            this.logger.warn('cannot bind video preview since video input device has not been chosen');
            this.trace('startVideoPreviewForVideoInput', element.id);
            return;
        }
        // TODO: implement MediaDestroyer to provide single release MediaStream function
        this.releaseMediaStream(element.srcObject);
        DefaultVideoTile_1.default.disconnectVideoStreamFromVideoElement(element, false);
        DefaultVideoTile_1.default.connectVideoStreamToVideoElement(this.activeDevices['video'].stream, element, true);
        this.trace('startVideoPreviewForVideoInput', element.id);
    }
    stopVideoPreviewForVideoInput(element) {
        const stream = element.srcObject;
        const activeVideoDevice = this.activeDevices['video'];
        // Safety.
        /* istanbul ignore else */
        if (activeVideoDevice) {
            this.releaseActiveDevice(activeVideoDevice);
        }
        if (stream) {
            this.releaseMediaStream(stream);
            DefaultVideoTile_1.default.disconnectVideoStreamFromVideoElement(element, false);
        }
        this.trace('stopVideoPreviewForVideoInput', element.id);
    }
    setDeviceLabelTrigger(trigger) {
        this.deviceLabelTrigger = trigger;
        this.trace('setDeviceLabelTrigger');
    }
    mixIntoAudioInput(stream) {
        let node = null;
        if (this.useWebAudio) {
            node = DefaultDeviceController.getAudioContext().createMediaStreamSource(stream);
            node.connect(this.getMediaStreamOutputNode());
        }
        else {
            this.logger.warn('WebAudio is not enabled, mixIntoAudioInput will not work');
        }
        this.trace('mixIntoAudioInput', stream.id);
        return node;
    }
    chooseVideoInputQuality(width, height, frameRate, maxBandwidthKbps) {
        const dimension = this.browserBehavior.requiresResolutionAlignment(width, height);
        this.videoInputQualitySettings = new VideoQualitySettings_1.default(dimension[0], dimension[1], frameRate, maxBandwidthKbps);
        this.updateMaxBandwidthKbps();
    }
    getVideoInputQualitySettings() {
        return this.videoInputQualitySettings;
    }
    acquireAudioInputStream() {
        return this.acquireInputStream('audio');
    }
    acquireVideoInputStream() {
        return this.acquireInputStream('video');
    }
    acquireDisplayInputStream(streamConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            if (streamConstraints &&
                streamConstraints.video &&
                // @ts-ignore
                streamConstraints.video.mandatory &&
                // @ts-ignore
                streamConstraints.video.mandatory.chromeMediaSource &&
                // @ts-ignore
                streamConstraints.video.mandatory.chromeMediaSourceId) {
                return navigator.mediaDevices.getUserMedia(streamConstraints);
            }
            // @ts-ignore https://github.com/microsoft/TypeScript/issues/31821
            return navigator.mediaDevices.getDisplayMedia(streamConstraints);
        });
    }
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
    releaseAudioTransformStream() {
        this.logger.info('Stopping audio track for Web Audio graph');
        this.stopTracksAndRemoveCallback('audio');
        this.logger.info('Removing audio transform, if there is one.');
        this.removeTransform();
        // Remove the input and output nodes. They will be recreated later if
        // needed.
        /* istanbul ignore else */
        if (this.audioInputSourceNode) {
            this.audioInputSourceNode.disconnect();
            this.audioInputSourceNode = undefined;
        }
        /* istanbul ignore else */
        if (this.audioInputDestinationNode) {
            this.audioInputDestinationNode.disconnect();
            this.audioInputDestinationNode = undefined;
        }
    }
    releaseVideoTransformStream() {
        this.logger.info('Stopping video track for transform');
        this.stopTracksAndRemoveCallback('video');
        this.logger.info('Disconnecting video transform');
        this.chosenVideoTransformDevice.onOutputStreamDisconnect();
        this.chosenVideoTransformDevice = null;
    }
    stopTracksAndRemoveCallback(kind) {
        const activeDevice = this.activeDevices[kind];
        // Just-in-case error handling.
        /* istanbul ignore if */
        if (!activeDevice) {
            return;
        }
        /* istanbul ignore next */
        const endedCallback = activeDevice.endedCallback;
        for (const track of activeDevice.stream.getTracks()) {
            track.stop();
            /* istanbul ignore else */
            if (endedCallback) {
                track.removeEventListener('ended', endedCallback);
                delete activeDevice.endedCallback;
            }
            delete this.activeDevices[kind];
        }
    }
    releaseOrdinaryStream(mediaStreamToRelease) {
        var _a;
        const tracksToStop = mediaStreamToRelease.getTracks();
        if (!tracksToStop.length) {
            return;
        }
        for (const track of tracksToStop) {
            track.stop();
        }
        // This function is called from `CleanStoppedSessionTask` using the
        // session state, which does not allow us to clean up any associated 'ended'
        // callbacks in advance. Look here to see if we have any to clean up.
        for (const kind in this.activeDevices) {
            const activeDevice = this.activeDevices[kind];
            if ((activeDevice === null || activeDevice === void 0 ? void 0 : activeDevice.stream) !== mediaStreamToRelease) {
                continue;
            }
            if (activeDevice.endedCallback) {
                tracksToStop[0].removeEventListener('ended', activeDevice.endedCallback);
                delete activeDevice.endedCallback;
            }
            delete this.activeDevices[kind];
            if (kind === 'video' &&
                ((_a = this.boundAudioVideoController) === null || _a === void 0 ? void 0 : _a.videoTileController.hasStartedLocalVideoTile())) {
                this.boundAudioVideoController.videoTileController.stopLocalVideoTile();
            }
        }
    }
    releaseMediaStream(mediaStreamToRelease) {
        var _a, _b;
        if (!mediaStreamToRelease) {
            return;
        }
        try {
            // This method can be called with the output of an audio transform's
            // Web Audio graph. That graph runs from a `MediaStreamSourceNode`, through
            // the transform (if present), to a `MediaStreamDestinationNode`, and out to
            // WebRTC.
            //
            // The call teardown task will call `releaseMediaStream` with the stream it
            // receives — the destination stream.
            //
            // This function detects with this comparison:
            const isReleasingAudioDestinationStream = mediaStreamToRelease === ((_a = this.audioInputDestinationNode) === null || _a === void 0 ? void 0 : _a.stream);
            if (isReleasingAudioDestinationStream) {
                this.releaseAudioTransformStream();
                return;
            }
            // Similarly, it can be called with a video transform's output stream.
            // As with the Web Audio case, we need to release the actual input stream to
            // really stop it.
            const isReleasingVideoOutputStream = mediaStreamToRelease === ((_b = this.chosenVideoTransformDevice) === null || _b === void 0 ? void 0 : _b.outputMediaStream);
            if (isReleasingVideoOutputStream) {
                this.releaseVideoTransformStream();
                return;
            }
            // Otherwise, this is one of our inputs that was plumbed straight through to
            // WebRTC. Go ahead and release it track by track.
            this.releaseOrdinaryStream(mediaStreamToRelease);
        }
        finally {
            this.watchForDeviceChangesIfNecessary();
        }
    }
    chosenVideoInputIsTransformDevice() {
        return !!this.chosenVideoTransformDevice;
    }
    bindToAudioVideoController(audioVideoController) {
        if (this.boundAudioVideoController) {
            this.unsubscribeFromMuteAndUnmuteLocalAudio();
        }
        this.boundAudioVideoController = audioVideoController;
        this.subscribeToMuteAndUnmuteLocalAudio();
        if (this.browserBehavior.supportsSetSinkId()) {
            AsyncScheduler_1.default.nextTick(() => {
                this.bindAudioOutput();
            });
        }
    }
    subscribeToMuteAndUnmuteLocalAudio() {
        if (!this.boundAudioVideoController) {
            return;
        }
        // Safety that's hard to test.
        /* istanbul ignore next */
        if (!this.boundAudioVideoController.realtimeController) {
            return;
        }
        this.boundAudioVideoController.realtimeController.realtimeSubscribeToMuteAndUnmuteLocalAudio(this.muteCallback);
    }
    unsubscribeFromMuteAndUnmuteLocalAudio() {
        // Safety that's hard to test.
        /* istanbul ignore next */
        if (!this.boundAudioVideoController.realtimeController) {
            return;
        }
        this.boundAudioVideoController.realtimeController.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(this.muteCallback);
    }
    static getIntrinsicDeviceId(device) {
        if (device === undefined) {
            return undefined;
        }
        if (device === null) {
            return null;
        }
        if (typeof device === 'string') {
            return device;
        }
        if (device.id) {
            return device.id;
        }
        const constraints = device;
        const deviceIdConstraints = constraints.deviceId;
        if (deviceIdConstraints === undefined) {
            return undefined;
        }
        if (deviceIdConstraints === null) {
            return null;
        }
        if (typeof deviceIdConstraints === 'string' || Array.isArray(deviceIdConstraints)) {
            return deviceIdConstraints;
        }
        const constraintStringParams = deviceIdConstraints;
        if (typeof constraintStringParams.exact === 'string' ||
            Array.isArray(constraintStringParams.exact)) {
            return constraintStringParams.exact;
        }
        return undefined;
    }
    static createEmptyAudioDevice() {
        return DefaultDeviceController.synthesizeAudioDevice(0);
    }
    static createEmptyVideoDevice() {
        return DefaultDeviceController.synthesizeVideoDevice('black');
    }
    static synthesizeAudioDevice(toneHz) {
        const audioContext = DefaultDeviceController.getAudioContext();
        const outputNode = audioContext.createMediaStreamDestination();
        if (!toneHz) {
            const source = audioContext.createBufferSource();
            // The AudioContext object uses the sample rate of the default output device
            // if not specified. Creating an AudioBuffer object with the output device's
            // sample rate fails in some browsers, e.g. Safari with a Bluetooth headphone.
            try {
                source.buffer = audioContext.createBuffer(1, audioContext.sampleRate * 5, audioContext.sampleRate);
            }
            catch (error) {
                if (error && error.name === 'NotSupportedError') {
                    source.buffer = audioContext.createBuffer(1, DefaultDeviceController.defaultSampleRate * 5, DefaultDeviceController.defaultSampleRate);
                }
                else {
                    throw error;
                }
            }
            // Some browsers will not play audio out the MediaStreamDestination
            // unless there is actually audio to play, so we add a small amount of
            // noise here to ensure that audio is played out.
            source.buffer.getChannelData(0)[0] = 0.0003;
            source.loop = true;
            source.connect(outputNode);
            source.start();
        }
        else {
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.1;
            gainNode.connect(outputNode);
            const oscillatorNode = audioContext.createOscillator();
            oscillatorNode.frequency.value = toneHz;
            oscillatorNode.connect(gainNode);
            oscillatorNode.start();
        }
        return outputNode.stream;
    }
    static synthesizeVideoDevice(colorOrPattern) {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = (canvas.width / 16) * 9;
        const colorBars = makeColorBars(canvas, colorOrPattern);
        if (!colorBars) {
            return null;
        }
        // `scheduler` and `listener` will leak.
        const { stream } = colorBars;
        return stream;
    }
    updateMaxBandwidthKbps() {
        if (this.boundAudioVideoController) {
            this.boundAudioVideoController.setVideoMaxBandwidthKbps(this.videoInputQualitySettings.videoMaxBandwidthKbps);
        }
    }
    listDevicesOfKind(deviceKind) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.deviceInfoCache === null || !this.isWatchingForDeviceChanges()) {
                yield this.updateDeviceInfoCacheFromBrowser();
            }
            return this.listCachedDevicesOfKind(deviceKind);
        });
    }
    updateDeviceInfoCacheFromBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            const doesNotHaveAccessToMediaDevices = typeof MediaDeviceInfo === 'undefined';
            if (doesNotHaveAccessToMediaDevices) {
                this.deviceInfoCache = [];
                return;
            }
            let devices = yield navigator.mediaDevices.enumerateDevices();
            let hasDeviceLabels = true;
            for (const device of devices) {
                if (!device.label) {
                    hasDeviceLabels = false;
                    break;
                }
            }
            if (!hasDeviceLabels) {
                try {
                    this.logger.info('attempting to trigger media device labels since they are hidden');
                    const triggerStream = yield this.deviceLabelTrigger();
                    devices = yield navigator.mediaDevices.enumerateDevices();
                    for (const track of triggerStream.getTracks()) {
                        track.stop();
                    }
                }
                catch (err) {
                    this.logger.info('unable to get media device labels');
                }
            }
            this.deviceInfoCache = devices;
        });
    }
    listCachedDevicesOfKind(deviceKind) {
        const devicesOfKind = [];
        for (const device of this.deviceInfoCache) {
            if (device.kind === deviceKind) {
                devicesOfKind.push(device);
            }
        }
        return devicesOfKind;
    }
    handleDeviceChange() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.deviceInfoCache === null) {
                return;
            }
            if (this.alreadyHandlingDeviceChange) {
                AsyncScheduler_1.default.nextTick(() => {
                    this.handleDeviceChange();
                });
                return;
            }
            this.alreadyHandlingDeviceChange = true;
            const oldAudioInputDevices = this.listCachedDevicesOfKind('audioinput');
            const oldVideoInputDevices = this.listCachedDevicesOfKind('videoinput');
            const oldAudioOutputDevices = this.listCachedDevicesOfKind('audiooutput');
            yield this.updateDeviceInfoCacheFromBrowser();
            const newAudioInputDevices = this.listCachedDevicesOfKind('audioinput');
            const newVideoInputDevices = this.listCachedDevicesOfKind('videoinput');
            const newAudioOutputDevices = this.listCachedDevicesOfKind('audiooutput');
            this.forEachObserver((observer) => {
                if (!this.areDeviceListsEqual(oldAudioInputDevices, newAudioInputDevices)) {
                    Maybe_1.default.of(observer.audioInputsChanged).map(f => f.bind(observer)(newAudioInputDevices));
                }
                if (!this.areDeviceListsEqual(oldVideoInputDevices, newVideoInputDevices)) {
                    Maybe_1.default.of(observer.videoInputsChanged).map(f => f.bind(observer)(newVideoInputDevices));
                }
                if (!this.areDeviceListsEqual(oldAudioOutputDevices, newAudioOutputDevices)) {
                    Maybe_1.default.of(observer.audioOutputsChanged).map(f => f.bind(observer)(newAudioOutputDevices));
                }
            });
            this.alreadyHandlingDeviceChange = false;
        });
    }
    handleDeviceStreamEnded(kind, deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.chooseInputIntrinsicDevice(kind, null, false);
            }
            catch (e) {
                /* istanbul ignore next */
                this.logger.error('Failed to choose null device after stream ended.');
            }
            if (kind === 'audio') {
                this.forEachObserver((observer) => {
                    Maybe_1.default.of(observer.audioInputStreamEnded).map(f => f.bind(observer)(deviceId));
                });
            }
            else {
                this.forEachObserver((observer) => {
                    Maybe_1.default.of(observer.videoInputStreamEnded).map(f => f.bind(observer)(deviceId));
                });
            }
        });
    }
    forEachObserver(observerFunc) {
        for (const observer of this.deviceChangeObservers) {
            AsyncScheduler_1.default.nextTick(() => {
                /* istanbul ignore else */
                if (this.deviceChangeObservers.has(observer)) {
                    observerFunc(observer);
                }
            });
        }
    }
    areDeviceListsEqual(a, b) {
        return (JSON.stringify(a.map(device => JSON.stringify(device)).sort()) ===
            JSON.stringify(b.map(device => JSON.stringify(device)).sort()));
    }
    intrinsicDeviceAsMediaStream(device) {
        // @ts-ignore
        return device && device.id ? device : null;
    }
    hasSameGroupId(groupId, kind, device) {
        if (groupId === '') {
            return true;
        }
        const deviceIds = DefaultDeviceController.getIntrinsicDeviceId(device);
        if (typeof deviceIds === 'string' && groupId === this.getGroupIdFromDeviceId(kind, deviceIds)) {
            return true;
        }
        return false;
    }
    getGroupIdFromDeviceId(kind, deviceId) {
        if (this.deviceInfoCache !== null) {
            const cachedDeviceInfo = this.listCachedDevicesOfKind(`${kind}input`).find((cachedDevice) => cachedDevice.deviceId === deviceId);
            if (cachedDeviceInfo && cachedDeviceInfo.groupId) {
                return cachedDeviceInfo.groupId;
            }
        }
        return '';
    }
    getActiveDeviceId(kind) {
        /* istanbul ignore else */
        if (this.activeDevices[kind] && this.activeDevices[kind].constraints) {
            const activeDeviceMediaTrackConstraints = this.activeDevices[kind].constraints.audio || this.activeDevices[kind].constraints.video;
            const activeDeviceConstrainDOMStringParameters = activeDeviceMediaTrackConstraints
                .deviceId;
            let activeDeviceId;
            if (typeof activeDeviceConstrainDOMStringParameters === 'string') {
                activeDeviceId = activeDeviceConstrainDOMStringParameters;
            }
            else {
                activeDeviceId = activeDeviceConstrainDOMStringParameters
                    .exact;
            }
            return activeDeviceId;
        }
        /* istanbul ignore next */
        return null;
    }
    restartLocalVideoAfterSelection(oldDevice, fromAcquire, fromVideoTransformDevice) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fromAcquire &&
                this.boundAudioVideoController &&
                this.boundAudioVideoController.videoTileController.hasStartedLocalVideoTile()) {
                if (fromVideoTransformDevice) {
                    // similar to `useWebaudio`, either Device or VideoTransformDevice, `this.activeDevices['video']` tracks the supplied inner Device.
                    // Upon in-meeting switching to VideoTransformDevice, device controller releases old "supplied" stream and
                    // calls replaceLocalVideo to avoid a full stop-start update.
                    yield this.boundAudioVideoController.replaceLocalVideo();
                    this.logger.info('successfully replaced video track');
                    if (oldDevice === null || oldDevice === void 0 ? void 0 : oldDevice.stream.active) {
                        this.logger.warn('previous media stream is not stopped during restart video');
                        this.releaseActiveDevice(oldDevice);
                    }
                }
                else {
                    // not from VideoTransformDevice, usual behavior.
                    this.logger.info('restarting local video to switch to new device');
                    this.boundAudioVideoController.restartLocalVideo(() => {
                        // TODO: implement MediaStreamDestroyer
                        // tracks of oldStream should be stopped when video tile is disconnected from MediaStream
                        // otherwise, camera is still being accessed and we need to stop it here.
                        if (oldDevice === null || oldDevice === void 0 ? void 0 : oldDevice.stream.active) {
                            this.logger.warn('previous media stream is not stopped during restart video');
                            this.releaseActiveDevice(oldDevice);
                        }
                    });
                }
            }
            else {
                this.releaseActiveDevice(oldDevice);
            }
        });
    }
    handleGetUserMediaError(error, errorTimeMs) {
        if (!error) {
            throw new GetUserMediaError_1.default(error);
        }
        switch (error.name) {
            case 'NotReadableError':
            case 'TrackStartError':
                throw new NotReadableError_1.default(error);
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                throw new NotFoundError_1.default(error);
            case 'NotAllowedError':
            case 'PermissionDeniedError':
            case 'SecurityError':
                if (errorTimeMs &&
                    errorTimeMs < DefaultDeviceController.permissionDeniedOriginDetectionThresholdMs) {
                    throw new PermissionDeniedError_1.default(error, 'Permission denied by browser');
                }
                else {
                    throw new PermissionDeniedError_1.default(error, 'Permission denied by user');
                }
            case 'OverconstrainedError':
            case 'ConstraintNotSatisfiedError':
                throw new OverconstrainedError_1.default(error);
            case 'TypeError':
                throw new TypeError_1.default(error);
            case 'AbortError':
            default:
                throw new GetUserMediaError_1.default(error);
        }
    }
    releaseActiveDevice(device) {
        if (!device || !device.stream) {
            return;
        }
        if (device.endedCallback) {
            const track = device.stream.getTracks()[0];
            // Safety.
            /* istanbul ignore else */
            if (track) {
                track.removeEventListener('ended', device.endedCallback);
            }
        }
        delete device.endedCallback;
        this.releaseMediaStream(device.stream);
        delete device.stream;
    }
    /**
     * Check whether a device is already selected.
     *
     * @param kind typically 'audio' or 'video'.
     * @param device the device about to be selected.
     * @param selection the existing device selection of this kind.
     * @param proposedConstraints the constraints that will be used when this device is selected.
     * @returns whether `device` matches `selection` — that is, whether this device is already selected.
     */
    matchesDeviceSelection(kind, device, selection, proposedConstraints) {
        if (selection &&
            selection.stream.active &&
            selection.groupId !== null &&
            this.hasSameGroupId(selection.groupId, kind, device)) {
            // TODO: this should be computed within this function.
            return selection.matchesConstraints(proposedConstraints);
        }
        return false;
    }
    chooseInputIntrinsicDevice(kind, device, fromAcquire, fromVideoTransformDevice = false) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            this.inputDeviceCount += 1;
            const callCount = this.inputDeviceCount;
            if (device === null && kind === 'video') {
                this.lastNoVideoInputDeviceCount = this.inputDeviceCount;
                const active = this.activeDevices[kind];
                if (active) {
                    this.releaseActiveDevice(active);
                    delete this.activeDevices[kind];
                    this.watchForDeviceChangesIfNecessary();
                }
                return;
            }
            // N.B.,: the input device might already have augmented constraints supplied
            // by an `AudioTransformDevice`. `calculateMediaStreamConstraints` will respect
            // settings supplied by the device.
            const proposedConstraints = this.calculateMediaStreamConstraints(kind, device);
            // TODO: `matchesConstraints` should really return compatible/incompatible/exact --
            // `applyConstraints` can be used to reuse the active device while changing the
            // requested constraints.
            if (this.matchesDeviceSelection(kind, device, this.activeDevices[kind], proposedConstraints)) {
                this.logger.info(`reusing existing ${kind} device`);
                return;
            }
            if (kind === 'audio' && this.activeDevices[kind] && this.activeDevices[kind].stream) {
                this.releaseActiveDevice(this.activeDevices[kind]);
            }
            const startTimeMs = Date.now();
            const newDevice = new DeviceSelection_1.default();
            try {
                this.logger.info(`requesting new ${kind} device with constraint ${JSON.stringify(proposedConstraints)}`);
                const stream = this.intrinsicDeviceAsMediaStream(device);
                if (kind === 'audio' && device === null) {
                    newDevice.stream = DefaultDeviceController.createEmptyAudioDevice();
                    newDevice.constraints = null;
                }
                else if (stream) {
                    this.logger.info(`using media stream ${stream.id} for ${kind} device`);
                    newDevice.stream = stream;
                    newDevice.constraints = proposedConstraints;
                }
                else {
                    newDevice.stream = yield navigator.mediaDevices.getUserMedia(proposedConstraints);
                    newDevice.constraints = proposedConstraints;
                    if (kind === 'video' && this.lastNoVideoInputDeviceCount > callCount) {
                        this.logger.warn(`ignored to get video device for constraints ${JSON.stringify(proposedConstraints)} as no device was requested`);
                        this.releaseMediaStream(newDevice.stream);
                        return;
                    }
                    yield this.handleDeviceChange();
                    const track = newDevice.stream.getTracks()[0];
                    newDevice.endedCallback = () => {
                        // Hard to test, but the safety check is worthwhile.
                        /* istanbul ignore else */
                        if (this.activeDevices[kind] && this.activeDevices[kind].stream === newDevice.stream) {
                            this.logger.warn(`${kind} input device which was active is no longer available, resetting to null device`);
                            this.handleDeviceStreamEnded(kind, this.getActiveDeviceId(kind));
                            delete newDevice.endedCallback;
                        }
                    };
                    track.addEventListener('ended', newDevice.endedCallback, { once: true });
                }
                newDevice.groupId = ((_a = this.getMediaTrackSettings(newDevice.stream)) === null || _a === void 0 ? void 0 : _a.groupId) || '';
            }
            catch (error) {
                let errorMessage;
                if ((error === null || error === void 0 ? void 0 : error.name) && error.message) {
                    errorMessage = `${error.name}: ${error.message}`;
                }
                else if (error === null || error === void 0 ? void 0 : error.name) {
                    errorMessage = error.name;
                }
                else if (error === null || error === void 0 ? void 0 : error.message) {
                    errorMessage = error.message;
                }
                else {
                    errorMessage = 'UnknownError';
                }
                if (kind === 'audio') {
                    (_c = (_b = this.boundAudioVideoController) === null || _b === void 0 ? void 0 : _b.eventController) === null || _c === void 0 ? void 0 : _c.publishEvent('audioInputFailed', {
                        audioInputErrorMessage: errorMessage,
                    });
                }
                else {
                    (_e = (_d = this.boundAudioVideoController) === null || _d === void 0 ? void 0 : _d.eventController) === null || _e === void 0 ? void 0 : _e.publishEvent('videoInputFailed', {
                        videoInputErrorMessage: errorMessage,
                    });
                }
                this.logger.error(`failed to get ${kind} device for constraints ${JSON.stringify(proposedConstraints)}: ${errorMessage}`);
                // This is effectively `error instanceof OverconstrainedError` but works in Node.
                if (error && 'constraint' in error) {
                    this.logger.error(`Over-constrained by constraint: ${error.constraint}`);
                }
                /*
                 * If there is any error while acquiring the audio device, we fall back to null device.
                 * Reason: If device selection fails (e.g. NotReadableError), the peer connection is left hanging
                 * with no active audio track since we release the previously attached track.
                 * If no audio packet has yet been sent to the server, the server will not emit the joined event.
                 */
                if (kind === 'audio') {
                    this.logger.info(`choosing null ${kind} device instead`);
                    try {
                        newDevice.stream = DefaultDeviceController.createEmptyAudioDevice();
                        newDevice.constraints = null;
                        yield this.handleNewInputDevice(kind, newDevice, fromAcquire);
                    }
                    catch (error) {
                        this.logger.error(`failed to choose null ${kind} device. ${error.name}: ${error.message}`);
                    }
                }
                this.handleGetUserMediaError(error, Date.now() - startTimeMs);
            }
            finally {
                this.watchForDeviceChangesIfNecessary();
            }
            this.logger.info(`got ${kind} device for constraints ${JSON.stringify(proposedConstraints)}`);
            yield this.handleNewInputDevice(kind, newDevice, fromAcquire, fromVideoTransformDevice);
            return;
        });
    }
    handleNewInputDevice(kind, newDevice, fromAcquire, fromVideoTransformDevice = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldDevice = this.activeDevices[kind];
            this.activeDevices[kind] = newDevice;
            this.watchForDeviceChangesIfNecessary();
            if (kind === 'video') {
                // attempts to mirror `this.useWebAudio`. The difference is that audio destination stream stays the same
                // but video sending needs to switch streams.
                if (this.chosenVideoInputIsTransformDevice()) {
                    this.logger.info('apply processors to transform');
                    yield this.chosenVideoTransformDevice.transformStream(this.activeDevices['video'].stream);
                }
                yield this.restartLocalVideoAfterSelection(oldDevice, fromAcquire, fromVideoTransformDevice);
            }
            else {
                this.releaseActiveDevice(oldDevice);
                if (this.useWebAudio) {
                    this.attachAudioInputStreamToAudioContext(this.activeDevices[kind].stream);
                }
                else if (this.boundAudioVideoController) {
                    try {
                        yield this.boundAudioVideoController.restartLocalAudio(() => { });
                    }
                    catch (error) {
                        this.logger.info(`cannot replace audio track due to: ${error.message}`);
                    }
                }
                else {
                    this.logger.info('no audio-video controller is bound to the device controller');
                }
            }
        });
    }
    bindAudioOutput() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.boundAudioVideoController) {
                return;
            }
            const deviceInfo = this.deviceInfoFromDeviceId('audiooutput', this.audioOutputDeviceId);
            yield this.boundAudioVideoController.audioMixController.bindAudioDevice(deviceInfo);
        });
    }
    calculateMediaStreamConstraints(kind, device) {
        let trackConstraints = {};
        if (device === '') {
            device = null;
        }
        const stream = this.intrinsicDeviceAsMediaStream(device);
        if (device === null) {
            return null;
        }
        else if (typeof device === 'string') {
            if (this.browserBehavior.requiresNoExactMediaStreamConstraints() &&
                this.browserBehavior.requiresGroupIdMediaStreamConstraints()) {
                // In Samsung Internet browser, navigator.mediaDevices.enumerateDevices()
                // returns same deviceId but different groupdId for some audioinput and videoinput devices.
                // To handle this, we select appropriate device using deviceId + groupId.
                trackConstraints.deviceId = device;
                trackConstraints.groupId = this.getGroupIdFromDeviceId(kind, device);
            }
            else if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
                trackConstraints.deviceId = device;
            }
            else {
                trackConstraints.deviceId = { exact: device };
            }
        }
        else if (stream) {
            // @ts-ignore - create a fake track constraint using the stream id
            trackConstraints.streamId = stream.id;
        }
        else if (isMediaDeviceInfo(device)) {
            trackConstraints.deviceId = device.deviceId;
            trackConstraints.groupId = device.groupId;
        }
        else {
            // Take the input set of constraints. Note that this allows
            // the builder to specify overrides for properties like `autoGainControl`.
            // @ts-ignore - device is a MediaTrackConstraints
            trackConstraints = device;
        }
        if (kind === 'video') {
            trackConstraints.width = trackConstraints.width || {
                ideal: this.videoInputQualitySettings.videoWidth,
            };
            trackConstraints.height = trackConstraints.height || {
                ideal: this.videoInputQualitySettings.videoHeight,
            };
            trackConstraints.frameRate = trackConstraints.frameRate || {
                ideal: this.videoInputQualitySettings.videoFrameRate,
            };
            // TODO: try to replace hard-code value related to videos into quality-level presets
            // The following configs relaxes CPU overuse detection threshold to offer better encoding quality
            // @ts-ignore
            // trackConstraints.googCpuOveruseDetection = true;
            // // @ts-ignore
            // trackConstraints.googCpuOveruseEncodeUsage = true;
            // // @ts-ignore
            // trackConstraints.googCpuOveruseThreshold = 85;
            // // @ts-ignore
            // trackConstraints.googCpuUnderuseThreshold = 55;
        }
        if (kind === 'audio' && this.supportSampleRateConstraint()) {
            trackConstraints.sampleRate = { ideal: DefaultDeviceController.defaultSampleRate };
        }
        if (kind === 'audio' && this.supportSampleSizeConstraint()) {
            trackConstraints.sampleSize = { ideal: DefaultDeviceController.defaultSampleSize };
        }
        if (kind === 'audio' && this.supportChannelCountConstraint()) {
            trackConstraints.channelCount = { ideal: DefaultDeviceController.defaultChannelCount };
        }
        if (kind === 'audio') {
            const augmented = Object.assign({ echoCancellation: true, googEchoCancellation: true, googEchoCancellation2: true, googAutoGainControl: true, googAutoGainControl2: true, googNoiseSuppression: true, googNoiseSuppression2: true, googHighpassFilter: true }, trackConstraints);
            trackConstraints = augmented;
        }
        return kind === 'audio' ? { audio: trackConstraints } : { video: trackConstraints };
    }
    deviceInfoFromDeviceId(deviceKind, deviceId) {
        if (this.deviceInfoCache === null) {
            return null;
        }
        for (const device of this.deviceInfoCache) {
            if (device.kind === deviceKind && device.deviceId === deviceId) {
                return device;
            }
        }
        return null;
    }
    acquireInputStream(kind) {
        return __awaiter(this, void 0, void 0, function* () {
            if (kind === 'audio') {
                if (this.useWebAudio) {
                    const dest = this.getMediaStreamDestinationNode();
                    return dest.stream;
                }
            }
            // mirrors `this.useWebAudio`
            if (kind === 'video') {
                if (this.chosenVideoInputIsTransformDevice()) {
                    return this.chosenVideoTransformDevice.outputMediaStream;
                }
            }
            let existingConstraints = null;
            if (!this.activeDevices[kind]) {
                if (kind === 'audio') {
                    this.logger.info(`no ${kind} device chosen, creating empty ${kind} device`);
                }
                else {
                    this.logger.error(`no ${kind} device chosen, stopping local video tile`);
                    this.boundAudioVideoController.videoTileController.stopLocalVideoTile();
                    throw new Error(`no ${kind} device chosen, stopping local video tile`);
                }
            }
            else {
                this.logger.info(`checking whether existing ${kind} device can be reused`);
                const active = this.activeDevices[kind];
                // @ts-ignore
                existingConstraints = active.constraints ? active.constraints[kind] : null;
            }
            try {
                yield this.chooseInputIntrinsicDevice(kind, existingConstraints, true);
            }
            catch (e) {
                this.logger.error(`unable to acquire ${kind} device`);
                if (e instanceof PermissionDeniedError_1.default) {
                    throw e;
                }
                throw new GetUserMediaError_1.default(e, `unable to acquire ${kind} device`);
            }
            return this.activeDevices[kind].stream;
        });
    }
    hasAppliedTransform() {
        return !!this.transform;
    }
    isMediaStreamReusableByDeviceId(stream, device) {
        // for null device, assume the stream is not reusable
        if (!stream || !stream.active || !device) {
            return false;
        }
        if (device.id) {
            return stream.id === device.id;
        }
        const settings = this.getMediaTrackSettings(stream);
        // If a device does not specify deviceId, we have to assume the stream is not reusable.
        if (!settings.deviceId) {
            return false;
        }
        const deviceIds = DefaultDeviceController.getIntrinsicDeviceId(device);
        if (typeof deviceIds === 'string') {
            return settings.deviceId === deviceIds;
        }
        return false;
    }
    getMediaTrackSettings(stream) {
        var _a;
        return (_a = stream.getTracks()[0]) === null || _a === void 0 ? void 0 : _a.getSettings();
    }
    reconnectAudioInputs() {
        if (!this.audioInputSourceNode) {
            return;
        }
        this.audioInputSourceNode.disconnect();
        const output = this.getMediaStreamOutputNode();
        this.audioInputSourceNode.connect(output);
    }
    setTransform(device, nodes) {
        var _a, _b;
        (_b = (_a = this.transform) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.end.disconnect();
        this.transform = { nodes, device };
        const proc = nodes === null || nodes === void 0 ? void 0 : nodes.end;
        const dest = this.getMediaStreamDestinationNode();
        this.logger.debug(`Connecting transform node ${proc} to destination ${dest}.`);
        proc === null || proc === void 0 ? void 0 : proc.connect(dest);
        this.reconnectAudioInputs();
    }
    removeTransform() {
        var _a;
        const previous = this.transform;
        if (!previous) {
            return undefined;
        }
        (_a = this.transform.nodes) === null || _a === void 0 ? void 0 : _a.end.disconnect();
        this.transform = undefined;
        this.reconnectAudioInputs();
        return previous;
    }
    attachAudioInputStreamToAudioContext(stream) {
        var _a;
        (_a = this.audioInputSourceNode) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.audioInputSourceNode = DefaultDeviceController.getAudioContext().createMediaStreamSource(stream);
        const output = this.getMediaStreamOutputNode();
        this.audioInputSourceNode.connect(output);
    }
    /**
     * Return the end of the Web Audio graph: post-transform audio.
     */
    getMediaStreamDestinationNode() {
        if (!this.audioInputDestinationNode) {
            this.audioInputDestinationNode = DefaultDeviceController.getAudioContext().createMediaStreamDestination();
        }
        return this.audioInputDestinationNode;
    }
    /**
     * Return the start of the Web Audio graph: pre-transform audio.
     * If there's no transform node, this is the destination node.
     */
    getMediaStreamOutputNode() {
        var _a, _b;
        return ((_b = (_a = this.transform) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.start) || this.getMediaStreamDestinationNode();
    }
    static getAudioContext() {
        if (!DefaultDeviceController.audioContext) {
            const options = {};
            if (navigator.mediaDevices.getSupportedConstraints().sampleRate) {
                options.sampleRate = DefaultDeviceController.defaultSampleRate;
            }
            // @ts-ignore
            DefaultDeviceController.audioContext = new (window.AudioContext || window.webkitAudioContext)(options);
        }
        return DefaultDeviceController.audioContext;
    }
    static closeAudioContext() {
        if (DefaultDeviceController.audioContext) {
            try {
                DefaultDeviceController.audioContext.close();
            }
            catch (e) {
                // Nothing we can do.
            }
        }
        DefaultDeviceController.audioContext = null;
    }
    supportSampleRateConstraint() {
        return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().sampleRate;
    }
    supportSampleSizeConstraint() {
        return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().sampleSize;
    }
    supportChannelCountConstraint() {
        return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().channelCount;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trace(name, input, output) {
        let s = `API/DefaultDeviceController/${name}`;
        if (typeof input !== 'undefined') {
            s += ` ${JSON.stringify(input)}`;
        }
        if (typeof output !== 'undefined') {
            s += ` -> ${JSON.stringify(output)}`;
        }
        this.logger.info(s);
    }
}
exports.default = DefaultDeviceController;
DefaultDeviceController.permissionDeniedOriginDetectionThresholdMs = 500;
DefaultDeviceController.defaultVideoWidth = 960;
DefaultDeviceController.defaultVideoHeight = 540;
DefaultDeviceController.defaultVideoFrameRate = 15;
DefaultDeviceController.defaultVideoMaxBandwidthKbps = 1400;
DefaultDeviceController.defaultSampleRate = 48000;
DefaultDeviceController.defaultSampleSize = 16;
DefaultDeviceController.defaultChannelCount = 1;
DefaultDeviceController.audioContext = null;
function isMediaDeviceInfo(device) {
    return (typeof device === 'object' &&
        'deviceId' in device &&
        'groupId' in device &&
        'kind' in device &&
        'label' in device);
}
//# sourceMappingURL=DefaultDeviceController.js.map