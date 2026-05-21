"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createcommentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const generalRules_1 = require("../../common/utiliti/generalRules");
exports.createcommentSchema = {
    params: zod_1.default.strictObject({
        postId: generalRules_1.generalRules.id
    }),
    body: zod_1.default.strictObject({
        content: zod_1.default.string().optional(),
        attachments: zod_1.default.array(zod_1.default.any()).optional(),
        tags: zod_1.default.array(generalRules_1.generalRules.id).optional(),
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required"
            });
        }
        if (args?.tags) {
            const uniqueTags = new Set(args.tags);
            if (args.tags.length !== uniqueTags.size) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicate tags"
                });
            }
        }
    })
};
