import { IsString, IsEmail, MinLength, Matches, MaxLength } from "class-validator";

// At least one lowercase, one uppercase, one digit, one special char.
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export class RegisterValidator {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      "password must be at least 8 chars and include uppercase, lowercase, digit, and special character",
  })
  password!: string;
}

export class LoginValidator {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

