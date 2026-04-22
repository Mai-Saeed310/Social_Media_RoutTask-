"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_service_1 = require("./config/config.service");
const global_error_handling_1 = require("./common/utiliti/global-error-handling");
const user_controller_1 = require("./modules/auth/user.controller");
const connectionDB_1 = require("./DB/connectionDB");
const redis_service_1 = require("./DB/redis.service");
const app = (0, express_1.default)();
const port = config_service_1.PORT;
const bootstrap = () => {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests, please try again later."
    });
    (0, connectionDB_1.checkConncetionDB)();
    (0, redis_service_1.redisConnection)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)(), (0, helmet_1.default)(), limiter);
    app.use("/auth", user_controller_1.authRouter);
    app.use("{/*demo}", (req, res, next) => {
        throw new global_error_handling_1.AppError(`Url ${req.originalUrl} with method ${req.method} not found`, 404);
    });
    app.use(global_error_handling_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`server is running on ${port}`);
    });
};
exports.bootstrap = bootstrap;
