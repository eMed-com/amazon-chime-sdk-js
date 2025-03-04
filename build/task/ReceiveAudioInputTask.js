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
const BaseTask_1 = require("./BaseTask");
/**
 * [[ReceiveAudioInputTask]] acquires an audio input.
 */
class ReceiveAudioInputTask extends BaseTask_1.default {
    constructor(context) {
        super(context.logger);
        this.context = context;
        this.taskName = 'ReceiveAudioInputTask';
    }
    run() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_b = (_a = this.context.meetingSessionConfiguration) === null || _a === void 0 ? void 0 : _a.urls) === null || _b === void 0 ? void 0 : _b.audioHostURL)) {
                this.context.logger.info('No audio connection: not acquiring audio input');
                return;
            }
            if (this.context.activeAudioInput) {
                this.context.logger.info('an active audio input exists');
                return;
            }
            let audioInput;
            try {
                audioInput = yield this.context.mediaStreamBroker.acquireAudioInputStream();
            }
            catch (error) {
                this.context.logger.warn('could not acquire audio input from current device');
            }
            if (audioInput) {
                this.context.activeAudioInput = audioInput;
                this.context.realtimeController.realtimeSetLocalAudioInput(audioInput);
            }
            else {
                this.context.logger.warn('an audio input is not available');
            }
        });
    }
}
exports.default = ReceiveAudioInputTask;
//# sourceMappingURL=ReceiveAudioInputTask.js.map