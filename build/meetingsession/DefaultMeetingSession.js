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
const DefaultAudioVideoController_1 = require("../audiovideocontroller/DefaultAudioVideoController");
const DefaultAudioVideoFacade_1 = require("../audiovideofacade/DefaultAudioVideoFacade");
const FullJitterBackoff_1 = require("../backoff/FullJitterBackoff");
const DefaultBrowserBehavior_1 = require("../browserbehavior/DefaultBrowserBehavior");
const ContentShareMediaStreamBroker_1 = require("../contentsharecontroller/ContentShareMediaStreamBroker");
const DefaultContentShareController_1 = require("../contentsharecontroller/DefaultContentShareController");
const Destroyable_1 = require("../destroyable/Destroyable");
const DefaultReconnectController_1 = require("../reconnectcontroller/DefaultReconnectController");
const DefaultWebSocketAdapter_1 = require("../websocketadapter/DefaultWebSocketAdapter");
class DefaultMeetingSession {
    constructor(configuration, logger, deviceController) {
        this._configuration = configuration;
        this._logger = logger;
        this.checkBrowserSupportAndFeatureConfiguration();
        this._deviceController = deviceController;
        this.audioVideoController = new DefaultAudioVideoController_1.default(this._configuration, this._logger, new DefaultWebSocketAdapter_1.default(this._logger), deviceController, new DefaultReconnectController_1.default(this._configuration.reconnectTimeoutMs, new FullJitterBackoff_1.default(this._configuration.reconnectFixedWaitMs, this._configuration.reconnectShortBackOffMs, this._configuration.reconnectLongBackOffMs)));
        deviceController.bindToAudioVideoController(this.audioVideoController);
        const contentShareMediaStreamBroker = new ContentShareMediaStreamBroker_1.default(this._logger);
        this.contentShareController = new DefaultContentShareController_1.default(contentShareMediaStreamBroker, new DefaultAudioVideoController_1.default(DefaultContentShareController_1.default.createContentShareMeetingSessionConfigure(this._configuration), this._logger, new DefaultWebSocketAdapter_1.default(this._logger), contentShareMediaStreamBroker, new DefaultReconnectController_1.default(this._configuration.reconnectTimeoutMs, new FullJitterBackoff_1.default(this._configuration.reconnectFixedWaitMs, this._configuration.reconnectShortBackOffMs, this._configuration.reconnectLongBackOffMs))), this.audioVideoController);
        this.audioVideoFacade = new DefaultAudioVideoFacade_1.default(this.audioVideoController, this.audioVideoController.videoTileController, this.audioVideoController.realtimeController, this.audioVideoController.audioMixController, this._deviceController, this.contentShareController);
    }
    get configuration() {
        return this._configuration;
    }
    get logger() {
        return this._logger;
    }
    get audioVideo() {
        return this.audioVideoFacade;
    }
    get contentShare() {
        return this.contentShareController;
    }
    get deviceController() {
        return this._deviceController;
    }
    /**
     * Clean up this instance and resources that it created.
     *
     * After calling `destroy`, internal fields like `audioVideoController` will be unavailable.
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (Destroyable_1.isDestroyable(this.contentShareController)) {
                yield this.contentShareController.destroy();
            }
            if (Destroyable_1.isDestroyable(this.audioVideoController)) {
                yield this.audioVideoController.destroy();
            }
            this._logger = undefined;
            this._configuration = undefined;
            this._deviceController = undefined;
            this.audioVideoFacade = undefined;
            this.audioVideoController = undefined;
            this.contentShareController = undefined;
        });
    }
    checkBrowserSupportAndFeatureConfiguration() {
        const browserBehavior = new DefaultBrowserBehavior_1.default();
        const browser = `${browserBehavior.name()} ${browserBehavior.majorVersion()} (${browserBehavior.version()})`;
        this.logger.info(`browser is ${browser}`);
        if (!browserBehavior.isSupported()) {
            this.logger.warn('this browser is not currently supported. ' +
                'Stability may suffer. ' +
                `Supported browsers are: ${browserBehavior.supportString()}.`);
        }
        if (this._configuration.enableUnifiedPlanForChromiumBasedBrowsers) {
            if (browserBehavior.hasChromiumWebRTC()) {
                this.logger.info('WebRTC unified plan for Chromium-based browsers is enabled');
            }
            else {
                this.logger.info(`WebRTC unified plan is required for ${browserBehavior.name()}`);
            }
        }
        if (this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers) {
            if (!this._configuration.enableUnifiedPlanForChromiumBasedBrowsers) {
                this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
                this.logger.info('Simulcast requires enabling WebRTC Unified Plan for Chromium-based browsers');
            }
            else if (browserBehavior.hasChromiumWebRTC()) {
                this.logger.info(`Simulcast is enabled for ${browserBehavior.name()}`);
            }
            else {
                this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
                this.logger.info('Simulcast requires WebRTC Unified Plan and is only supported on Chromium-based browsers');
            }
        }
    }
}
exports.default = DefaultMeetingSession;
//# sourceMappingURL=DefaultMeetingSession.js.map