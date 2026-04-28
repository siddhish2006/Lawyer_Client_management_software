import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    const r = await AuthService.register(req.body);
    res.status(201).json(r);
  }

  static async verifyRegister(req: Request, res: Response) {
    const r = await AuthService.verifyRegister(req.body);
    res.json(r);
  }

  static async loginInit(req: Request, res: Response) {
    const r = await AuthService.loginInit(req.body);
    res.json(r);
  }

  static async verifyLogin(req: Request, res: Response) {
    const r = await AuthService.verifyLogin(req.body);
    res.json(r);
  }

  static async resendOtp(req: Request, res: Response) {
    const r = await AuthService.resendOtp(req.body.username, req.body.purpose);
    res.json(r);
  }

  static async forgotPassword(req: Request, res: Response) {
    const r = await AuthService.forgotPassword(req.body);
    res.json(r);
  }

  static async resetPassword(req: Request, res: Response) {
    const r = await AuthService.resetPassword(req.body);
    res.json(r);
  }

  static async me(req: Request, res: Response) {
    res.json({ user: req.auth });
  }
}
