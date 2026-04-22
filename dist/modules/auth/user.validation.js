"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const user_enum_1 = require("../../common/enum/user.enum");
exports.signUpSchema = {
    body: zod_1.default.object({
        userName: zod_1.default.string({ error: "userName is required" }).min(3).max(25),
        email: zod_1.default.string().email(),
        password: zod_1.default.string().min(6),
        cPassword: zod_1.default.string().min(6),
        age: zod_1.default.number().min(18).max(60),
        gender: zod_1.default.enum(user_enum_1.GenderEnum).optional(),
        address: zod_1.default.string().min(3).max(25).optional(),
        phone: zod_1.default.string().optional()
    }).refine((data) => {
        return data.password === data.cPassword;
    }, {
        message: "Passwards are not match",
        path: ["cPassward"]
    })
};
