import z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";



export const signUpSchema = {
    body:z.object({
    userName: z.string({error:"userName is required"}).min(3).max(25),
    email: z.string().email(),
    password: z.string().min(6),
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






// try {
//   signUpSchema.parse(req.body)
// } catch (error: any) {
//   throw new AppError(JSON.parse(error.message))
// }

// await signUpSchema.parseAsync(req.body).catch((error: any) => {
//   throw new AppError(JSON.parse(error.message), 400)
// })