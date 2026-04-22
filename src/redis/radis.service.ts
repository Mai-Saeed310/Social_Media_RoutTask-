import { Types } from 'mongoose';
import { AppError } from "../common/utiliti/global-error-handling";
import { redisClient } from "../DB/redis.service";



export const revoke_key = ({userId, jti}: {userId: Types.ObjectId, jti: string | undefined}) => {
  return `revoke_token::${userId}::${jti}`
}


export const get_key = ({ userId }:{userId: Types.ObjectId}) => {
    return `revoke_token::${userId}`
}

export const otp_key = ({ email, subject }:{email: string, subject: string;}) => {
    return `otp::${email}::${subject}`;
}

export const max_otp_key = ( email: string) => {
    return `otp::${email}::max_tries`
}

export const block_otp_key = ( email: string)=> {
    return `otp::${email}::block`
}

export const block_login_key = ( email: string)=> {
    return `login::${email}::block`
}

export const login_attempts_key  = ( email: string) => {
   return `login_attempts::${email}`;
}


export const setValue = async ({ key, value, ttl }:{key:string, value:unknown, ttl?:number} ) => {
    try { 
        // to conver data to string if it is object
        const data = typeof value === "string" ? value : JSON.stringify(value)
        // check if there is TTL 
        return ttl ? await redisClient.set(key, data, { EX: ttl }) : await redisClient.set(key, data)
    } catch (error) {
       console.error(error)
       throw new AppError("fail to set operation", 400);
    }
}

export const update = async ({ key, value, ttl }: {key:string, value:unknown, ttl?:number} ) => {
    try {
        if (!await redisClient.exists(key)) {
            return 0
        }

        if(ttl)
          return await setValue({ key, value, ttl }); 

       else 
          return await setValue({ key, value})

    } catch (error) {
        console.error(error);
        throw new AppError("fail to update operation", 400);   
     }
}

export const exists = async (key:string) => {
    try {
        return await redisClient.exists(key)
    } catch (error) {
        console.error(error);
        throw new AppError("error to check data exists in redis", 400);   
    }
}

export const deleteKey = async ( key: string) => {
    try {
        if(!key.length){
           return 0 
        }
        return await redisClient.del(key)
    } catch (error) {
        console.error(error);
        throw new AppError("error to delete data from redis", 400);   

    }
}

export const get = async (key: string) => {
     if (!await redisClient.exists(key)) {
            return 0
        }
        // if the data stored as an object 
    try {
        try {
            const value = await redisClient.get(key);

            if (!value) {
            return 0;
            }
            return JSON.parse(value)

        // if data stored like a string 
        } catch (error) {
            return await redisClient.get(key)
        }
    } catch (error) {
        console.error(error);
        throw new AppError("error to get data from redis", 400);  
    }
}


export const ttl = async (key:string) => {
    try {
        return await redisClient.ttl(key)
    } catch (error) {
        console.error(error);
        throw new AppError("error to get ttl from redis", 400);  
    }
}

export const keys = async (pattern:string) => {
    try {
        return await redisClient.keys(`${pattern}*`)
    } catch (error) {
         console.error(error);
        throw new AppError("error to get keys from redis", 400);  
    }
}

export const expire = async ({ key, ttl } : {key: string, ttl: number}) => {
    try {
      return await redisClient.expire(key, ttl)
    } catch (error) {
        console.error(error);
        throw new AppError("fail to set operation", 400);  
    }
}

export const incr = async (key:string) => {
  try {
    return await redisClient.incr(key)
  } catch (error) {
    console.error(error);
    throw new AppError("fail to increament operation", 400);  
  }
} 