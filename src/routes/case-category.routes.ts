import { Router } from "express";
import { CaseCategoryController } from "../controllers/case-category.controller";
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
  asyncHandler(CaseCategoryController.create)
);

router.patch(
  "/:id",
  validateDto(UpdateMasterValidator),
  asyncHandler(CaseCategoryController.update)
);

router.get("/", asyncHandler(CaseCategoryController.list));

router.get("/:id", asyncHandler(CaseCategoryController.getById));

router.delete("/:id", asyncHandler(CaseCategoryController.delete));

export default router;