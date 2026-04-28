import { AppDataSource } from "../config/data-source";
import { User, UserStatus } from "../entities/User";
import { OtpCode, OtpPurpose } from "../entities/OtpCode";
import { ConflictError } from "../errors/ConflictError";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { ValidationError } from "../errors/ValidationError";
import { NotFoundError } from "../errors/NotFoundError";
import * as bcrypt from "bcrypt";
import { IsNull, MoreThan, LessThan } from "typeorm";
import { env } from "../config/env";
import { signSession } from "../utils/jwt";
import { sendOtpMail } from "../utils/email";

const SALT_ROUNDS = 10;
const DUMMY_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.8BCnXG4hKiT3nAU3hS1JhpPvgiHW";

interface RegisterInput {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface LoginInitInput {
  username: string;
  password: string;
}

interface OtpVerifyInput {
  username: string;
  code: string;
}

interface ForgotInput {
  username: string;
  email: string;
}

interface ResetInput {
  username: string;
  email: string;
  code: string;
  password: string;
  confirm_password: string;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function issueOtp(user_uuid: string, email: string, purpose: OtpPurpose) {
  const otpRepo = AppDataSource.getRepository(OtpCode);

  // Throttle: check most recent OTP for this user+purpose
  const last = await otpRepo
    .createQueryBuilder("o")
    .where("o.user_uuid = :u", { u: user_uuid })
    .andWhere("o.purpose = :p", { p: purpose })
    .orderBy("o.created_at", "DESC")
    .getOne();

  if (last && !last.consumed_at) {
    const elapsed = (Date.now() - last.created_at.getTime()) / 1000;
    if (elapsed < env.OTP.RESEND_COOLDOWN_SECONDS) {
      throw new ValidationError(
        `Please wait ${Math.ceil(
          env.OTP.RESEND_COOLDOWN_SECONDS - elapsed
        )}s before requesting another code`
      );
    }
    // Invalidate previous unused OTP
    last.consumed_at = new Date();
    await otpRepo.save(last);
  }

  const code = generateOtp();
  const code_hash = await bcrypt.hash(code, SALT_ROUNDS);
  const expires_at = new Date(Date.now() + env.OTP.TTL_MINUTES * 60_000);

  const row = otpRepo.create({
    user_uuid,
    purpose,
    code_hash,
    expires_at,
    attempts: 0,
  });
  await otpRepo.save(row);

  // TODO: replace with sendOtpMail once SMTP is configured
  console.log(`\n[OTP] ${purpose.toUpperCase()} code for ${email}: ${code}\n`);
}

async function consumeOtp(
  user_uuid: string,
  purpose: OtpPurpose,
  code: string
): Promise<void> {
  const otpRepo = AppDataSource.getRepository(OtpCode);

  const row = await otpRepo
    .createQueryBuilder("o")
    .where("o.user_uuid = :u", { u: user_uuid })
    .andWhere("o.purpose = :p", { p: purpose })
    .andWhere("o.consumed_at IS NULL")
    .orderBy("o.created_at", "DESC")
    .getOne();

  if (!row) {
    throw new UnauthorizedError("No active code. Request a new one.");
  }

  if (row.expires_at.getTime() < Date.now()) {
    row.consumed_at = new Date();
    await otpRepo.save(row);
    throw new UnauthorizedError("Code expired. Request a new one.");
  }

  if (row.attempts >= env.OTP.MAX_ATTEMPTS) {
    row.consumed_at = new Date();
    await otpRepo.save(row);
    throw new UnauthorizedError("Too many attempts. Request a new code.");
  }

  const ok = await bcrypt.compare(code, row.code_hash);
  if (!ok) {
    row.attempts += 1;
    await otpRepo.save(row);
    throw new UnauthorizedError("Invalid code");
  }

  row.consumed_at = new Date();
  await otpRepo.save(row);
}

export class AuthService {
  // ────────────────────────────────────────────────────────────────
  // REGISTER → emails OTP, account stays unverified until confirmed
  // ────────────────────────────────────────────────────────────────
  static async register(dto: RegisterInput) {
    if (dto.password !== dto.confirm_password) {
      throw new ValidationError("Passwords do not match");
    }

    const repo = AppDataSource.getRepository(User);

    const existing = await repo
      .createQueryBuilder("u")
      .where("u.email = :e OR u.username = :n", {
        e: dto.email,
        n: dto.username,
      })
      .getOne();

    if (existing) {
      if (existing.email === dto.email && existing.is_verified) {
        throw new ConflictError("Email already registered");
      }
      if (existing.username === dto.username && existing.is_verified) {
        throw new ConflictError("Username already taken");
      }
      // Unverified — overwrite credentials so user can retry registration
      existing.username = dto.username;
      existing.email = dto.email;
      existing.password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
      const saved = await repo.save(existing);
      await issueOtp(saved.user_uuid, saved.email, OtpPurpose.Register);
      return { username: saved.username, email: saved.email };
    }

    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = repo.create({
      username: dto.username,
      email: dto.email,
      password_hash,
      is_verified: false,
      status: UserStatus.Active,
      created_on: new Date(),
    });
    const saved = await repo.save(user);

    await issueOtp(saved.user_uuid, saved.email, OtpPurpose.Register);
    return { username: saved.username, email: saved.email };
  }

