import { Router } from "express";
import { CourtNameController } from "../controllers/court-name.controller";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/asynchandler";
import {
  CreateMasterValidator,
  UpdateMasterValidator,
} from "../validators/master.validator";

const router = Router();

router.post(
  "/",
  validateDto(CreateMasterValidator),
  asyncHandler(CourtNameController.create)
);

router.patch(
  "/:id",
  validateDto(UpdateMasterValidator),
  asyncHandler(CourtNameController.update)
);

router.get("/", asyncHandler(CourtNameController.list));

router.get("/:id", asyncHandler(CourtNameController.getById));

router.delete("/:id", asyncHandler(CourtNameController.delete));

export default router;