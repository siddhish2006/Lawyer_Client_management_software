import { Router } from "express";
import { HearingController } from "../controllers/hearing.controller";
import { asyncHandler } from "../utils/asynchandler";
import { validateDto } from "../middlewares/validation.middleware";
import {
  CreateHearingValidator,
  UpdateHearingValidator,
} from "../validators/hearing.validator";

const router = Router();

// CREATE HEARING
router.post(
  "/",
  validateDto(CreateHearingValidator),
  asyncHandler(HearingController.create)
);

// UPDATE HEARING
router.patch(
  "/:id",
  validateDto(UpdateHearingValidator),
  asyncHandler(HearingController.update)
);

// LIST HEARINGS
router.get(
  "/",
  asyncHandler(HearingController.list)
);

// GET HEARING BY ID
router.get(
  "/:id",
  asyncHandler(HearingController.getById)
);

// DELETE HEARING
router.delete(
  "/:id",
  asyncHandler(HearingController.delete)
);

export default router;