  static async verifyRegister(dto: OtpVerifyInput) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedError("Invalid code");

    await consumeOtp(user.user_uuid, OtpPurpose.Register, dto.code);

    user.is_verified = true;
    user.last_login = new Date();
    await repo.save(user);

    const token = signSession({
      sub: user.user_uuid,
      username: user.username,
      email: user.email,
    });

    return {
      token,
      user: {
        user_uuid: user.user_uuid,
        username: user.username,
        email: user.email,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────
  // LOGIN INIT → verify password, email OTP
  // ────────────────────────────────────────────────────────────────
  static async loginInit(dto: LoginInitInput) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { username: dto.username } });

    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedError("Invalid username or password");
    }

    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedError("Invalid username or password");

    if (!user.is_verified) {
      // Resume registration verification path
      await issueOtp(user.user_uuid, user.email, OtpPurpose.Register);
      return { username: user.username, email: maskEmail(user.email), needs_register_verification: true };
    }

    await issueOtp(user.user_uuid, user.email, OtpPurpose.Login);
    return { username: user.username, email: maskEmail(user.email) };
  }

  static async verifyLogin(dto: OtpVerifyInput) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedError("Invalid code");

    await consumeOtp(user.user_uuid, OtpPurpose.Login, dto.code);

    user.last_login = new Date();
    await repo.save(user);

    const token = signSession({
      sub: user.user_uuid,
      username: user.username,
      email: user.email,
    });

    return {
      token,
      user: {
        user_uuid: user.user_uuid,
        username: user.username,
        email: user.email,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────
  // RESEND
  // ────────────────────────────────────────────────────────────────
  static async resendOtp(username: string, purpose: string) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { username } });
    // Always 200 to avoid username enumeration
    if (!user) return { ok: true };

    if (!isOtpPurpose(purpose)) {
      throw new ValidationError("Invalid purpose");
    }

    await issueOtp(user.user_uuid, user.email, purpose);
    return { ok: true };
  }

  // ────────────────────────────────────────────────────────────────
  // FORGOT / RESET PASSWORD
  // ────────────────────────────────────────────────────────────────
  static async forgotPassword(dto: ForgotInput) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({
      where: { username: dto.username, email: dto.email },
    });
    // 200 regardless to avoid enumeration
    if (!user) return { ok: true };

    await issueOtp(user.user_uuid, user.email, OtpPurpose.Reset);
    return { ok: true };
  }

  static async resetPassword(dto: ResetInput) {
    if (dto.password !== dto.confirm_password) {
      throw new ValidationError("Passwords do not match");
    }

    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({
      where: { username: dto.username, email: dto.email },
    });
    if (!user) throw new UnauthorizedError("Invalid code");

    await consumeOtp(user.user_uuid, OtpPurpose.Reset, dto.code);

    user.password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await repo.save(user);
    return { ok: true };
  }
}

function isOtpPurpose(s: string): s is OtpPurpose {
  return s === "register" || s === "login" || s === "reset";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}
