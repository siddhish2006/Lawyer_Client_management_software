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

  static async login(req: Request, res: Response) {
    const r = await AuthService.login(req.body);
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
    const r = await AuthService.getProfile(req.auth!.sub);
    res.json({ user: r });
  }

  static async updateProfile(req: Request, res: Response) {
    const r = await AuthService.updateProfile(req.auth!.sub, req.body);
    res.json({ user: r });
  }
}
