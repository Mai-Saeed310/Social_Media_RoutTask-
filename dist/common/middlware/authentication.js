"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const global_error_handling_1 = require("../utiliti/global-error-handling");
const config_service_1 = require("../../config/config.service");
const token_1 = require("./token");
const user_model_1 = require("../../models/user.model");
const radis_service_1 = require("../../redis/radis.service");
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        throw new global_error_handling_1.AppError("token not exist", 401);
    }
    const [prefix, token] = authorization.split(" ");
    if (prefix !== config_service_1.PREFIX) {
        throw new global_error_handling_1.AppError("inValid prefix", 400);
    }
    const decoded = (0, token_1.VerifyToken)({ token: token, secret_key: config_service_1.ACCESS_SECRET_KEY });
    if (!decoded || !decoded?.id) {
        throw new global_error_handling_1.AppError("invalid token", 401);
    }
    const user = await user_model_1.userModel.findById(decoded.id);
    if (!user) {
        throw new global_error_handling_1.AppError("user not exist", 400);
    }
    if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
        throw new global_error_handling_1.AppError("inValid token. Please login again.");
    }
    const revokeToken = await (0, radis_service_1.get)((0, radis_service_1.revoke_key)({ userId: user._id, jti: decoded.jti }));
    if (revokeToken) {
        throw new global_error_handling_1.AppError("Token revoked. Please login again.");
    }
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
