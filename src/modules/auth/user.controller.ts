import { store_enum } from './../../common/enum/multer.enum';
import { Router } from "express";
import UserService from "./user.service";
import { Validation } from "../../common/middlware/validation";
import * as UV from "./user.validation";
import { authentication } from "../../common/middlware/authentication";
import { authorization } from "../../common/middlware/authorization";
import { RoleEnum } from "../../common/enum/user.enum";
import multerCloud from "../../common/middlware/multer.cloud";



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
authRouter.post("/upload",multerCloud({}).single("attachment"),UserService.uploadFile);

authRouter.post("/upload-large",authentication,multerCloud({store_type: store_enum.disk}).single("attachment"),UserService.uploadLargeFile);

authRouter.post("/upload-files",authentication,multerCloud({store_type: store_enum.memory}).array("attachments"),UserService.uploadFiles);

authRouter.post("/upload-url",UserService.upload);

authRouter.get("/get-file/*path",UserService.getFile);
authRouter.get("/pre-signed/*path",UserService.getPreSigned);

authRouter.delete("/delete",UserService.deleteFile);
authRouter.delete("/deleteFiles",UserService.deleteFiles);
authRouter.delete("/deleteFolder",UserService.deleteFolder);
