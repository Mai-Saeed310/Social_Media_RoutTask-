import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IPost, postModel } from "../../models/post.model";



export class PostRepository extends BaseRepository<IPost>{
    constructor(protected readonly model: Model<IPost> = postModel){
        super(model)
    }

}

 