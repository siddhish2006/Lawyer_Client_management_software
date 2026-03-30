import { Request, Response } from "express";
import { CaseCategoryService } from "../services/case-category.service";

export class CaseCategoryController {

  //-------------------------------------
  // CREATE
  //-------------------------------------

  static async create(req: Request, res: Response) {
    const result = await CaseCategoryService.create(req.body);
    res.status(201).json(result);
  }

  //-------------------------------------
  // GET BY ID
  //-------------------------------------

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await CaseCategoryService.getById(id);
    res.json(result);
  }

  //-------------------------------------
  // LIST
  //-------------------------------------

  static async list(req: Request, res: Response) {
    const result = await CaseCategoryService.list(req.query);
    res.json(result);
  }

  //-------------------------------------
  // UPDATE
  //-------------------------------------

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await CaseCategoryService.update(id, req.body);
    res.json(result);
  }

  //-------------------------------------
  // DELETE
  //-------------------------------------

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await CaseCategoryService.delete(id);
    res.status(204).send();
  }
}
