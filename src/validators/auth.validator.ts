import { IsString, IsEmail, MinLength } from "class-validator";

export class RegisterValidator {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginValidator {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

