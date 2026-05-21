import mongoose, { Types } from "mongoose"
import { Allow_Comment_Enum, Availability_Enum } from "../common/enum/post.enum"



export interface IComment {
content?: string,
    folderId: string,
    attachments?: string[],
    likes?: Types.ObjectId[],
    tags?: Types.ObjectId[],
    createdBy: Types.ObjectId,
    postId: Types.ObjectId,
    replyId?: Types.ObjectId,

}


const CommentSchema = new mongoose.Schema<IComment>({
content: {
        type: String, min: 1, required: function (this) {
            return !this.attachments?.length
        }
    },
    attachments: [String],
    folderId: String,
    likes: [{ type: Types.ObjectId, ref: "userModel" }],
    tags: [{ type: Types.ObjectId, ref: "userModel" }],
    createdBy: { type: Types.ObjectId, ref: "userModel", required: true },
    postId: { type: Types.ObjectId, ref: "postModel", required: true },
    replyId: { type: Types.ObjectId, ref: "commentModel" },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true
})

CommentSchema.virtual("replies",{
  ref: "commentModel",
  localField: "_id",
  foreignField: "replyId"
});


// create model
export const commentModel = mongoose.model<IComment>("commentModel", CommentSchema);

