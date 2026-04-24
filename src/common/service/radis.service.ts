import { createClient, RedisClientType } from "redis";
import { REDIS_URL } from "../../config/config.service";
import { Types } from "mongoose";
import { EventEnum } from "../enum/event.enum";
import { AppError } from "../utiliti/global-error-handling";





export class radisService {
    private readonly client : RedisClientType
    constructor(){
        this.client =  createClient({
         url: REDIS_URL
    })
}

    redisConnection = async () => {
        try {
            await this.client.connect()
            console.log("Success to connect with redis.")
        } catch (error) {
            console.log("error to connect with redis", error)
        }
    }



     revoke_key = ({userId, jti}: {userId: Types.ObjectId, jti: string | undefined}) => {
  return `revoke_token::${userId}::${jti}`
}


     get_key = ({ userId }:{userId: Types.ObjectId}) => {
    return `revoke_token::${userId}`
}

     otp_key = ({ email, subject }:{email: string, subject: EventEnum;}) => {
    return `otp::${email}::${subject}`;
}

     max_otp_key = ( email: string) => {
    return `otp::${email}::max_tries`
}

     block_otp_key = ( email: string)=> {
         return `otp::${email}::block`
}

     block_login_key = ( email: string)=> {
         return `login::${email}::block`
}

     login_attempts_key  = ( email: string) => {
   return `login_attempts::${email}`;
}



     setValue = async ({ key, value, ttl }:{key:string, value:unknown, ttl?:number} ) => {
    try { 
        // to conver data to string if it is object
        const data = typeof value === "string" ? value : JSON.stringify(value)
        // check if there is TTL 
        return ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data)
    } catch (error) {
       console.error(error)
       throw new AppError("fail to set operation", 400);
    }
}

     update = async ({ key, value, ttl }: {key:string, value:unknown, ttl?:number} ) => {
    try {
        if (!await this.client.exists(key)) {
            return 0
        }

        if(ttl)
          return await this.setValue({ key, value, ttl }); 

       else 
          return await this.setValue({ key, value})

    } catch (error) {
        console.error(error);
        throw new AppError("fail to update operation", 400);   
     }
}


    exists = async (key:string) => {
    try {
        return await this.client.exists(key)
    } catch (error) {
        console.error(error);
        throw new AppError("error to check data exists in redis", 400);   
    }
}

     deleteKey = async ( key: string | string[]) => {
    try {
        if(!key.length){
           return 0 
        }
        return await this.client.del(key)
    } catch (error) {
        console.error(error);
        throw new AppError("error to delete data from redis", 400);   

    }
}

     get = async (key: string) => {
     if (!await this.client.exists(key)) {
            return 0
        }
        // if the data stored as an object 
    try {
        try {
            const value = await this.client.get(key);

            if (!value) {
            return 0;
            }
            return JSON.parse(value)

        // if data stored like a string 
        } catch (error) {
            return await this.client.get(key)
        }
    } catch (error) {
        console.error(error);
        throw new AppError("error to get data from redis", 400);  
    }
}


 ttl = async (key:string) => {
    try {
        return await this.client.ttl(key)
    } catch (error) {
        console.error(error);
        throw new AppError("error to get ttl from redis", 400);  
    }
}

 keys = async (pattern:string) => {
    try {
        return await this.client.keys(`${pattern}*`)
    } catch (error) {
         console.error(error);
        throw new AppError("error to get keys from redis", 400);  
    }
}

 expire = async ({ key, ttl } : {key: string, ttl: number}) => {
    try {
      return await this.client.expire(key, ttl)
    } catch (error) {
        console.error(error);
        throw new AppError("fail to set operation", 400);  
    }
}

 incr = async (key:string) => {
  try {
    return await this.client.incr(key)
  } catch (error) {
    console.error(error);
    throw new AppError("fail to increament operation", 400);  
  }
} 


}   
export default new radisService();