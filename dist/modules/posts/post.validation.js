"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostSchema = exports.likePostSchema = exports.createPostSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const post_enum_1 = require("../../common/enum/post.enum");
const generalRules_1 = require("../../common/utiliti/generalRules");
exports.createPostSchema = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().optional(),
        attachments: zod_1.default.array(zod_1.default.any()).optional(),
        tags: zod_1.default.array(generalRules_1.generalRules.id).optional(),
        availability: zod_1.default.enum(post_enum_1.Availability_Enum).default(post_enum_1.Availability_Enum.friends),
        allowComment: zod_1.default.enum(post_enum_1.Allow_Comment_Enum).default(post_enum_1.Allow_Comment_Enum.allow),
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
exports.likePostSchema = {
    params: zod_1.default.strictObject({
        postId: generalRules_1.generalRules.id
    })
};
exports.updatePostSchema = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().optional(),
        attachments: zod_1.default.array(generalRules_1.generalRules.file).optional(),
        removeFiles: zod_1.default.array(zod_1.default.string()).optional(),
        allowComment: zod_1.default.enum(post_enum_1.Allow_Comment_Enum).default(post_enum_1.Allow_Comment_Enum.allow),
        availability: zod_1.default.enum(post_enum_1.Availability_Enum).default(post_enum_1.Availability_Enum.public),
        tags: zod_1.default.array(generalRules_1.generalRules.id).optional(),
        removeTags: zod_1.default.array(generalRules_1.generalRules.id).optional(),
    }).superRefine((args, ctx) => {
        if (args.tags?.length) {
            const uniqueTags = new Set(args.tags);
            if (args.tags.length !== uniqueTags.size) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicate tags"
                });
            }
        }
    }),
    params: exports.likePostSchema.params
};
