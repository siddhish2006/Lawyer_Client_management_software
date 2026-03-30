import { Router } from "express";
import { DefendantController } from "../controllers/defendant.controller";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/asynchandler";
import {
  CreatePartyValidator,
  UpdatePartyValidator,
} from "../validators/party.validator";

const router = Router();

router.post(
  "/",
  validateDto(CreatePartyValidator),
  asyncHandler(DefendantController.create)
);

router.patch(
  "/:id",
  validateDto(UpdatePartyValidator),
  asyncHandler(DefendantController.update)
);

router.get("/", asyncHandler(DefendantController.list));

router.get("/:id", asyncHandler(DefendantController.getById));

router.delete("/:id", asyncHandler(DefendantController.delete));

export default router;