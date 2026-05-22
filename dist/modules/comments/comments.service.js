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
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../../common/enum/multer.enum");
const comment_repository_1 = require("../../DB/Repository/comment.repository");
const post_repository_1 = require("../../DB/Repository/post.repository");
const post_utiliti_1 = require("../../common/utiliti/posts/post.utiliti");
const post_enum_1 = require("../../common/enum/post.enum");
class CommentService {
    _userModel = new user_repository_1.UserRepository();
    _commentModel = new comment_repository_1.CommentRepository();
    _radisService = radis_service_1.default;
    _tokenService = token_1.default;
    _S3Service = new S3_service_1.S3Service();
    _notificationServie = notification_service_1.default;
    _postModel = new post_repository_1.PostRepository();
    constructor() { }
    createComment = async (req, res, next) => {
        const { content, tags, onModel } = req.body;
        const { postId, commentId } = req.params;
        let doc = null;
        if (onModel === post_enum_1.On_Model_Enum.Post && !commentId) {
            doc = await this._postModel.findOne({
                filter: {
                    _id: postId,
                    ...(0, post_utiliti_1.AvailabilityPost)(req),
                    allowComment: post_enum_1.Allow_Comment_Enum.allow
                }
            });
            if (!doc) {
                throw new global_error_handling_1.AppError("post not found or you are not allowed to comment on this post", 404);
            }
        }
        else if (onModel === post_enum_1.On_Model_Enum.Comment && commentId) {
            let comment = await this._commentModel.findOne({
                filter: {
                    _id: commentId,
                    refId: postId,
                },
                options: {
                    populate: [
                        {
                            path: "refId",
                            match: {
                                ...(0, post_utiliti_1.AvailabilityPost)(req),
                                allowComment: post_enum_1.Allow_Comment_Enum.allow
                            }
                        }
                    ]
                }
            });
            if (!comment?.refId) {
                throw new global_error_handling_1.AppError("comment not found or you are not allowed to comment on this post", 404);
            }
            doc = comment;
        }
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
        }
        const folderId = (0, node_crypto_1.randomUUID)();
        let urls = [];
        if (req.files?.length) {
            urls = await this._S3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${doc?.folderId}/comments/${folderId}`,
                store_type: multer_enum_1.store_enum.memory,
            });
        }
        const Comment = await this._commentModel.create({
            attachments: urls,
            content: content || "",
            createdBy: req.user?._id,
            folderId,
            tags: mentions,
            refId: doc?._id,
            onModel
        });
        if (!Comment) {
            await this._S3Service.deleteFiles(urls);
            throw new global_error_handling_1.AppError("fail to create Comment", 500);
        }
        if (fcmTokens?.length) {
            await this._notificationServie.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "you have new mentions",
                    body: `${Comment.content || "new mention"}`
                }
            });
        }
        return res.status(200).json({
            message: "done",
            data: Comment
        });
    };
}
exports.default = new CommentService();
