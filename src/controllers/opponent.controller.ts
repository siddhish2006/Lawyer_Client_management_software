import { Request, Response } from "express";
import { OpponentService } from "../services/opponent.service";

export class OpponentController {
  static async create(req: Request, res: Response) {
    const item = await OpponentService.create(req.body);
    res.status(201).json(item);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await OpponentService.getById(id);
    res.json(item);
  }

  static async list(req: Request, res: Response) {
    const items = await OpponentService.list(req.query);
    res.json(items);
  }

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await OpponentService.update(id, req.body);
    res.json(item);
  }

  static async delete(req: Request, res: Response) {
    await OpponentService.delete(Number(req.params.id));
    res.status(204).send();
  }
}
