import { NextFunction, Request, Response } from "express";
import { AppError } from "../utiliti/global-error-handling";
import { IUser, userModel } from "../../models/user.model";
import { HydratedDocument } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import tokenService from "../../common/middlware/token";
import radisService from "../../common/service/radis.service";
import { ACCESS_SECRET_KEY_ADMIN, ACCESS_SECRET_KEY_USER, PREFIX_ADMIN, PREFIX_USER } from "../../config/config.service";


export interface IRequest extends Request {
  user?: HydratedDocument<IUser>;
  decoded?: JwtPayload;
}

// declare module "express-serve-static-core" {
//   interface Request {
//     user: HydratedDocument<IUser>,
//     decoded: HydratedDocument<IUser>
//   }
// }

export const authentication = async (req: IRequest, res: Response, next: NextFunction)  => {

    const {authorization} = req.headers;

    if (!authorization){
        throw new AppError("token not exist", 401);
    }
    const [prefix, token] = authorization.split(" ");

    let ACCESS_SECRET_KEY = "" ; 

    if(prefix == PREFIX_USER){
        ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_USER
    }

    else if(prefix == PREFIX_ADMIN){
        ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_ADMIN

    }else{
        throw new AppError("invalid prefix", 401);
    }

    const decoded = tokenService.VerifyToken({token: token as string, secret_key: ACCESS_SECRET_KEY} ) as { id: string; jti: string; iat: number }

    if (!decoded || !decoded?.id) {
        throw new AppError("invalid token", 401);
    }

    // to ensure that user is exist in the DB 
    const user = await userModel.findById(decoded.id)
    if (!user) {
        throw new AppError("user not exist",400 );
    }

  if (!user?.confirmed) {
          throw new AppError("user not confirmed yet");
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

        const revokeToken = await radisService.get(radisService.revoke_key({ userId: user._id, jti: decoded.jti }) );

        if (revokeToken) {
             throw new AppError("Token revoked. Please login again.");
        }

    req.user = user;
    req.decoded = decoded;
    next();
}

