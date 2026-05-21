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
import { postRouter } from './modules/posts/post.controller';
import { GraphQLEnumType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { createHandler } from "graphql-http/lib/use/express";



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
    app.use("/post",postRouter);


    app.post("/send-notification", (req: Request, res: Response, next: NextFunction)=>{
            console.log({token: req.body.token})
    })

    app.use("{/*demo}", (req: Request, res: Response, next: NextFunction)=>{
       throw new AppError (`Url ${req.originalUrl} with method ${req.method} not found`,404); 
    })

let GenderType = new GraphQLEnumType({
  name: "genderType",
  values: {
    male: { value: "male" },
    female: { value: "female" },
  }
})


let UserType = new GraphQLObjectType({
  name: "getUser",
  fields: {
    id: { type: GraphQLInt },
    age: { type: GraphQLInt },
    name: { type: GraphQLString },
    gender: { type: GenderType }
  }
})

const users = [
  {
    id: 1,
    name: "Mai",
    age: 24,
    gender: "female"
  }
]

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "query",
        description: "query info",
        fields: {

            hi: {
                type: GraphQLString,
                resolve: () => {
                    return "hi"
                }
            },
            hello: {
                type: GraphQLString,
                resolve: () => {
                    return "hello"
                }
            }

        }
    }),
    mutation: new GraphQLObjectType({
        name: "mutation",
        fields: {
        createUser: {
            type: new GraphQLList(UserType),
            args: {
            id: { type: new GraphQLNonNull(GraphQLInt) },
            age: { type: new GraphQLNonNull(GraphQLInt) },
            name: { type: new GraphQLNonNull(GraphQLString) },
            gender: { type: new GraphQLNonNull(GenderType) }
            },
            resolve: (parent, args) => {
            const { id, name, age, gender } = args
            const userExist = users.find(user => user.id == id)
            if (userExist) {
                throw new AppError("user already exist")
            }
            users.push({ id, name, age, gender })
            return users
            }
        }
        }
    })
})
        app.use("/graphql",createHandler({schema}));

    // Global error handling 
    app.use(globalErrorHandler)

    app.listen(port,()=> {
        console.log(`server is running on ${port}`)
    })
}


