import { Request, Response } from "express";
import { HearingLogService } from "../services/hearing-log.service";

export class HearingLogController {
  static async list(req: Request, res: Response) {
    const logs = await HearingLogService.list(req.query);
    res.json(logs);
  }

  static async create(req: Request, res: Response) {
    const log = await HearingLogService.create(req.body);
    res.status(201).json(log);
  }

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await HearingLogService.delete(id);
    res.status(204).send();
  }
}
