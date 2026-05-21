import z from "zod"
import { Allow_Comment_Enum, Availability_Enum } from "../../common/enum/post.enum"
import { generalRules } from "../../common/utiliti/generalRules"



export const createPostSchema = {
    body: z.strictObject({
        content: z.string().optional(),
        attachments: z.array(z.any()).optional(),
        tags: z.array(generalRules.id).optional(),

        availability: z.enum(Availability_Enum).default(Availability_Enum.friends),
        allowComment: z.enum(Allow_Comment_Enum).default(Allow_Comment_Enum.allow),
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required"
            })
        }
        if (args?.tags) {
            const uniqueTags = new Set(args.tags)
            if (args.tags.length !== uniqueTags.size) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicate tags"
                })
            }
        }


    })
}
export type createPostSchema = z.infer< typeof createPostSchema.body>


export const likePostSchema = {
    params: z.strictObject({
        postId: generalRules.id
    })
}

export type likePostSchema = z.infer< typeof likePostSchema.params>


export const updatePostSchema = {
    body: z.strictObject({
        content: z.string().optional(),
        attachments: z.array(generalRules.file).optional(),
        removeFiles: z.array(z.string()).optional(),
        allowComment: z.enum(Allow_Comment_Enum).default(Allow_Comment_Enum.allow),
        availability: z.enum(Availability_Enum).default(Availability_Enum.public),
        tags: z.array(generalRules.id).optional(),
        removeTags: z.array(generalRules.id).optional(),
    }).superRefine((args, ctx) => {
        if (args.tags?.length) {
            const uniqueTags = new Set(args.tags)
            if (args.tags.length !== uniqueTags.size) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicate tags"
                })
            }
        }
    }),
    params: likePostSchema.params
}

export type updatePostSchema = z.infer< typeof updatePostSchema.body>
