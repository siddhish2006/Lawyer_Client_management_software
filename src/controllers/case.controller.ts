import { Request, Response } from "express";
import { CaseService } from "../services/case.service";

/**
 * CaseController
 *
 * Responsibilities:
 * - Read HTTP inputs (params, body, query)
 * - Call the service layer
 * - Send HTTP responses
 *
 * What it must NOT do:
 * - Validation (middleware handles it)
 * - Error handling (asyncHandler + error middleware)
 * - Business logic (service handles it)
 */
export class CaseController {

  //-------------------------------------
  // CREATE CASE
  //-------------------------------------

  static async create(req: Request, res: Response) {
    const createdCase = await CaseService.createCase(req.body);
    res.status(201).json(createdCase);
  }

  //-------------------------------------
  // GET CASE BY ID
  //-------------------------------------

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const caseData = await CaseService.getCaseById(id);
    res.json(caseData);
  }

  //-------------------------------------
  // LIST CASES (with filters)
  //-------------------------------------

  static async list(req: Request, res: Response) {
    const cases = await CaseService.listCases(req.query);
    res.json(cases);
  }

  //-------------------------------------
  // UPDATE CASE
  //-------------------------------------

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const updatedCase = await CaseService.updateCase(id, req.body);
    res.json(updatedCase);
  }

  //-------------------------------------
  // DELETE CASE
  //-------------------------------------

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await CaseService.deleteCase(id);
    res.status(204).send();
  }
}
