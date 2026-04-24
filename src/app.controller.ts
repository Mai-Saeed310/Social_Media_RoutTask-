import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors'
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PORT } from './config/config.service';
import { AppError, globalErrorHandler } from './common/utiliti/global-error-handling';
import { authRouter } from './modules/auth/user.controller';
import { checkConncetionDB } from './DB/connectionDB';
import radisService from './common/service/radis.service';



const app:express.Application = express(); 

const port: number = PORT; 

export const bootstrap = ()=>{

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message:"Too many requests, please try again later."
    });
    checkConncetionDB();
    radisService.redisConnection();
    app.use(express.json());
    app.use(cors(),helmet(),limiter);
    app.use("/auth",authRouter);

    app.use("{/*demo}", (req: Request, res: Response, next: NextFunction)=>{
       throw new AppError (`Url ${req.originalUrl} with method ${req.method} not found`,404); 
    })



    // Global error handling 
    app.use(globalErrorHandler)

    app.listen(port,()=> {
        console.log(`server is running on ${port}`)
    })
}


