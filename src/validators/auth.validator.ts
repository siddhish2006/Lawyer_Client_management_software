import {
  IsString,
  IsEmail,
  MinLength,
  Matches,
  MaxLength,
} from "class-validator";

const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;
const OTP_REGEX = /^[0-9]{6}$/;

export class RegisterValidator {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX, {
    message: "username may only contain letters, digits, and underscores",
  })
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @IsString()
  confirm_password!: string;
}

export class LoginInitValidator {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX)
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class OtpVerifyValidator {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX)
  username!: string;

  @IsString()
  @Matches(OTP_REGEX, { message: "code must be 6 digits" })
  code!: string;
}

export class ResendOtpValidator {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX)
  username!: string;

  @IsString()
  purpose!: string;
}

export class ForgotPasswordValidator {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX)
  username!: string;

  @IsEmail()
  email!: string;
}

export class ResetPasswordValidator {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(OTP_REGEX, { message: "code must be 6 digits" })
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @IsString()
  confirm_password!: string;
}
