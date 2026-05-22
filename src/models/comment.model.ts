import mongoose, { Types } from "mongoose"
import { Allow_Comment_Enum, Availability_Enum, On_Model_Enum } from "../common/enum/post.enum"



export interface IComment {
content?: string,
    folderId: string,
    attachments?: string[],
    likes?: Types.ObjectId[],
    tags?: Types.ObjectId[],
    createdBy: Types.ObjectId,
    refId: Types.ObjectId,
    onModel: On_Model_Enum,

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
    refId: { type: Types.ObjectId, refPath: "onModel", required: true }, // commentId or postId
    onModel: { type: String, enum: On_Model_Enum, required: true } // Post or Comment

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

