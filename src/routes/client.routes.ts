import { Router } from "express";
import { ClientController } from "../controllers/client.controller";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/asynchandler";

import { CreateClientValidator } from "../validators/client.validator";
import { UpdateClientValidator } from "../validators/updateclient.validator";

const router = Router();

router.post(
  "/",
  validateDto(CreateClientValidator),
  asyncHandler(ClientController.create)
);

router.patch(
  "/:id",
  validateDto(UpdateClientValidator),
  asyncHandler(ClientController.update)
);

router.get(
  "/",
  asyncHandler(ClientController.list)
);

router.get(
  "/:id",
  asyncHandler(ClientController.getById)
);

router.delete(
  "/:id",
  asyncHandler(ClientController.delete)
);

export default router;
