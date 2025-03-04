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
const LogLevel_1 = require("../logger/LogLevel");
const IntervalScheduler_1 = require("../scheduler/IntervalScheduler");
const Log_1 = require("./Log");
/**
 * `MeetingSessionPOSTLogger` publishes log messages in batches to a URL
 * supplied during its construction.
 *
 * Be sure to call {@link MeetingSessionPOSTLogger.destroy} when you're done
 * with the logger in order to avoid leaks.
 */
class MeetingSessionPOSTLogger {
    constructor(name, configuration, batchSize, intervalMs, url, level = LogLevel_1.default.WARN, headers) {
        this.name = name;
        this.configuration = configuration;
        this.batchSize = batchSize;
        this.intervalMs = intervalMs;
        this.url = url;
        this.level = level;
        this.headers = headers;
        this.logCapture = [];
        this.sequenceNumber = 0;
        this.lock = false;
        this.startLogPublishScheduler(this.batchSize);
        this.eventListener = () => {
            this.stop();
        };
        this.addEventListener();
    }
    addEventListener() {
        if (!this.eventListener || !('window' in global) || !window.addEventListener) {
            return;
        }
        window.addEventListener('unload', this.eventListener);
    }
    removeEventListener() {
        if (!this.eventListener || !('window' in global) || !window.removeEventListener) {
            return;
        }
        window.removeEventListener('unload', this.eventListener);
    }
    debug(debugFunction) {
        if (LogLevel_1.default.DEBUG < this.level) {
            return;
        }
        if (typeof debugFunction === 'string') {
            this.log(LogLevel_1.default.DEBUG, debugFunction);
        }
        else if (debugFunction) {
            this.log(LogLevel_1.default.DEBUG, debugFunction());
        }
        else {
            this.log(LogLevel_1.default.DEBUG, '' + debugFunction);
        }
    }
    info(msg) {
        this.log(LogLevel_1.default.INFO, msg);
    }
    warn(msg) {
        this.log(LogLevel_1.default.WARN, msg);
    }
    error(msg) {
        this.log(LogLevel_1.default.ERROR, msg);
    }
    setLogLevel(level) {
        this.level = level;
    }
    getLogLevel() {
        return this.level;
    }
    getLogCaptureSize() {
        return this.logCapture.length;
    }
    startLogPublishScheduler(batchSize) {
        var _a;
        this.addEventListener();
        (_a = this.intervalScheduler) === null || _a === void 0 ? void 0 : _a.stop();
        this.intervalScheduler = new IntervalScheduler_1.default(this.intervalMs);
        this.intervalScheduler.start(() => __awaiter(this, void 0, void 0, function* () {
            if (this.lock === true || this.getLogCaptureSize() === 0) {
                return;
            }
            this.lock = true;
            const batch = this.logCapture.slice(0, batchSize);
            const body = this.makeRequestBody(batch);
            try {
                const response = yield fetch(this.url, Object.assign({ method: 'POST', body }, (this.headers
                    ? {
                        headers: this.headers,
                    }
                    : {})));
                if (response.status === 200) {
                    this.logCapture = this.logCapture.slice(batch.length);
                }
            }
            catch (error) {
                console.warn('[MeetingSessionPOSTLogger] ' + error.message);
            }
            finally {
                this.lock = false;
            }
        }));
    }
    stop() {
        var _a;
        // Clean up to avoid resource leaks.
        (_a = this.intervalScheduler) === null || _a === void 0 ? void 0 : _a.stop();
        this.intervalScheduler = undefined;
        this.removeEventListener();
        const body = this.makeRequestBody(this.logCapture);
        navigator.sendBeacon(this.url, body);
    }
    /**
     * Permanently clean up the logger. A new logger must be created to
     * resume logging.
     */
    destroy() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.intervalScheduler) === null || _a === void 0 ? void 0 : _a.stop();
            this.intervalScheduler = undefined;
            this.removeEventListener();
            this.configuration = undefined;
            this.logCapture = [];
        });
    }
    makeRequestBody(batch) {
        return JSON.stringify({
            meetingId: this.configuration.meetingId,
            attendeeId: this.configuration.credentials.attendeeId,
            appName: this.name,
            logs: batch,
        });
    }
    log(type, msg) {
        if (type < this.level) {
            return;
        }
        const now = Date.now();
        // Handle undefined.
        this.logCapture.push(new Log_1.default(this.sequenceNumber, msg, now, LogLevel_1.default[type]));
        this.sequenceNumber += 1;
    }
}
exports.default = MeetingSessionPOSTLogger;
//# sourceMappingURL=MeetingSessionPOSTLogger.js.map