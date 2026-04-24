"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const validation_1 = require("../../common/middlware/validation");
const UV = __importStar(require("./user.validation"));
const authentication_1 = require("../../common/middlware/authentication");
const authorization_1 = require("../../common/middlware/authorization");
const user_enum_1 = require("../../common/enum/user.enum");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/sign-up", (0, validation_1.Validation)(UV.signUpSchema), user_service_1.default.signUp);
exports.authRouter.post("/sign-in", (0, validation_1.Validation)(UV.signInSchema), user_service_1.default.signIn);
exports.authRouter.post("/confirm-email", user_service_1.default.confirmEmail);
exports.authRouter.post("/forgetPassword", user_service_1.default.forgetPassword);
exports.authRouter.post("/resetPasswordOtp", user_service_1.default.resetPasswordOtp);
exports.authRouter.post("/updatePassword", authentication_1.authentication, user_service_1.default.updatePassword);
exports.authRouter.post("/logOut", authentication_1.authentication, user_service_1.default.logOut);
exports.authRouter.post("/signup/gmail", user_service_1.default.signUpWithGmail);
exports.authRouter.post("/resend-otp", (0, validation_1.Validation)(UV.resendOtpSchema), user_service_1.default.resendOtp);
exports.authRouter.get("/profile", authentication_1.authentication, (0, authorization_1.authorization)([user_enum_1.RoleEnum.user]), user_service_1.default.getProfile);
