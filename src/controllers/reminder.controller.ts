import { Request, Response } from "express";
import { ReminderService } from "../services/reminder.service";

export class ReminderController {
  static async create(req: Request, res: Response) {
    const item = await ReminderService.create(req.body);
    res.status(201).json(item);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await ReminderService.getById(id);
    res.json(item);
  }

  static async list(req: Request, res: Response) {
    const items = await ReminderService.list(req.query);
    res.json(items);
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await ReminderService.update(id, req.body);
    res.json(item);
  }

  static async delete(req: Request, res: Response) {
    await ReminderService.delete(Number(req.params.id));
    res.status(204).send();
  }
}
