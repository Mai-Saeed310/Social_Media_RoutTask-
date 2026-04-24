"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.radisService = void 0;
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
const global_error_handling_1 = require("../utiliti/global-error-handling");
class radisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_service_1.REDIS_URL
        });
    }
    redisConnection = async () => {
        try {
            await this.client.connect();
            console.log("Success to connect with redis.");
        }
        catch (error) {
            console.log("error to connect with redis", error);
        }
    };
    revoke_key = ({ userId, jti }) => {
        return `revoke_token::${userId}::${jti}`;
    };
    get_key = ({ userId }) => {
        return `revoke_token::${userId}`;
    };
    otp_key = ({ email, subject }) => {
        return `otp::${email}::${subject}`;
    };
    max_otp_key = (email) => {
        return `otp::${email}::max_tries`;
    };
    block_otp_key = (email) => {
        return `otp::${email}::block`;
    };
    block_login_key = (email) => {
        return `login::${email}::block`;
    };
    login_attempts_key = (email) => {
        return `login_attempts::${email}`;
    };
    setValue = async ({ key, value, ttl }) => {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            return ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data);
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("fail to set operation", 400);
        }
    };
    update = async ({ key, value, ttl }) => {
        try {
            if (!await this.client.exists(key)) {
                return 0;
            }
            if (ttl)
                return await this.setValue({ key, value, ttl });
            else
                return await this.setValue({ key, value });
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("fail to update operation", 400);
        }
    };
    exists = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("error to check data exists in redis", 400);
        }
    };
    deleteKey = async (key) => {
        try {
            if (!key.length) {
                return 0;
            }
            return await this.client.del(key);
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("error to delete data from redis", 400);
        }
    };
    get = async (key) => {
        if (!await this.client.exists(key)) {
            return 0;
        }
        try {
            try {
                const value = await this.client.get(key);
                if (!value) {
                    return 0;
                }
                return JSON.parse(value);
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("error to get data from redis", 400);
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("error to get ttl from redis", 400);
        }
    };
    keys = async (pattern) => {
        try {
            return await this.client.keys(`${pattern}*`);
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("error to get keys from redis", 400);
        }
    };
    expire = async ({ key, ttl }) => {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("fail to set operation", 400);
        }
    };
    incr = async (key) => {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.error(error);
            throw new global_error_handling_1.AppError("fail to increament operation", 400);
        }
    };
}
exports.radisService = radisService;
exports.default = new radisService();
