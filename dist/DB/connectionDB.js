"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConncetionDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_service_1 = require("../config/config.service");
const checkConncetionDB = async () => {
    try {
        await mongoose_1.default.connect(config_service_1.DB_URI);
        console.log("Connection has been established successfully.");
    }
    catch (error) {
        console.error("Unable to connect to the server:", error);
    }
};
exports.checkConncetionDB = checkConncetionDB;
