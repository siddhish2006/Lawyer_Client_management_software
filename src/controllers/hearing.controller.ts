import { Request, Response } from "express";
import { HearingService } from "../services/hearing.service";

export class HearingController {

  //----------------------------------
  // CREATE HEARING
  //----------------------------------
  static async create(req: Request, res: Response) {
    const hearing = await HearingService.createHearing(req.body);

    res.status(201).json({
      success: true,
      data: hearing,
    });
  }

  //----------------------------------
  // UPDATE HEARING
  //----------------------------------
  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);

    const hearing = await HearingService.updateHearing(id, req.body);

    res.json({
      success: true,
      data: hearing,
    });
  }

  //----------------------------------
  // GET HEARING BY ID
  //----------------------------------
  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);

    const hearing = await HearingService.getHearingById(id);

    res.json({
      success: true,
      data: hearing,
    });
  }

  //----------------------------------
  // LIST HEARINGS
  //----------------------------------
  static async list(req: Request, res: Response) {
    const hearings = await HearingService.listHearings(req.query);

    res.json({
      success: true,
      data: hearings,
    });
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
