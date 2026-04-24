import jwt, { JwtPayload, Secret, SignOptions, VerifyOptions } from "jsonwebtoken";


// middleware func to get and verify  token from the header 

 class TokenService{
    constructor(){}
     GenerateToken = ({ payload, secret_key, options }: {payload:  object,secret_key: Secret , options?: SignOptions }  ) : string => {
    return jwt.sign(payload, secret_key, options)
}

   VerifyToken = ({ token, secret_key, options} :{ token: string, secret_key: Secret, options?: VerifyOptions} ) : JwtPayload => {
    return jwt.verify(token, secret_key, options) as JwtPayload
}

}

export default new TokenService();