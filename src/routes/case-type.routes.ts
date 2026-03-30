import { Router } from "express";
import { CaseTypeController } from "../controllers/case-type.controller";
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
  asyncHandler(CaseTypeController.create)
);

router.patch(
  "/:id",
  validateDto(UpdateMasterValidator),
  asyncHandler(CaseTypeController.update)
);

router.get("/", asyncHandler(CaseTypeController.list));

router.get("/:id", asyncHandler(CaseTypeController.getById));

router.delete("/:id", asyncHandler(CaseTypeController.delete));

export default router;