import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asynchandler";
import { validateDto } from "../middlewares/validation.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  RegisterValidator,
  LoginValidator,
  OtpVerifyValidator,
  ResendOtpValidator,
  ForgotPasswordValidator,
  ResetPasswordValidator,
  UpdateProfileValidator,
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
  validateDto(LoginValidator),
  asyncHandler(AuthController.login)
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

router.patch(
  "/profile",
  requireAuth,
  validateDto(UpdateProfileValidator),
  asyncHandler(AuthController.updateProfile)
);

export default router;
