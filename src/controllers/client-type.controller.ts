import { Request, Response } from "express";
import { ClientTypeService } from "../services/client-type.service";

export class ClientTypeController {

  //-------------------------------------
  // CREATE
  //-------------------------------------

  static async create(req: Request, res: Response) {
    const result = await ClientTypeService.create(req.body);
    res.status(201).json(result);
  }

  //-------------------------------------
  // GET BY ID
  //-------------------------------------

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await ClientTypeService.getById(id);
    res.json(result);
  }

  //-------------------------------------
  // LIST
  //-------------------------------------

  static async list(req: Request, res: Response) {
    const result = await ClientTypeService.list(req.query);
    res.json(result);
  }

  //-------------------------------------
  // UPDATE
  //-------------------------------------

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await ClientTypeService.update(id, req.body);
    res.json(result);
  }

  //-------------------------------------
  // DELETE
  //-------------------------------------

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await ClientTypeService.delete(id);
    res.status(204).send();
  }
}
