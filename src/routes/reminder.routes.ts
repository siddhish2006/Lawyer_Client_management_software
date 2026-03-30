import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import { validateDto } from "../middlewares/validation.middleware";
import { ReminderController } from "../controllers/reminder.controller";
import {
  CreateReminderValidator,
  UpdateReminderValidator,
} from "../validators/reminder.validator";

const router = Router();

router.post(
  "/",
  validateDto(CreateReminderValidator),
  asyncHandler(ReminderController.create)
);

router.get("/", asyncHandler(ReminderController.list));

router.get("/:id", asyncHandler(ReminderController.getById));

router.patch(
  "/:id",
  validateDto(UpdateReminderValidator),
  asyncHandler(ReminderController.update)
);

router.delete("/:id", asyncHandler(ReminderController.delete));

export default router;
