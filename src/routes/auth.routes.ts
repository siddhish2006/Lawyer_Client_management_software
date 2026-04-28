import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asynchandler";
import { validateDto } from "../middlewares/validation.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  RegisterValidator,
  LoginInitValidator,
  OtpVerifyValidator,
  ResendOtpValidator,
  ForgotPasswordValidator,
  ResetPasswordValidator,
} from "../validators/auth.validator";

const router = Router();

router.post(
  "/register",
  validateDto(RegisterValidator),
  asyncHandler(AuthController.register)
);

router.post(
  "/register/verify",
  validateDto(OtpVerifyValidator),
  asyncHandler(AuthController.verifyRegister)
);

router.post(
  "/login",
  validateDto(LoginInitValidator),
  asyncHandler(AuthController.loginInit)
);

router.post(
  "/login/verify",
  validateDto(OtpVerifyValidator),
  asyncHandler(AuthController.verifyLogin)
);

router.post(
  "/resend-otp",
  validateDto(ResendOtpValidator),
  asyncHandler(AuthController.resendOtp)
);

router.post(
  "/forgot-password",
  validateDto(ForgotPasswordValidator),
  asyncHandler(AuthController.forgotPassword)
);

router.post(
  "/reset-password",
  validateDto(ResetPasswordValidator),
  asyncHandler(AuthController.resetPassword)
);

router.get("/me", requireAuth, asyncHandler(AuthController.me));

export default router;
