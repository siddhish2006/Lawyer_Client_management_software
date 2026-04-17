import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";

export class WebhookController {
  static async handleGupshup(req: Request, res: Response) {
    const queryToken =
      typeof req.query.token === "string" ? req.query.token : null;
    const headerToken =
      typeof req.headers["x-webhook-token"] === "string"
        ? req.headers["x-webhook-token"]
        : null;

    await NotificationService.handleGupshupWebhook(
      req.body,
      queryToken ?? headerToken
    );

    res.status(204).send();
  }
}
