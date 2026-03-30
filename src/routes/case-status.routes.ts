import { Router } from "express";
import { CaseStatusController } from "../controllers/case-status.controller";
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
  asyncHandler(CaseStatusController.create)
);

router.patch(
  "/:id",
  validateDto(UpdateMasterValidator),
  asyncHandler(CaseStatusController.update)
);

router.get("/", asyncHandler(CaseStatusController.list));

router.get("/:id", asyncHandler(CaseStatusController.getById));

router.delete("/:id", asyncHandler(CaseStatusController.delete));

export default router;