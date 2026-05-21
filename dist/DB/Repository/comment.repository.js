"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const base_repository_1 = require("./base.repository");
const comment_model_1 = require("../../models/comment.model");
class CommentRepository extends base_repository_1.BaseRepository {
    model;
    constructor(model = comment_model_1.commentModel) {
        super(model);
        this.model = model;
    }
}
exports.CommentRepository = CommentRepository;
