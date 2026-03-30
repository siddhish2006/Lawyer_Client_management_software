import { Router } from "express";
import { ClientTypeController } from "../controllers/client-type.controller";
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
  asyncHandler(ClientTypeController.create)
);

router.patch(
  "/:id",
  validateDto(UpdateMasterValidator),
  asyncHandler(ClientTypeController.update)
);

router.get("/", asyncHandler(ClientTypeController.list));

router.get("/:id", asyncHandler(ClientTypeController.getById));

router.delete("/:id", asyncHandler(ClientTypeController.delete));

export default router;