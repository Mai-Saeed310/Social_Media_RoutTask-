import z from "zod"
import { Allow_Comment_Enum, Availability_Enum, On_Model_Enum } from "../../common/enum/post.enum"
import { generalRules } from "../../common/utiliti/generalRules"



export const createcommentSchema = {
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id.optional()
    }),

    body: z.strictObject({
        content: z.string().optional(),
        attachments: z.array(z.any()).optional(),
        tags: z.array(generalRules.id).optional(),
        onModel: z.enum(On_Model_Enum),
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

export type createcommentSchema = z.infer< typeof createcommentSchema.body>
