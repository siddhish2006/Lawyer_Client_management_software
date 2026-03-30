import { Router } from "express";
import { OpponentController } from "../controllers/opponent.controller";
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
  asyncHandler(OpponentController.create)
);

router.patch(
  "/:id",
  validateDto(UpdatePartyValidator),
  asyncHandler(OpponentController.update)
);

router.get("/", asyncHandler(OpponentController.list));

router.get("/:id", asyncHandler(OpponentController.getById));

router.delete("/:id", asyncHandler(OpponentController.delete));

export default router;