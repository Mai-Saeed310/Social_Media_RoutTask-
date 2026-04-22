import { NextFunction, Request, Response } from "express";
import { AppError } from "../utiliti/global-error-handling";
import { ACCESS_SECRET_KEY, PREFIX } from "../../config/config.service";
import { VerifyToken } from "./token";
import { IUser, userModel } from "../../models/user.model";
import { get, revoke_key } from "../../redis/radis.service";
import { HydratedDocument } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

export interface IRequest extends Request {
  user?: HydratedDocument<IUser>;
  decoded?: JwtPayload;
}


export const authentication = async (req: IRequest, res: Response, next: NextFunction)  => {
    
    const {authorization} = req.headers;

    if (!authorization){
        throw new AppError("token not exist", 401);
    }
    const [prefix, token] = authorization.split(" ");

    if (prefix !== PREFIX){
        throw new AppError("inValid prefix", 400);
    }
   
    const decoded = VerifyToken({token: token as string, secret_key: ACCESS_SECRET_KEY} ) as { id: string; jti: string; iat: number }

    if (!decoded || !decoded?.id) {
        throw new AppError("invalid token", 401);
    }

    // to ensure that user is exist in the DB 
    const user = await userModel.findById(decoded.id)
    if (!user) {
        throw new AppError("user not exist",400 );
    }

    // to handle logout all devices
    if (user?.changeCredential!?.getTime() > decoded.iat * 1000){
          throw new AppError("inValid token. Please login again.");
    }
    // to handle logout from current device
        // const revokeToken = await db_service.findOne({ 
        // model: revokeTokenModel, 
        // filter: { tokenId: decoded.jti } 
        // });

        const revokeToken = await get(revoke_key({ userId: user._id, jti: decoded.jti }) );

        if (revokeToken) {
             throw new AppError("Token revoked. Please login again.");
        }

    req.user = user;
    req.decoded = decoded;
    next();
}

