import { AppDataSource } from "../config/data-source";
import { User, UserStatus } from "../entities/User";
import { RegisterUserDTO } from "../dtos/auth/RegisterUser.dto";
import { LoginUserDTO } from "../dtos/auth/LoginUser.dto";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError";
import { ValidationError } from "../errors/ValidationError";
import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class AuthService {

  //====================================================
  // REGISTER
  //====================================================

  static async register(dto: RegisterUserDTO) {
    const repo = AppDataSource.getRepository(User);

    //----------------------------------
    // Check duplicate email
    //----------------------------------

    const existing = await repo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictError("Email already registered");
    }

    //----------------------------------
    // Hash password
    //----------------------------------

    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    //----------------------------------
    // Create user
    //----------------------------------

    const user = repo.create({
      full_name: dto.full_name,
      email: dto.email,
      phone_number: dto.phone_number,
      password_hash,
      role: dto.role,
      status: UserStatus.Active,
      created_on: new Date(),
    });

    const saved = await repo.save(user);

    //----------------------------------
    // Strip password_hash from response
    //----------------------------------

    const { password_hash: _, ...userResponse } = saved;
    return userResponse;
  }

  //====================================================
  // LOGIN
  //====================================================

  static async login(dto: LoginUserDTO) {
    const repo = AppDataSource.getRepository(User);

    //----------------------------------
    // Find user by email
    //----------------------------------

    const user = await repo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundError("Invalid email or password");
    }

    //----------------------------------
    // Verify password
    //----------------------------------

    const isValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!isValid) {
      throw new ValidationError("Invalid email or password");
    }

    //----------------------------------
    // Update last_login
    //----------------------------------

    user.last_login = new Date();
    await repo.save(user);

    //----------------------------------
    // Return user (no JWT yet)
    //----------------------------------

    const { password_hash: _, ...userResponse } = user;
    return userResponse;
  }
}
