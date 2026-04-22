"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incr = exports.expire = exports.keys = exports.ttl = exports.get = exports.deleteKey = exports.exists = exports.update = exports.setValue = exports.login_attempts_key = exports.block_login_key = exports.block_otp_key = exports.max_otp_key = exports.otp_key = exports.get_key = exports.revoke_key = void 0;
const global_error_handling_1 = require("../common/utiliti/global-error-handling");
const redis_service_1 = require("../DB/redis.service");
const revoke_key = ({ userId, jti }) => {
    return `revoke_token::${userId}::${jti}`;
};
exports.revoke_key = revoke_key;
const get_key = ({ userId }) => {
    return `revoke_token::${userId}`;
};
exports.get_key = get_key;
const otp_key = ({ email, subject }) => {
    return `otp::${email}::${subject}`;
};
exports.otp_key = otp_key;
const max_otp_key = (email) => {
    return `otp::${email}::max_tries`;
};
exports.max_otp_key = max_otp_key;
const block_otp_key = (email) => {
    return `otp::${email}::block`;
};
exports.block_otp_key = block_otp_key;
const block_login_key = (email) => {
    return `login::${email}::block`;
};
exports.block_login_key = block_login_key;
const login_attempts_key = (email) => {
    return `login_attempts::${email}`;
};
exports.login_attempts_key = login_attempts_key;
const setValue = async ({ key, value, ttl }) => {
    try {
        const data = typeof value === "string" ? value : JSON.stringify(value);
        return ttl ? await redis_service_1.redisClient.set(key, data, { EX: ttl }) : await redis_service_1.redisClient.set(key, data);
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("fail to set operation", 400);
    }
};
exports.setValue = setValue;
const update = async ({ key, value, ttl }) => {
    try {
        if (!await redis_service_1.redisClient.exists(key)) {
            return 0;
        }
        if (ttl)
            return await (0, exports.setValue)({ key, value, ttl });
        else
            return await (0, exports.setValue)({ key, value });
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("fail to update operation", 400);
    }
};
exports.update = update;
const exists = async (key) => {
    try {
        return await redis_service_1.redisClient.exists(key);
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("error to check data exists in redis", 400);
    }
};
exports.exists = exists;
const deleteKey = async (key) => {
    try {
        if (!key.length) {
            return 0;
        }
        return await redis_service_1.redisClient.del(key);
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("error to delete data from redis", 400);
    }
};
exports.deleteKey = deleteKey;
const get = async (key) => {
    if (!await redis_service_1.redisClient.exists(key)) {
        return 0;
    }
    try {
        try {
            const value = await redis_service_1.redisClient.get(key);
            if (!value) {
                return 0;
            }
            return JSON.parse(value);
        }
        catch (error) {
            return await redis_service_1.redisClient.get(key);
        }
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("error to get data from redis", 400);
    }
};
exports.get = get;
const ttl = async (key) => {
    try {
        return await redis_service_1.redisClient.ttl(key);
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("error to get ttl from redis", 400);
    }
};
exports.ttl = ttl;
const keys = async (pattern) => {
    try {
        return await redis_service_1.redisClient.keys(`${pattern}*`);
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("error to get keys from redis", 400);
    }
};
exports.keys = keys;
const expire = async ({ key, ttl }) => {
    try {
        return await redis_service_1.redisClient.expire(key, ttl);
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("fail to set operation", 400);
    }
};
exports.expire = expire;
const incr = async (key) => {
    try {
        return await redis_service_1.redisClient.incr(key);
    }
    catch (error) {
        console.error(error);
        throw new global_error_handling_1.AppError("fail to increament operation", 400);
    }
};
exports.incr = incr;
