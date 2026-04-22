"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const global_error_handling_1 = require("../utiliti/global-error-handling");
const authorization = (roles = []) => {
    return async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new global_error_handling_1.AppError("UnAuthorized");
        }
        next();
    };
};
exports.authorization = authorization;
