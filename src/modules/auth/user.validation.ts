import z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";



export const confirmEmailSchema = {
    body: z.object({
    email: z.string().email(),
    otp: z.string().regex(/ ^d{6}$/)

  })
  }

export type confirmEmailType = z.infer< typeof confirmEmailSchema.body>


export const signInSchema = {
    body:z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })
  }

export type signInSchemaType = z.infer< typeof signInSchema.body>

export const signUpSchema = {
    body: signInSchema.body.safeExtend({
    userName: z.string({error:"userName is required"}).min(3).max(25),
    cPassword: z.string().min(6),
    age: z.number().min(18).max(60),
    gender: z.enum(GenderEnum).optional(), 
    address: z.string().min(3).max(25).optional(),
    phone: z.string().optional()

  }).refine((data)=>{
    return data.password  === data.cPassword  
  },{
    message: "Passwards are not match",
    path:["cPassward"]
  })
  }

export type signUpType = z.infer< typeof signUpSchema.body>



export const resendOtpSchema = {
    body:z.object({
    email: z.string().email()
  })
  }

export type resendOtpSchemaType = z.infer< typeof resendOtpSchema.body>




















// try {
//   signUpSchema.parse(req.body)
// } catch (error: any) {
//   throw new AppError(JSON.parse(error.message))
// }

// await signUpSchema.parseAsync(req.body).catch((error: any) => {
//   throw new AppError(JSON.parse(error.message), 400)
// })