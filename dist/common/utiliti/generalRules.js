"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRules = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = __importDefault(require("zod"));
exports.generalRules = {
    id: zod_1.default.string().refine((value) => {
        return mongoose_1.Types.ObjectId.isValid(value);
    }, {
        message: "inValid id"
    }),
    file: zod_1.default.object({
        fieldname: zod_1.default.string(),
        originalname: zod_1.default.string(),
        encoding: zod_1.default.string(),
        mimetype: zod_1.default.string(),
        buffer: zod_1.default.any().optional(),
        path: zod_1.default.string().optional(),
        size: zod_1.default.number()
    })
};
