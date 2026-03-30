import { Request, Response } from "express";
import { DistrictService } from "../services/district.service";

export class DistrictController {

  //-------------------------------------
  // CREATE
  //-------------------------------------

  static async create(req: Request, res: Response) {
    const result = await DistrictService.create(req.body);
    res.status(201).json(result);
  }

  //-------------------------------------
  // GET BY ID
  //-------------------------------------

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await DistrictService.getById(id);
    res.json(result);
  }

  //-------------------------------------
  // LIST
  //-------------------------------------

  static async list(req: Request, res: Response) {
    const result = await DistrictService.list(req.query);
    res.json(result);
  }

  //-------------------------------------
  // UPDATE
  //-------------------------------------

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await DistrictService.update(id, req.body);
    res.json(result);
  }

  //-------------------------------------
  // DELETE
  //-------------------------------------

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await DistrictService.delete(id);
    res.status(204).send();
  }
}
