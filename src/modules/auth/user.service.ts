import { RoleEnum } from './../../common/enum/user.enum';
import { NextFunction, Request, Response } from "express";
import { IUser } from "../../models/user.model";
import { HydratedDocument } from "mongoose";
import { confirmEmailType, resendOtpSchemaType, signInSchemaType, signUpType } from "./user.validation";
import { AppError } from "../../common/utiliti/global-error-handling";
import { UserRepository } from "../../DB/Repository/user.repository";
import { decrypt, encrypt } from "../../common/utiliti/security/encrypt.security";
import { Compare, Hash } from "../../common/utiliti/security/hash.security";
import { generateOtp, sendEmail } from "../../common/utiliti/email/send.email";
import { emailTemplate } from "../../common/utiliti/email/email.template";
import { randomUUID } from "node:crypto";
import {  ACCESS_SECRET_KEY_ADMIN, ACCESS_SECRET_KEY_USER, CLIENT_ID, REFRESH_SECRET_KEY_ADMIN, REFRESH_SECRET_KEY_USER } from "../../config/config.service";
import { providerEnum } from "../../common/enum/user.enum";
import { redisClient } from "../../DB/redis.service";
import { IRequest } from "../../common/middlware/authentication";
import {OAuth2Client, TokenPayload} from 'google-auth-library';
import { eventEmitter } from "../../common/utiliti/email/email.events";
import { EventEnum } from "../../common/enum/event.enum";
import radisService from "../../common/service/radis.service";
import tokenService from "../../common/middlware/token";



class UserService {
    private readonly _userModel = new UserRepository();
    private readonly _radisService =  radisService;
    private readonly _tokenService = tokenService;


    constructor(){}
     signUp =  async (req: Request, res: Response, next: NextFunction)  => {
        const { userName, email, password, age, gender, address, phone }: signUpType = req.body ; 
        const UserExist = await this._userModel.findOne({filter: {email}})

        if(UserExist){
         throw new AppError("User already exist", 409)
        }
        const user: HydratedDocument<IUser>= await this._userModel.create({ 
           userName,
           email, 
           password: password,
           age, 
           gender, 
           address, 
           phone: phone? encrypt(phone): null
          } as Partial<IUser>);

         const otp = await generateOtp(); 
         eventEmitter.emit(EventEnum.confirmEmail, async()=>{
            await sendEmail({to: email, subject: "Email confirmation", html: emailTemplate(otp)})
            await this._radisService.setValue({key:this._radisService.otp_key({email: email, subject: EventEnum.confirmEmail}) , value : Hash({ plainText: `${otp}` }) , ttl :60 * 2 })
            await this._radisService.setValue({key:this._radisService.max_otp_key(email) , value : 1 , ttl :60 * 10 })
        })
        

        res.status(201).json({message: "done", data: user})
      };

     signIn =  async (req: Request, res: Response, next: NextFunction) => {

      const {email, password}: signInSchemaType = req.body; 
      const user = await this._userModel.findOne({filter: {email,confirmed: { $exists: true }, provider: providerEnum.System} } )
      if(!user){
            throw new AppError("User does not found", 404)
      }

      // check if user is blocked
      const isBlocked = await this._radisService.ttl(this._radisService.block_login_key(email ));
      if (isBlocked > 0) {
            throw new AppError(`Your account is blocked, try again after ${isBlocked} seconds`, 400 );
      } 
      
      if (!Compare({ plainText: password, cipherText: user.password })) {
            const attempts_key = this._radisService.login_attempts_key(email)

            // increase attempts
            const attempts = await this._radisService.incr(attempts_key);

            // ttl for the attempts 
            await this._radisService.expire({ key: attempts_key, ttl: 60*10 });

            // block after 5 tries
            if (attempts >= 5) {
                  await this._radisService.setValue({
                  key: this._radisService.block_login_key( email ),
                  value: 1,
                  ttl: 60 * 5 // 5 minutes
                  });

                  await this._radisService.deleteKey(this._radisService.login_attempts_key(email ));
                  throw new AppError("Account blocked for 5 minutes",  400 );
            }

            throw new AppError("inValid password", 400);
      }
      
    // reset attempts after success
    await this._radisService.deleteKey(this._radisService.login_attempts_key(email ));

      // to generate random token Id 
      const jwtId = randomUUID();

      // 3. generate tokens
      const access_token = this._tokenService.GenerateToken({
      payload: { id: user._id},
      secret_key: user?.role == RoleEnum.user ? ACCESS_SECRET_KEY_USER : ACCESS_SECRET_KEY_ADMIN,
      options : {
            expiresIn: "1h",
            jwtid: jwtId
      }
      }); 

      const refresh_token = this._tokenService.GenerateToken({
      payload: { id: user._id},
      secret_key: user?.role == RoleEnum.user ? REFRESH_SECRET_KEY_USER : REFRESH_SECRET_KEY_ADMIN,
      options : {
            expiresIn: "1y",
            jwtid: jwtId
      }
      }); 

    // 4. Success response
    return res.status(200).json({
        message: "done",
        access_token: access_token,
        refresh_token: refresh_token
    });


      };

