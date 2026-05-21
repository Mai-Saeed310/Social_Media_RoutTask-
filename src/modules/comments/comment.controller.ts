import { Router } from "express";
import { authentication } from "../../common/middlware/authentication";
import multerCloud from "../../common/middlware/multer.cloud";
import { store_enum } from "../../common/enum/multer.enum";
import commentService from "./comments.service";
import * as CV from "./comment.validation";

import { Validation } from "../../common/middlware/validation";




export const commentRouter = Router({mergeParams:true});

commentRouter.post("/create",
    authentication,
    multerCloud({ store_type: store_enum.memory }).array("attachments"),
    Validation(CV.createcommentSchema),
    commentService.createComment)


commentRouter.post("/:commentId/reply",
    authentication,
    multerCloud({ store_type: store_enum.memory }).array("attachments"),
    // Validation(CV.createcommentSchema),
    commentService.reply)
