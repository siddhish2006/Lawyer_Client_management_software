import { Request, Response } from "express";
import { CourtComplexService } from "../services/court-complex.service";

export class CourtComplexController {

  //-------------------------------------
  // CREATE
  //-------------------------------------

  static async create(req: Request, res: Response) {
    const result = await CourtComplexService.create(req.body);
    res.status(201).json(result);
  }

  //-------------------------------------
  // GET BY ID
  //-------------------------------------

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await CourtComplexService.getById(id);
    res.json(result);
  }

  //-------------------------------------
  // LIST
  //-------------------------------------

  static async list(req: Request, res: Response) {
    const result = await CourtComplexService.list(req.query);
    res.json(result);
  }

  //-------------------------------------
  // UPDATE
  //-------------------------------------

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await CourtComplexService.update(id, req.body);
    res.json(result);
  }

  //-------------------------------------
  // DELETE
  //-------------------------------------

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await CourtComplexService.delete(id);
    res.status(204).send();
  }
}
