import { Request, Response } from "express";
import { DefendantService } from "../services/defendant.service";

export class DefendantController {
  static async create(req: Request, res: Response) {
    const item = await DefendantService.create(req.body);
    res.status(201).json(item);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await DefendantService.getById(id);
    res.json(item);
  }

  static async list(req: Request, res: Response) {
    const items = await DefendantService.list(req.query);
    res.json(items);
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await DefendantService.update(id, req.body);
    res.json(item);
  }

  static async delete(req: Request, res: Response) {
    await DefendantService.delete(Number(req.params.id));
    res.status(204).send();
  }
}
