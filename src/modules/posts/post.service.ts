import notificationService from "../../common/service/notification.service";
import { S3Service } from "../../common/service/S3.service";
import { UserRepository } from "../../DB/Repository/user.repository";
import radisService from "../../common/service/radis.service";
import tokenService from "../../common/middlware/token";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/utiliti/global-error-handling";
import { Types } from "mongoose";
import { createPostSchema, updatePostSchema } from "./post.validation";
import { randomUUID } from "node:crypto";
import { store_enum } from "../../common/enum/multer.enum";
import { IRequest } from "../../common/middlware/authentication";
import { PostRepository } from "../../DB/Repository/post.repository";
import { Availability_Enum } from "../../common/enum/post.enum";
import { AvailabilityPost } from "../../common/utiliti/posts/post.utiliti";



 class PostService {
    private readonly _userModel = new UserRepository();
    private readonly _postModel = new PostRepository();
    private readonly _radisService =  radisService;
    private readonly _tokenService = tokenService;
    private readonly _S3Service = new S3Service();
    private readonly _notificationServie = notificationService;


    constructor(){}

     createPost =  async (req: IRequest, res: Response, next: NextFunction)  => {

    //  Extract post data from request body
    const { allowComment, availability, content, tags }: createPostSchema = req.body

    let mentions: Types.ObjectId[] = []
    let fcmTokens: string[] = []
    if (tags?.length) {

    // Find tagged users in database
        const mentionsTags = await this._userModel.find({
            filter: {
                _id: { $in: tags }
            }
        })
    // Validate all tag ids
        if (tags.length !== mentionsTags.length) {
            throw new AppError("inValid tag id")
        }
    // Store mentioned user ids and collect their FCM tokens
        for (const tag of mentionsTags) {
            mentions.push(tag._id);
            (await this._radisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token))
        }
    }
    let urls: string[] = []
    // Generate unique folder id for post files
    let folderId = randomUUID()
    if (req?.files) {
    // Upload attachments to S3 if files exist
        urls = await this._S3Service.uploadFiles({
            files: req.files as Express.Multer.File[],
            path: `users/${req?.user?._id}/posts/${folderId}`,
            store_type: store_enum.memory,
        })
    }
    // Create post
    const post = await this._postModel.create({
        attachments: urls,
        content: content!,
        createdBy: req?.user?._id!,
        tags: mentions,
        folderId,
        availability,
        allowComment
    })
    //  Delete uploaded files if post creation fails
    if (!post) {  
    await this._S3Service.deleteFiles(urls)
    throw new AppError("fail to create post")
   }
  // Send notifications to mentioned users
   if (fcmTokens?.length) {
    await this._notificationServie.sendNotifications({
        tokens: fcmTokens,
        data: {
            title: `you are mention on new post`,
            body: content || "new post"
        }
    })
  }
      return res.status(200).json({
        message: "done",
        data: post
      });
    }
    
    getPosts = async (req: IRequest, res: Response, next: NextFunction) => {

    const posts = await this._postModel.find({
        filter: {
            $or: [
                { availability: Availability_Enum.public },
                { availability: Availability_Enum.only_me, createdBy: req.user!._id},
                { availability: Availability_Enum.friends, createdBy: { $in: [...(req.user?.friends || [])] } },
            ]
        }
    })

          return res.status(200).json({
        message: "done",
        data: posts
      });
    }

    getPaginate = async (req: IRequest, res: Response, next: NextFunction) => {
       const posts = await this._postModel.paginate({
        page: +req.query?.page!,
        limit: +req.query?.limit!, 
        search: {
        $and: [
            {
            $or: [
                { availability: Availability_Enum.public },

                {
                availability: Availability_Enum.only_me,
                createdBy: req.user!._id
                },

                {
                availability: Availability_Enum.friends,
                createdBy: { $in: [...(req.user?.friends || [])] }
                }
            ]
            },

            ...(req.query?.search
            ? [
                {
                    content: {
                    $regex: req.query.search as string,
                    $options: "i"
                    }
                }
                ]
            : [])
        ]
        }
      
    })

        return res.status(200).json({
        message: "done",
        data: posts
      });
    }


    likePost = async (req: IRequest, res: Response, next: NextFunction) => {
        const { postId } = req.params
        const { flag } = req.query

        let updateQuery: any = {
            $addToSet: { likes: req.user?._id }
        }

        if (flag && flag === "disLike") {
            updateQuery = {
                $pull: { likes: req.user?._id }
            }
        }

        const posts = await this._postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                ...AvailabilityPost(req),
            },
            update: updateQuery
        })
        if(!posts){
          throw new AppError("post not found or not authorized")
        }
         return res.status(200).json({
        message: "done",
        data: posts
      });
    }

   updatePost = async (req: IRequest, res: Response, next: NextFunction) => {
    const { postId } = req.params
    const { allowComment, availability, content, tags, removeFiles, removeTags }: updatePostSchema = req.body

    const post = await this._postModel.findOne({
        filter: {
            _id: postId,
            createdBy: req?.user?._id!
        }
    })

    if (!post) {
        throw new AppError("posy not found or not authorized")
    }

    if (removeFiles?.length) {

        const inValidFiles = removeFiles.filter((file: string) => {
            return !post.attachments?.includes(file)
        })
        if (inValidFiles?.length) {
            throw new AppError("some of path file you want remove not exist")
        }
        await this._S3Service.deleteFiles(removeFiles)

        post.attachments = post.attachments?.filter((file: string) => {
            return !removeFiles.includes(file)
        }) as string[]
    }

    const updateTags = new Set(post?.tags!.map(id => id.toString()))
    
    removeTags?.forEach((tag: string) => {
        return updateTags.delete(tag)
    })

    let fcms_token: string[] = []
    if (tags?.length) {
        const mentionsTags = await this._userModel.find({
            filter: {
                _id: { $in: tags }
            }
        })
        if (tags.length !== mentionsTags.length) {
            throw new AppError("some person you mentioned not found")
        }
        for (const tag of mentionsTags) {
            if (tag._id.toString() == req.user?._id.toString()) {
                throw new AppError("you can not mention tou your self")
            }
            updateTags.add(tag._id.toString());
            (await this._radisService.getFCMs(tag._id)).map((token) => {
                fcms_token.push(token)
            })
        }
    }

    post.tags = [...updateTags].map((id: string) => new Types.ObjectId(id))

    if (req.files?.length) {
    let urls = await this._S3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${post.folderId}`,
        store_type: store_enum.memory,
    })
    post.attachments?.push(...urls)
}

    if (fcms_token?.length) {
        await this._notificationServie.sendNotifications({
            tokens: fcms_token,
            data: {
                title: content || "new Post",
                body: "new post mentioned"
            }
        })
    }


    if(content) post.content = content
    if(availability) post.availability = availability
    if(allowComment) post.allowComment = allowComment

    await post.save()

        return res.status(200).json({
        message: "done",
        data: post
      });
    }

   getPostsWithComments = async (req: IRequest, res: Response, next: NextFunction) => {
        const posts = await this._postModel.find({
        filter: {
                ...AvailabilityPost(req),
            
        },
        options: {
            populate: [
                {
                    path: "comments"
                }
            ]
        }
    })
        return res.status(200).json({
        message: "done",
        data: posts
      });

   }
   
   getPostsWithCommentsAndReplies = async (req: IRequest, res: Response, next: NextFunction) => {
        const posts = await this._postModel.find({
            filter: {       
                    ...AvailabilityPost(req),
            },
            options: {
                populate: [
                    {
                        path: "comments",
                        match: {
                            commentId: { $exists: false }
                        },
                        populate: [
                            {
                                path: "replies"
                            }
                        ]
                    }
                ]
            }
        })
        return res.status(200).json({
        message: "done",
        data: posts
      });

   }
   

 };

export default new PostService();