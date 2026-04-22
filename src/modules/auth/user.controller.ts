import { Router } from "express";
import UserService from "./user.service";
import { Validation } from "../../common/middlware/validation";
import * as UV from "./user.validation";
import { authentication } from "../../common/middlware/authentication";



export const authRouter = Router();

authRouter.post("/sign-up",Validation(UV.signUpSchema),UserService.signUp);
authRouter.post("/sign-in",UserService.signIn);

authRouter.post("/confirm-email",UserService.confirmEmail);

authRouter.post("/signup/gmail", UserService.signUpWithGmail);

authRouter.post("/forgetPassword", UserService.forgetPassword);
authRouter.post("/resetPasswordOtp", UserService.resetPasswordOtp);
authRouter.post("/updatePassword", authentication,UserService.updatePassword);

authRouter.post("/logOut", authentication,UserService.logOut);

authRouter.post("/users/signup/gmail", UserService.signUpWithGmail);