     confirmEmail =  async (req: Request, res: Response, next: NextFunction) => {
            const {email, otp}: confirmEmailType = req.body; 

            const otpValue = await this._radisService.get(this._radisService.otp_key({ email, subject: EventEnum.confirmEmail }) )
            if (!otpValue){
              throw new AppError("otp expired", 400);
            }

             if (!Compare({ plainText: otp, cipherText: otpValue })) {
                throw new AppError("inValid otp", 400);
              }
            const user = await this._userModel.findOneAndUpdate({
            filter: { email ,confirmed: {$exists:false}, provider:providerEnum.System},
            update: { confirmed: true }
            })

              if (!user) {
                 throw new AppError("user not exist",400);
              }
            
              await this._radisService.deleteKey(this._radisService.otp_key({  email, subject: EventEnum.confirmEmail}))
            
              res.status(201).json({ message: "email confirmed successfully" });
      };

     getProfile = async (req: IRequest, res: Response, next: NextFunction) => {

            const user = req.user!.toObject() as any;;
            user.phone = user.phone ? decrypt(user.phone) : null;

            return res.status(200).json({
            message: "done",
            data: user
            });

};
     forgetPassword  =  async (req: Request, res: Response, next: NextFunction) => {
            const { email } = req.body;
            const user = await this._userModel.findOne({filter:  {email,confirmed: { $exists: true }}})
              if (!user) {
                  throw new AppError("user not exist or not confirmed",404);
            }
         const otp = await generateOtp(); 

         await sendEmail({to: email, subject: "Forget password", html: emailTemplate(otp)})

         await this._radisService.setValue({
            key: this._radisService.otp_key({ email, subject: EventEnum.forgetPassword}),
            value: Hash({ plainText: `${otp}` }),
            ttl: 60 * 2
            });

         res.status(200).json({ message: "OTP send it to the email" });    
      };

      resetPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
            const { email, otp, newPassword } = req.body;
            const storedOtp = await this._radisService.get(this._radisService.otp_key({email, subject: EventEnum.forgetPassword}))
            if (!storedOtp) {
               throw new AppError("OTP expired", 400 );
            }

            if (!Compare({ plainText: otp, cipherText: storedOtp })) {
                throw new AppError("Invalid OTP",  400);
            }
            const user = await this._userModel.findOne({ filter: { email } });
              if (!user) {
                  throw new AppError("user not exist or not confirmed",404);
            }          
              // 2. update password
              user.password = newPassword;
            
              // (logout from all devices)
              user.changeCredential = new Date();
            
              await user.save();
            
              // 3. delete OTP
              await this._radisService.deleteKey(this._radisService.otp_key({ email, subject: EventEnum.forgetPassword }));
            
