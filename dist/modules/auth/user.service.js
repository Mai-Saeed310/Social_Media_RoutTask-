"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utiliti/global-error-handling");
const user_repository_1 = require("../../DB/Repository/user.repository");
const encrypt_security_1 = require("../../common/utiliti/security/encrypt.security");
const hash_security_1 = require("../../common/utiliti/security/hash.security");
const send_email_1 = require("../../common/utiliti/email/send.email");
const email_template_1 = require("../../common/utiliti/email/email.template");
const radis_service_1 = require("../../redis/radis.service");
const node_crypto_1 = require("node:crypto");
const token_1 = require("../../common/middlware/token");
const config_service_1 = require("../../config/config.service");
const user_enum_1 = require("../../common/enum/user.enum");
const redis_service_1 = require("../../DB/redis.service");
const google_auth_library_1 = require("google-auth-library");
class UserService {
    _userModel = new user_repository_1.UserRepository();
    constructor() { }
    signUp = async (req, res, next) => {
        const { userName, email, password, age, gender, address, phone } = req.body;
        const UserExist = await this._userModel.findOne({ filter: { email } });
        if (UserExist) {
            throw new global_error_handling_1.AppError("User already exist", 409);
        }
        const user = await this._userModel.create({
            userName,
            email,
            password: (0, hash_security_1.Hash)({ plainText: password }),
            age,
            gender,
            address,
            phone: phone ? (0, encrypt_security_1.encrypt)(phone) : null
        });
        const otp = await (0, send_email_1.generateOtp)();
        await (0, send_email_1.sendEmail)({ to: email, subject: "Email confirmation", html: (0, email_template_1.emailTemplate)(otp) });
        await (0, radis_service_1.setValue)({ key: (0, radis_service_1.otp_key)({ email: email, subject: "Email confirmation" }), value: (0, hash_security_1.Hash)({ plainText: `${otp}` }), ttl: 60 * 2 });
        await (0, radis_service_1.setValue)({ key: (0, radis_service_1.max_otp_key)(email), value: (0, hash_security_1.Hash)({ plainText: `${otp}` }), ttl: 60 * 2 });
        res.status(200).json({ message: "done", data: user });
    };
    signIn = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({ filter: { email, confirmed: { $exists: true }, provider: user_enum_1.providerEnum.System } });
        if (!user) {
            throw new global_error_handling_1.AppError("User does not found", 404);
        }
        const isBlocked = await (0, radis_service_1.ttl)((0, radis_service_1.block_login_key)(email));
        if (isBlocked > 0) {
            throw new global_error_handling_1.AppError(`Your account is blocked, try again after ${isBlocked} seconds`, 400);
        }
        if (!(0, hash_security_1.Compare)({ plainText: password, cipherText: user.password })) {
            const attempts_key = (0, radis_service_1.login_attempts_key)(email);
            const attempts = await (0, radis_service_1.incr)(attempts_key);
            await (0, radis_service_1.expire)({ key: attempts_key, ttl: 60 * 10 });
            if (attempts >= 5) {
                await (0, radis_service_1.setValue)({
                    key: (0, radis_service_1.block_login_key)(email),
                    value: 1,
                    ttl: 60 * 5
                });
                await (0, radis_service_1.deleteKey)((0, radis_service_1.login_attempts_key)(email));
                throw new global_error_handling_1.AppError("Account blocked for 5 minutes", 400);
            }
            throw new global_error_handling_1.AppError("inValid password", 400);
        }
        await (0, radis_service_1.deleteKey)((0, radis_service_1.login_attempts_key)(email));
        const jwtId = (0, node_crypto_1.randomUUID)();
        const access_token = (0, token_1.GenerateToken)({
            payload: { id: user._id },
            secret_key: config_service_1.ACCESS_SECRET_KEY,
            options: {
                expiresIn: "1h",
                jwtid: jwtId
            }
        });
        const refresh_token = (0, token_1.GenerateToken)({
            payload: { id: user._id },
            secret_key: config_service_1.REFRESH_SECRET_KEY,
            options: {
                expiresIn: "1y",
                jwtid: jwtId
            }
        });
        return res.status(200).json({
            message: "done",
            access_token: access_token,
            refresh_token: refresh_token
        });
    };
    confirmEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const otpValue = await (0, radis_service_1.get)((0, radis_service_1.otp_key)({ email, subject: "Email confirmation" }));
        if (!otpValue) {
            throw new global_error_handling_1.AppError("otp expired", 400);
        }
        if (!(0, hash_security_1.Compare)({ plainText: otp, cipherText: otpValue })) {
            throw new global_error_handling_1.AppError("inValid otp", 400);
        }
        const user = await this._userModel.findOneAndUpdate({
            filter: { email, confirmed: { $exists: false } },
            update: { confirmed: true }
        });
        if (!user) {
            throw new global_error_handling_1.AppError("user not exist", 400);
        }
        await (0, radis_service_1.deleteKey)((0, radis_service_1.otp_key)({ email, subject: "Email confirmation" }));
        res.status(201).json({ message: "email confirmed successfully" });
    };
    forgetPassword = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ filter: { email, confirmed: { $exists: true } } });
        if (!user) {
            throw new global_error_handling_1.AppError("user not exist or not confirmed", 404);
        }
        const otp = await (0, send_email_1.generateOtp)();
        await (0, send_email_1.sendEmail)({ to: email, subject: "Forget password", html: (0, email_template_1.emailTemplate)(otp) });
        await (0, radis_service_1.setValue)({
            key: (0, radis_service_1.otp_key)({ email, subject: "Forget password" }),
            value: (0, hash_security_1.Hash)({ plainText: `${otp}` }),
            ttl: 60 * 2
        });
        res.status(200).json({ message: "OTP send it to the email" });
    };
    resetPasswordOtp = async (req, res, next) => {
        const { email, otp, newPassword } = req.body;
        const storedOtp = await (0, radis_service_1.get)((0, radis_service_1.otp_key)({ email, subject: "Forget password" }));
        if (!storedOtp) {
            throw new global_error_handling_1.AppError("OTP expired", 400);
        }
        if (!(0, hash_security_1.Compare)({ plainText: otp, cipherText: storedOtp })) {
            throw new global_error_handling_1.AppError("Invalid OTP", 400);
        }
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            throw new global_error_handling_1.AppError("user not exist or not confirmed", 404);
        }
        user.password = (0, hash_security_1.Hash)({ plainText: newPassword });
        user.changeCredential = new Date();
        await user.save();
        await (0, radis_service_1.deleteKey)((0, radis_service_1.otp_key)({ email, subject: "Forget password" }));
        return res.status(200).json({
            message: "Password reset successfully",
        });
    };
    updatePassword = async (req, res, next) => {
        const { oldPassword, newPassword } = req.body;
        const user = req.user;
        if (!(0, hash_security_1.Compare)({ plainText: oldPassword, cipherText: user.password })) {
            throw new global_error_handling_1.AppError("invalid old password", 400);
        }
        user.password = (0, hash_security_1.Hash)({ plainText: newPassword });
        user.changeCredential = new Date();
        await user.save();
        return res.status(200).json({
            message: "password updated successfully",
        });
    };
    logOut = async (req, res, next) => {
        const { flag } = req.body;
        if (flag.toLowerCase() === "all") {
            req.user.changeCredential = new Date();
            await req.user.save();
            const userKeys = await (0, radis_service_1.keys)((0, radis_service_1.get_key)({ userId: req.user._id }));
            if (userKeys.length) {
                await redis_service_1.redisClient.del(userKeys);
            }
        }
        else {
            await (0, radis_service_1.setValue)({
                key: (0, radis_service_1.revoke_key)({ userId: req.user._id, jti: req.decoded.jti }),
                value: `${req.decoded.jti}`,
                ttl: req.decoded.exp - Math.floor(Date.now() / 1000)
            });
        }
        return res.status(200).json({ message: "Done." });
    };
    signUpWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_service_1.CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new global_error_handling_1.AppError("Invalid Google token", 400);
        }
        const { email, email_verified, name } = payload;
        if (!email || !email_verified) {
            throw new global_error_handling_1.AppError("Invalid Google account", 400);
        }
        let user = await this._userModel.findOne({
            filter: { email }
        });
        if (!user) {
            const parts = name?.split(" ") || [];
            const firstName = parts[0] || "User";
            const lastName = parts.slice(1).join(" ") || "User";
            user = await this._userModel.create({
                email,
                confirmed: email_verified,
                firstName,
                lastName,
                provider: user_enum_1.providerEnum.Google
            });
            console.log(user);
        }
        if (user.provider === user_enum_1.providerEnum.System) {
            throw new global_error_handling_1.AppError("please log in on system only", 400);
        }
        const access_token = (0, token_1.GenerateToken)({
            payload: {
                id: user._id,
                email: user.email
            },
            secret_key: config_service_1.ACCESS_SECRET_KEY,
            options: {
                expiresIn: "1d",
            }
        });
        return res.status(200).json({
            message: "done",
            access_token,
            user
        });
    };
}
;
exports.default = new UserService();
