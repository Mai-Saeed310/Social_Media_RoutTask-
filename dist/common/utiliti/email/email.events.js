"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
const node_events_1 = require("node:events");
const event_enum_1 = require("../../enum/event.enum");
exports.eventEmitter = new node_events_1.EventEmitter();
exports.eventEmitter.on(event_enum_1.EventEnum.confirmEmail, async (fn) => {
    await fn();
});