              return res.status(200).json({
                message: "Password reset successfully",
              });


     };

      updatePassword = async (req: Request, res: Response, next: NextFunction) => {

            const { oldPassword, newPassword } = req.body;

            const user = (req as any).user;

            // 1. check old password
            if (!Compare({ plainText: oldPassword, cipherText: user.password })) {
            throw new AppError("invalid old password", 400);
            }

            // 2. update password
            user.password = newPassword;

            // 3. logout from all devices
            user.changeCredential = new Date();

            // 4. save
            await user.save();

            return res.status(200).json({
            message: "password updated successfully",
            });
      };

      logOut = async (req: IRequest, res: Response, next: NextFunction) => {
            
      // logout from all devices
      const { flag } = req.body ; 
    
    if (flag.toLowerCase() === "all"){
            req.user!.changeCredential = new Date();
            await req.user!.save();

            const userKeys = await this._radisService.keys(this._radisService.get_key({ userId: req.user!._id }));

            if (userKeys.length) {
            await redisClient.del(userKeys);
            }
    }

     // logout from current device
      else{
            await this._radisService.setValue({
                  key: this._radisService.revoke_key({ userId: req.user!._id, jti: req.decoded!.jti }),
                  value: `${req.decoded!.jti}`,
                  ttl: req.decoded!.exp! - Math.floor( Date.now() / 1000)       
            })

      }
        
    return res.status(200).json({message: "Done." });
      }; 

     signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {

       const { idToken } = req.body;

        const client = new OAuth2Client();

        const ticket = await client.verifyIdToken({
            idToken,
            // client iid
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();
        console.log(payload)
      const { email, email_verified, name } = payload as TokenPayload;

      if (!email || !email_verified) {
           throw new AppError("Invalid Google account", 400);
      }

        let user = await this._userModel.findOne({
            filter: { email }
        });

            if (!user) {
            const parts = name?.split(" ") || [];
            const firstName = parts[0] || "User";
            const lastName = parts.slice(1).join(" ") || "User";

            user = await this._userModel.create({
            email,
            confirmed: email_verified,
            firstName,
            lastName,
            provider: providerEnum.Google
            });
            }

            if (user.provider === providerEnum.System) {
            throw new AppError("please log in on system only", 400 );
        }

        const access_token = this._tokenService.GenerateToken({
            payload: {
                id: user._id,
                email: user.email
            },
            secret_key: user?.role == RoleEnum.user ? ACCESS_SECRET_KEY_USER : ACCESS_SECRET_KEY_ADMIN,
            options: {
                expiresIn: "1d",
            }
        });

        return res.status(200).json({
            message: "done",
            access_token,
            user
        });

};
   

      resendOtp = async  (req: Request, res: Response, next: NextFunction) => {
      const { email }: resendOtpSchemaType = req.body

      const user = await this._userModel.findOne({
      filter: { email, confirmed: { $exists: false }, provider: providerEnum.System },
      })

      if (!user) {
      throw new AppError("user not exist or already confirmed");
      }

      await this.sendEmailOtp({email,subject: EventEnum.confirmEmail});
      res.status(201).json({ message: "done" });

      }

     sendEmailOtp = async ({ email, subject }: {email:string, subject: EventEnum}) => {
        const isBlocked = await this._radisService.ttl(this._radisService.block_otp_key( email ));

        if (isBlocked > 0) {
          throw new AppError(`you blocked please try again after ${isBlocked} seconds`);
        }
      
        const key = this._radisService.otp_key({ email, subject });
      
        const ttlOtp = await this._radisService.ttl(key);
        if (ttlOtp > 0) {
          throw new AppError(
            `you already have otp not expired yet please try again after ${ttlOtp} seconds`
          );
        }
      
        if ((await this._radisService.get( this._radisService.max_otp_key( email ) )) >= 3) {
          await this._radisService.setValue({
            key: this._radisService.block_otp_key( email ),
            value: 1,
            ttl: 15 * 60,
          });
          throw new AppError(`you exceed maximum number of trials`);
        }
      
        const otp = await generateOtp();
        eventEmitter.emit(EventEnum.confirmEmail, async()=>{
          await sendEmail({
              to: email,
              subject,
              html: emailTemplate(otp)
          });
      
          await this._radisService.setValue({
              key,
              value: Hash({ plainText: `${otp}` }),
              ttl: 60 * 2,
          });
      
          await this._radisService.incr(this._radisService.max_otp_key( email ));
          })
      
        
      };
      
};


export default new UserService();