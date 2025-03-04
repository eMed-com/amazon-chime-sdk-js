"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const Versioning_1 = require("../versioning/Versioning");
const WebSocketReadyState_1 = require("./WebSocketReadyState");
class DefaultWebSocketAdapter {
    constructor(logger) {
        this.logger = logger;
    }
    create(url, protocols, isSignedUrl) {
        this.connection = new WebSocket(isSignedUrl ? url : Versioning_1.default.urlWithVersion(url), protocols);
        this.connection.binaryType = 'arraybuffer';
    }
    send(message) {
        if (!this.connection) {
            this.logger.error('WebSocket not yet created or already destroyed.');
            return false;
        }
        try {
            if (message instanceof Uint8Array) {
                this.connection.send(message.buffer);
            }
            else {
                this.connection.send(message);
            }
            return true;
        }
        catch (err) {
            this.logger.debug(() => `send error: ${err.message}, websocket state=${WebSocketReadyState_1.default[this.readyState()]}`);
            return false;
        }
    }
    close(code, reason) {
        var _a;
        (_a = this.connection) === null || _a === void 0 ? void 0 : _a.close(code, reason);
    }
    destroy() {
        this.connection = undefined;
    }
    addEventListener(handler, eventListener) {
        /* istanbul ignore if */
        if (!this.connection) {
            this.logger.warn('Cannot add event listener with no WebSocket connection.');
            return;
        }
        this.connection.addEventListener(handler, eventListener);
    }
    readyState() {
        if (!this.connection) {
            return WebSocketReadyState_1.default.None;
        }
        switch (this.connection.readyState) {
            case WebSocket.CONNECTING:
                return WebSocketReadyState_1.default.Connecting;
            case WebSocket.OPEN:
                return WebSocketReadyState_1.default.Open;
            case WebSocket.CLOSING:
                return WebSocketReadyState_1.default.Closing;
            case WebSocket.CLOSED:
                return WebSocketReadyState_1.default.Closed;
        }
    }
}
exports.default = DefaultWebSocketAdapter;
//# sourceMappingURL=DefaultWebSocketAdapter.js.map