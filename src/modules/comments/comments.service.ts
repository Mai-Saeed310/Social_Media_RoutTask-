import notificationService from "../../common/service/notification.service";
import { S3Service } from "../../common/service/S3.service";
import { UserRepository } from "../../DB/Repository/user.repository";
import radisService from "../../common/service/radis.service";
import tokenService from "../../common/middlware/token";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/utiliti/global-error-handling";
import { HydratedDocument, Types } from "mongoose";
import { randomUUID } from "node:crypto";
import { store_enum } from "../../common/enum/multer.enum";
import { IRequest } from "../../common/middlware/authentication";
import { CommentRepository } from "../../DB/Repository/comment.repository";
import { createcommentSchema } from "./comment.validation";
import { PostRepository } from "../../DB/Repository/post.repository";
import { AvailabilityPost } from "../../common/utiliti/posts/post.utiliti";
import { Allow_Comment_Enum, On_Model_Enum } from "../../common/enum/post.enum";
import console from "node:console";
import { IPost } from "../../models/post.model";
import { IComment } from "../../models/comment.model";



 class CommentService {
    private readonly _userModel = new UserRepository();
    private readonly _commentModel = new CommentRepository();
    private readonly _radisService =  radisService;
    private readonly _tokenService = tokenService;
    private readonly _S3Service = new S3Service();
    private readonly _notificationServie = notificationService;
    private readonly _postModel = new PostRepository();


    constructor(){}

createComment = async (req: IRequest, res: Response, next: NextFunction) => {

    const { content, tags, onModel }: createcommentSchema = req.body
    const { postId, commentId } = req.params

    let doc: HydratedDocument<IPost | IComment> | null = null
    if (onModel === On_Model_Enum.Post && !commentId) { // create comment on post
        
        doc = await this._postModel.findOne({
            filter: {
                _id: postId,
                    ...AvailabilityPost(req)
                ,
                allowComment: Allow_Comment_Enum.allow
            }
        })
        if (!doc) {
            throw new AppError("post not found or you are not allowed to comment on this post", 404)
        }
    } else if (onModel === On_Model_Enum.Comment && commentId) { // create reply on comment
        
        let comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                refId: postId!,
            },
            options: {
                populate: [
                    {
                        path: "refId",
                        match: {
                               ...AvailabilityPost(req)
                        ,
                            allowComment: Allow_Comment_Enum.allow
                        }
                    }
                ]
            }
        })
        if (!comment?.refId) {
            throw new AppError("comment not found or you are not allowed to comment on this post", 404)
        }
        doc = comment
    }

    let mentions: Types.ObjectId[] = []
    let fcmTokens: string[] = []
    if (tags?.length) {
        // ... (minimized logic in image)
    }

    const folderId = randomUUID()
    let urls: string[] = []
    if (req.files?.length) {
        urls = await this._S3Service.uploadFiles({
            files: req.files as Express.Multer.File[],
            path: `users/${req?.user?._id}/posts/${doc?.folderId}/comments/${folderId}`,
            store_type: store_enum.memory,
        })
    }

    const Comment = await this._commentModel.create({
        attachments: urls,
        content: content || "",
        createdBy: req.user?._id!,
        folderId,
        tags: mentions,
        refId: doc?._id!,
        onModel
    })

    if (!Comment) {
        await this._S3Service.deleteFiles(urls)
        throw new AppError("fail to create Comment", 500)
    }

    if (fcmTokens?.length) {
        await this._notificationServie.sendNotifications({
            tokens: fcmTokens,
            data: {
                title: "you have new mentions",
                body: `${Comment.content || "new mention"}`
            }
        })
    }

        return res.status(200).json({
        message: "done",
        data: Comment
      });
}

// reply = async (req: IRequest, res: Response, next: NextFunction) => {
//     const { postId } = req.params;
//     const { commentId } = req.params;
//     const { content,tags } = req.body;


//   const comment = await this._commentModel.findOne({
//     filter: {
//         _id: commentId,
//         postId: postId!,
//     },
//     options: {
//         populate: [
//             {
//                 path: "postId",
//                 match: {
                    
//                         ...AvailabilityPost(req),
                    
//                     allowComment: Allow_Comment_Enum.allow
//                 }
//             }
//         ]
//     }
// })
//     if (!comment) {
//         throw new AppError("comment not found or you are not allowed to comment on this post", 404)
//     }
    

//     let mentions: Types.ObjectId[] = []
//     let fcmTokens: string[] = []
//     if (tags?.length) {
//     const data = await this._userModel.find({
//         filter: {
//             _id: { $in: tags }
//         }
//     })

//     if (data.length !== tags.length) {
//         throw new AppError("some tag id not found")
//     }

//     for (const tag of data) {
//         if (tag?._id?.toString() == req?.user?._id.toString()) {
//             throw new AppError("you can not mention to your self")
//         }
//         mentions.push(tag._id)
//         const token = await this._radisService.getFCMs(tag._id)
//         fcmTokens.push(...token)
//     }
// }

//     const folderId = randomUUID()
//     let urls: string[] = []
//     if (req.files?.length) {
//         urls = await this._S3Service.uploadFiles({
//             files: req.files as Express.Multer.File[],
//             path: `users/${req?.user?._id}/posts/${(comment.postId as any).folderId}/comments/${folderId}`,
//             store_type: store_enum.memory,
//         })
//     }
//     const Reply = await this._commentModel.create({
//     attachments: urls,
//     content: content || "",
//     createdBy: req.user?._id!,
//     folderId,
//     tags: mentions,
//     postId: comment.postId._id,
//     replyId: comment._id
// })

// if (!Reply) {
//     await this._S3Service.deleteFiles(urls)
//     throw new AppError("fail to create Comment", 500)
// }

// if (fcmTokens?.length) {
//     await this._notificationServie.sendNotifications({
//         tokens: fcmTokens,
//         data: {
//             title: "you have new mentions",
//             body: `${Reply.content || "new mention"}`
//         }
//     })
// }
//       return res.status(200).json({
//         message: "done",
//         data: Reply
//       });
//     }
    



 }
export default new CommentService();