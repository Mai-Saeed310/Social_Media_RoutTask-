import { Router } from "express";
import UserService from "./user.service";
import { Validation } from "../../common/middlware/validation";
import * as UV from "./user.validation";
import { authentication } from "../../common/middlware/authentication";
import { authorization } from "../../common/middlware/authorization";
import { RoleEnum } from "../../common/enum/user.enum";



export const authRouter = Router();

authRouter.post("/sign-up",Validation(UV.signUpSchema),UserService.signUp);
authRouter.post("/sign-in",Validation(UV.signInSchema),UserService.signIn);

authRouter.post("/confirm-email",UserService.confirmEmail);


authRouter.post("/forgetPassword", UserService.forgetPassword);
authRouter.post("/resetPasswordOtp", UserService.resetPasswordOtp);
authRouter.post("/updatePassword", authentication,UserService.updatePassword);

authRouter.post("/logOut", authentication,UserService.logOut);

authRouter.post("/signup/gmail", UserService.signUpWithGmail);
authRouter.post("/resend-otp", Validation(UV.resendOtpSchema),UserService.resendOtp);


authRouter.get("/profile",authentication,authorization([RoleEnum.user]),UserService.getProfile);
