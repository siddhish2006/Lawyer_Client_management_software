import { Request, Response } from "express";
import { HearingService } from "../services/hearing.service";

export class HearingController {
  //----------------------------------
  // CREATE HEARING
  //----------------------------------
  static async create(req: Request, res: Response) {
    const hearing = await HearingService.createHearing(req.body);
    res.status(201).json(hearing);
  }

  //----------------------------------
  // GET HEARING BY ID
  //----------------------------------
  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const hearing = await HearingService.getHearingById(id);
    res.json(hearing);
  }

  //----------------------------------
  // LIST HEARINGS
  //----------------------------------
  static async list(req: Request, res: Response) {
    const hearings = await HearingService.listHearings(req.query);
    res.json(hearings);
  }

  //----------------------------------
  // UPDATE OUTCOME
  //----------------------------------
  static async updateOutcome(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { outcome } = req.body;
    const hearing = await HearingService.updateOutcome(id, outcome ?? "");
    res.json(hearing);
  }

  //----------------------------------
  // DELETE HEARING
  //----------------------------------
  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);

    await HearingService.deleteHearing(id);

    res.status(204).send();
  }
}
