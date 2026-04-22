import {resolve} from 'path' ;
import { config } from 'dotenv';




// production or development 
const NODE_ENV = process.env.NODE_ENV ; 

config({ path: resolve(__dirname,`../../.env.${NODE_ENV}`)})

export const PORT:number = Number(process.env.PORT ) || 3000; 
export const DB_URI:string = process.env.DB_URI!
export const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS) 


export const EMAIL: string = process.env.EMAIL!
export const PASSWORD: string = process.env.PASSWORD!

export const REDIS_URL: string = process.env.REDIS_URL!

export const PREFIX: string = process.env.PREFIX!

export const ACCESS_SECRET_KEY: string = process.env.ACCESS_SECRET_KEY!
export const REFRESH_SECRET_KEY: string = process.env.REFRESH_SECRET_KEY!

export const CLIENT_ID: string = process.env.CLIENT_ID!
