"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_service_1 = __importDefault(require("../../common/service/notification.service"));
const S3_service_1 = require("../../common/service/S3.service");
const user_repository_1 = require("../../DB/Repository/user.repository");
const radis_service_1 = __importDefault(require("../../common/service/radis.service"));
const token_1 = __importDefault(require("../../common/middlware/token"));
const global_error_handling_1 = require("../../common/utiliti/global-error-handling");
const mongoose_1 = require("mongoose");
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../../common/enum/multer.enum");
const post_repository_1 = require("../../DB/Repository/post.repository");
const post_enum_1 = require("../../common/enum/post.enum");
const post_utiliti_1 = require("../../common/utiliti/posts/post.utiliti");
class PostService {
    _userModel = new user_repository_1.UserRepository();
    _postModel = new post_repository_1.PostRepository();
    _radisService = radis_service_1.default;
    _tokenService = token_1.default;
    _S3Service = new S3_service_1.S3Service();
    _notificationServie = notification_service_1.default;
    constructor() { }
    createPost = async (req, res, next) => {
        const { allowComment, availability, content, tags } = req.body;
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            const mentionsTags = await this._userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            });
            if (tags.length !== mentionsTags.length) {
                throw new global_error_handling_1.AppError("inValid tag id");
            }
            for (const tag of mentionsTags) {
                mentions.push(tag._id);
                (await this._radisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._S3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${folderId}`,
                store_type: multer_enum_1.store_enum.memory,
            });
        }
        const post = await this._postModel.create({
            attachments: urls,
            content: content,
            createdBy: req?.user?._id,
            tags: mentions,
            folderId,
            availability,
            allowComment
        });
        if (!post) {
            await this._S3Service.deleteFiles(urls);
            throw new global_error_handling_1.AppError("fail to create post");
        }
        if (fcmTokens?.length) {
            await this._notificationServie.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: `you are mention on new post`,
                    body: content || "new post"
                }
            });
        }
        return res.status(200).json({
            message: "done",
            data: post
        });
    };
    getPosts = async (req, res, next) => {
        const posts = await this._postModel.find({
            filter: {
                $or: [
                    { availability: post_enum_1.Availability_Enum.public },
                    { availability: post_enum_1.Availability_Enum.only_me, createdBy: req.user._id },
                    { availability: post_enum_1.Availability_Enum.friends, createdBy: { $in: [...(req.user?.friends || [])] } },
                ]
            }
        });
        return res.status(200).json({
            message: "done",
            data: posts
        });
    };
    getPaginate = async (req, res, next) => {
        const posts = await this._postModel.paginate({
            page: +req.query?.page,
            limit: +req.query?.limit,
            search: {
                $and: [
                    {
                        $or: [
                            { availability: post_enum_1.Availability_Enum.public },
                            {
                                availability: post_enum_1.Availability_Enum.only_me,
                                createdBy: req.user._id
                            },
                            {
                                availability: post_enum_1.Availability_Enum.friends,
                                createdBy: { $in: [...(req.user?.friends || [])] }
                            }
                        ]
                    },
                    ...(req.query?.search
                        ? [
                            {
                                content: {
                                    $regex: req.query.search,
                                    $options: "i"
                                }
                            }
                        ]
                        : [])
                ]
            }
        });
        return res.status(200).json({
            message: "done",
            data: posts
        });
    };
    likePost = async (req, res, next) => {
        const { postId } = req.params;
        const { flag } = req.query;
        let updateQuery = {
            $addToSet: { likes: req.user?._id }
        };
        if (flag && flag === "disLike") {
            updateQuery = {
                $pull: { likes: req.user?._id }
            };
        }
        const posts = await this._postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                ...(0, post_utiliti_1.AvailabilityPost)(req),
            },
            update: updateQuery
        });
        if (!posts) {
            throw new global_error_handling_1.AppError("post not found or not authorized");
        }
        return res.status(200).json({
            message: "done",
            data: posts
        });
    };
    updatePost = async (req, res, next) => {
        const { postId } = req.params;
        const { allowComment, availability, content, tags, removeFiles, removeTags } = req.body;
        const post = await this._postModel.findOne({
            filter: {
                _id: postId,
                createdBy: req?.user?._id
            }
        });
        if (!post) {
            throw new global_error_handling_1.AppError("posy not found or not authorized");
        }
        if (removeFiles?.length) {
            const inValidFiles = removeFiles.filter((file) => {
                return !post.attachments?.includes(file);
            });
            if (inValidFiles?.length) {
                throw new global_error_handling_1.AppError("some of path file you want remove not exist");
            }
            await this._S3Service.deleteFiles(removeFiles);
            post.attachments = post.attachments?.filter((file) => {
                return !removeFiles.includes(file);
            });
        }
        const updateTags = new Set(post?.tags.map(id => id.toString()));
        removeTags?.forEach((tag) => {
            return updateTags.delete(tag);
        });
        let fcms_token = [];
        if (tags?.length) {
            const mentionsTags = await this._userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            });
            if (tags.length !== mentionsTags.length) {
                throw new global_error_handling_1.AppError("some person you mentioned not found");
            }
            for (const tag of mentionsTags) {
                if (tag._id.toString() == req.user?._id.toString()) {
                    throw new global_error_handling_1.AppError("you can not mention tou your self");
                }
                updateTags.add(tag._id.toString());
                (await this._radisService.getFCMs(tag._id)).map((token) => {
                    fcms_token.push(token);
                });
            }
        }
        post.tags = [...updateTags].map((id) => new mongoose_1.Types.ObjectId(id));
        if (req.files?.length) {
            let urls = await this._S3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${post.folderId}`,
                store_type: multer_enum_1.store_enum.memory,
            });
            post.attachments?.push(...urls);
        }
        if (fcms_token?.length) {
            await this._notificationServie.sendNotifications({
                tokens: fcms_token,
                data: {
                    title: content || "new Post",
                    body: "new post mentioned"
                }
            });
        }
        if (content)
            post.content = content;
        if (availability)
            post.availability = availability;
        if (allowComment)
            post.allowComment = allowComment;
        await post.save();
        return res.status(200).json({
            message: "done",
            data: post
        });
    };
    getPostsWithComments = async (req, res, next) => {
        const posts = await this._postModel.find({
            filter: {
                ...(0, post_utiliti_1.AvailabilityPost)(req),
            },
            options: {
                populate: [
                    {
                        path: "comments"
                    }
                ]
            }
        });
        return res.status(200).json({
            message: "done",
            data: posts
        });
    };
    getPostsWithCommentsAndReplies = async (req, res, next) => {
        const posts = await this._postModel.find({
            filter: {
                ...(0, post_utiliti_1.AvailabilityPost)(req),
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
        });
        return res.status(200).json({
            message: "done",
            data: posts
        });
    };
}
;
exports.default = new PostService();
