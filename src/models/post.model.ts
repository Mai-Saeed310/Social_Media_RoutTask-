import mongoose, { Types } from "mongoose"
import { Allow_Comment_Enum, Availability_Enum } from "../common/enum/post.enum"



export interface IPost {
  content?: string,
  attachments?: string[],

  createdBy: Types.ObjectId,

  tags?: Types.ObjectId[],
  likes?: Types.ObjectId[]

  allowComment?: Allow_Comment_Enum,
  availability?: Availability_Enum,

  folderId: string
}


const PostSchema = new mongoose.Schema<IPost>({
  content: {
    type: String, min: 1, required: function (this) {
      return !this.attachments?.length
    }
  },
  attachments: [String],

  createdBy: { type: Types.ObjectId, ref: "userModel", required: true },

  tags: [{ type: Types.ObjectId, ref: "userModel" }],
  likes: [{ type: Types.ObjectId, ref: "userModel" }],

  allowComment: { type: String, enum: Allow_Comment_Enum, default: Allow_Comment_Enum.allow },
  availability: { type: String, enum: Availability_Enum, default: Availability_Enum.public },

  folderId: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true,
  strict : true
})

PostSchema.virtual("comments",{
  ref: "commentModel",
  localField: "_id",
  foreignField: "postId"
});

// create model
export const postModel = mongoose.model<IPost>("postModel", PostSchema);

