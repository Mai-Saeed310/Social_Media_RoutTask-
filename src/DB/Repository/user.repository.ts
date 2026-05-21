import { Model } from "mongoose";
import { IUser, userModel } from "../../models/user.model";
import { BaseRepository } from "./base.repository";



export class UserRepository extends BaseRepository<IUser>{
    constructor(protected readonly model: Model<IUser> = userModel){
        super(model)
    }

}

 