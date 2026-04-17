import { IsString, IsOptional, IsEmail } from "class-validator";

export class CreateOpponentDTO {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
