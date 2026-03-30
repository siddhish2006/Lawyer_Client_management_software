import { Router } from "express";
import { CourtComplexController } from "../controllers/court-complex.controller";
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
  asyncHandler(CourtComplexController.create)
);

router.patch(
  "/:id",
  validateDto(UpdateMasterValidator),
  asyncHandler(CourtComplexController.update)
);

router.get("/", asyncHandler(CourtComplexController.list));

router.get("/:id", asyncHandler(CourtComplexController.getById));

router.delete("/:id", asyncHandler(CourtComplexController.delete));

export default router;