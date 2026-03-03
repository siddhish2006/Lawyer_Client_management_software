import { Request, Response } from "express";
import { ClientService } from "../services/client.service";

/**
 * ClientController
 *
 * RULES:
 * - NO validation here
 * - NO try/catch here
 * - NO error creation here
 *
 * Validation → middleware
 * Errors → service + error middleware
 * Async handling → asyncHandler
 */
export class ClientController {

  //-------------------------------------
  // CREATE CLIENT
  //-------------------------------------

  static async create(req: Request, res: Response) {
    const client = await ClientService.createClient(req.body);
    res.status(201).json(client);
  }

  //-------------------------------------
  // GET CLIENT BY ID
  //-------------------------------------

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const client = await ClientService.getClientById(id);
    res.json(client);
  }

  //-------------------------------------
  // LIST CLIENTS
  //-------------------------------------

  static async list(req: Request, res: Response) {
    const clients = await ClientService.listClients(req.query);
    res.json(clients);
  }

  //-------------------------------------
  // UPDATE CLIENT
  //-------------------------------------

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const updated = await ClientService.updateClient(id, req.body);
    res.json(updated);
  }

  //-------------------------------------
  // DELETE CLIENT
  //-------------------------------------

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    await ClientService.deleteClient(id);
    res.status(204).send();
  }
}
