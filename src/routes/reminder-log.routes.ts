import { Router } from "express";
import { ReminderLogController } from "../controllers/reminder-log.controller";
import { asyncHandler } from "../utils/asynchandler";

const router = Router();

router.get("/", asyncHandler(ReminderLogController.list));

export default router;
