import { AppDataSource } from "../config/data-source";
import { User, UserStatus } from "../entities/User";
import { RegisterUserDTO } from "../dtos/auth/RegisterUser.dto";
import { LoginUserDTO } from "../dtos/auth/LoginUser.dto";
import { ConflictError } from "../errors/ConflictError";
import { UnauthorizedError } from "../errors/UnauthorizedError";
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

    // Same 401 + identical message whether email missing or password wrong
    // to prevent account enumeration. Also run a dummy bcrypt.compare
    // when the user is missing so timing does not leak existence.
    const DUMMY_HASH =
      "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.8BCnXG4hKiT3nAU3hS1JhpPvgiHW";

    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedError("Invalid email or password");
    }

    //----------------------------------
    // Verify password
    //----------------------------------

    const isValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
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
