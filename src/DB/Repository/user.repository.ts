import { PopulateOptions, ProjectionType, QueryOptions, UpdateQuery } from "mongoose";
import { HydratedDocument, Model, QueryFilter, Types } from "mongoose";
import { IUser, userModel } from "../../models/user.model";
import { BaseRepository } from "./base.repository";



export class UserRepository extends BaseRepository<IUser>{
    constructor(protected readonly model: Model<IUser> = userModel){
        super(model)
    }

}

 