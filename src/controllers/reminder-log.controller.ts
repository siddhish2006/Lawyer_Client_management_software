import { Request, Response } from "express";
import { ReminderLogService } from "../services/reminder-log.service";

export class ReminderLogController {
  static async list(req: Request, res: Response) {
    const logs = await ReminderLogService.list(req.query);
    res.json(logs);
  }
}
