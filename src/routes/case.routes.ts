import { Router } from "express";
import { CaseController } from "../controllers/case.controller";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/asynchandler";

import { CaseValidator } from "../validators/case.validator";

const router = Router();

router.post(
  "/",
  validateDto(CaseValidator.create),
  asyncHandler(CaseController.create)
);

router.patch(
  "/:id",
  validateDto(CaseValidator.update),
  asyncHandler(CaseController.update)
);

router.get(
  "/",
  asyncHandler(CaseController.list)
);

router.get(
  "/:id",
  asyncHandler(CaseController.getById)
);

router.delete(
  "/:id",
  asyncHandler(CaseController.delete)
);

export default router;
