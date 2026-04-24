"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const global_error_handling_1 = require("../utiliti/global-error-handling");
const user_model_1 = require("../../models/user.model");
const token_1 = __importDefault(require("../../common/middlware/token"));
const radis_service_1 = __importDefault(require("../../common/service/radis.service"));
const config_service_1 = require("../../config/config.service");
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        throw new global_error_handling_1.AppError("token not exist", 401);
    }
    const [prefix, token] = authorization.split(" ");
    let ACCESS_SECRET_KEY = "";
    if (prefix == config_service_1.PREFIX_USER) {
        ACCESS_SECRET_KEY = config_service_1.ACCESS_SECRET_KEY_USER;
    }
    else if (prefix == config_service_1.PREFIX_ADMIN) {
        ACCESS_SECRET_KEY = config_service_1.ACCESS_SECRET_KEY_ADMIN;
    }
    else {
        throw new global_error_handling_1.AppError("invalid prefix", 401);
    }
    const decoded = token_1.default.VerifyToken({ token: token, secret_key: ACCESS_SECRET_KEY });
    if (!decoded || !decoded?.id) {
        throw new global_error_handling_1.AppError("invalid token", 401);
    }
    const user = await user_model_1.userModel.findById(decoded.id);
    if (!user) {
        throw new global_error_handling_1.AppError("user not exist", 400);
    }
    if (!user?.confirmed) {
        throw new global_error_handling_1.AppError("user not confirmed yet");
    }
    if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
        throw new global_error_handling_1.AppError("inValid token. Please login again.");
    }
    const revokeToken = await radis_service_1.default.get(radis_service_1.default.revoke_key({ userId: user._id, jti: decoded.jti }));
    if (revokeToken) {
        throw new global_error_handling_1.AppError("Token revoked. Please login again.");
    }
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
