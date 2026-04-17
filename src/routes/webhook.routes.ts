import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";
import { asyncHandler } from "../utils/asynchandler";

const router = Router();

router.post("/gupshup", asyncHandler(WebhookController.handleGupshup));

export default router;
