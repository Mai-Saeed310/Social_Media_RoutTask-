"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const base_repository_1 = require("./base.repository");
const post_model_1 = require("../../models/post.model");
class PostRepository extends base_repository_1.BaseRepository {
    model;
    constructor(model = post_model_1.postModel) {
        super(model);
        this.model = model;
    }
}
exports.PostRepository = PostRepository;
