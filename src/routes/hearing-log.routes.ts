import { Router } from "express";
import { HearingLogController } from "../controllers/hearing-log.controller";
import { asyncHandler } from "../utils/asynchandler";
import { validateDto } from "../middlewares/validation.middleware";
import { CreateHearingLogDTO } from "../dtos/hearing/CreateHearingLog.dto";

const router = Router();

router.get("/", asyncHandler(HearingLogController.list));

router.post(
  "/",
  validateDto(CreateHearingLogDTO),
  asyncHandler(HearingLogController.create)
);

router.delete("/:id", asyncHandler(HearingLogController.delete));

export default router;
