"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
class NotificationServie {
    client;
    constructor() {
        const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.resolve)(__dirname, "../../config/social-media-app-3e9bf-firebase-adminsdk-fbsvc-0745f86273.json"), "utf-8"));
        this.client = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount)
        });
    }
    async sendNotification({ token, data }) {
        const message = {
            token,
            data
        };
        return await this.client.messaging().send(message);
    }
    async sendNotifications({ tokens, data }) {
        await Promise.all(tokens.map((token) => {
            return this.sendNotification({ token, data });
        }));
    }
}
exports.default = new NotificationServie();
