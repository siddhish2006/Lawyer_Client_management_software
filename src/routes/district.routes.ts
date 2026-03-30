import { Router } from "express";
import { DistrictController } from "../controllers/district.controller";
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
  asyncHandler(DistrictController.create)
);

router.patch(
  "/:id",
  validateDto(UpdateMasterValidator),
  asyncHandler(DistrictController.update)
);

router.get("/", asyncHandler(DistrictController.list));

router.get("/:id", asyncHandler(DistrictController.getById));

router.delete("/:id", asyncHandler(DistrictController.delete));

export default router;