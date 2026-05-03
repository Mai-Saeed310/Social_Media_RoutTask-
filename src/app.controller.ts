import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors'
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PORT } from './config/config.service';
import { AppError, globalErrorHandler } from './common/utiliti/global-error-handling';
import { authRouter } from './modules/auth/user.controller';
import { checkConncetionDB } from './DB/connectionDB';
import radisService from './common/service/radis.service';
import { S3Service } from './common/service/S3.service';
import { pipeline } from 'node:stream/promises';



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

    // for testing 
    // app.get("/upload/pre-signed/*path", async (req: Request, res: Response, next: NextFunction) => {

    // const { path } = req.params as { path: string[] }
    // const { download } = req.query as { download: string }
    // const Key = path.join("/") as string

    // const url = await new S3Service().getPreSignedUrl({ Key, download: download ? download : undefined })

    // return res.status(200).json({ message: "done" , data: url  });


    // })

    // app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {

    //     const { path } = req.params as { path: string[] }
    //     const { download } = req.query
    //     const Key = path.join("/") as string

    //     const result = await new S3Service().getFile(Key)
    //     const stream = result.Body as NodeJS.ReadableStream

    //     res.setHeader("Content-Type", result.ContentType!)
    //     res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")

    //     if (download && download === "true") {
    //         res.setHeader("Content-Disposition", `attachment; filename="${path.pop()}"`);
    //     }

    //     await pipeline(stream, res)

    // })


    // Global error handling 
    app.use(globalErrorHandler)

    app.listen(port,()=> {
        console.log(`server is running on ${port}`)
    })
}


