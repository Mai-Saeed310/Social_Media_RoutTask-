import { Router } from "express";
import { authentication } from "../../common/middlware/authentication";
import multerCloud from "../../common/middlware/multer.cloud";
import { store_enum } from "../../common/enum/multer.enum";
import postService from "./post.service";
import * as PV from "./post.validation";
import { Validation } from "../../common/middlware/validation";
import { commentRouter } from "../comments/comment.controller";




export const postRouter = Router();


postRouter.use("/:postId/comment{/:commentId/reply}",commentRouter)

postRouter.post("/create",
    authentication,
    multerCloud({ store_type: store_enum.memory }).array("attachments"),
    Validation(PV.createPostSchema),
    postService.createPost)

postRouter.get("/get",
    authentication,
    postService.getPosts)

postRouter.get("/get-paginate",
    authentication,
    postService.getPaginate)

postRouter.patch("/like-post/:postId",
    authentication,
    Validation(PV.likePostSchema),
    postService.likePost
)

postRouter.patch("/update-post/:postId",
    authentication,
    multerCloud({ store_type: store_enum.memory }).array("attachments"),
    Validation(PV.updatePostSchema),
    postService.updatePost
)

postRouter.get("/get-with-comments",
    authentication,
    postService.getPostsWithComments
)

postRouter.get("/get-with-comments-and-replies",
authentication,
postService.getPostsWithCommentsAndReplies
)
