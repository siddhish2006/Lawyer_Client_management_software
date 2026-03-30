import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    const user = await AuthService.register(req.body);
    res.status(201).json(user);
  }

  static async login(req: Request, res: Response) {
    const result = await AuthService.login(req.body);
    res.json(result);
  }
}
