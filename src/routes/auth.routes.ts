import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asynchandler";
import { validateDto } from "../middlewares/validation.middleware";
import { LoginValidator, RegisterValidator } from "../validators/auth.validator";

const router = Router();

router.post(
  "/register",
  validateDto(RegisterValidator),
  asyncHandler(AuthController.register)
);

router.post("/login", validateDto(LoginValidator), asyncHandler(AuthController.login));

export default router;