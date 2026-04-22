import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";


// middleware func to get and verify  token from the header 

export const GenerateToken = ({ payload, secret_key, options }: {payload: string | object | Buffer,secret_key: string,options?: SignOptions }  ) => {
    return jwt.sign(payload, secret_key, options)
}

export const VerifyToken = ({ token, secret_key, options} :{ token: string, secret_key: string, options?: VerifyOptions}) => {
    return jwt.verify(token, secret_key, options)
}
