import { NextFunction, Request, Response } from "express";
import { AppError } from "../utiliti/global-error-handling";




export const authorization = (roles: string[] = []) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes((req as any).user.role)) {
            throw new AppError("UnAuthorized");
        }
        next(); 
    }
}