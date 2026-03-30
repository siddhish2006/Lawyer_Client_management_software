import { Request, Response } from "express";
import { CaseTypeService } from "../services/case-type.service";

export class CaseTypeController {

  //-------------------------------------
  // CREATE
  //-------------------------------------

  static async create(req: Request, res: Response) {
    const result = await CaseTypeService.create(req.body);
    res.status(201).json(result);
  }

  //-------------------------------------
  // GET BY ID
  //-------------------------------------

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await CaseTypeService.getById(id);
    res.json(result);
  }

  //-------------------------------------
  // LIST
  //-------------------------------------

  static async list(req: Request, res: Response) {
    const result = await CaseTypeService.list(req.query);
    res.json(result);
  }

  //-------------------------------------
  // UPDATE
  //-------------------------------------

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await CaseTypeService.update(id, req.body);
    res.json(result);
  }

  //-------------------------------------
  // DELETE
  //-------------------------------------

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await CaseTypeService.delete(id);
    res.status(204).send();
  }
}
