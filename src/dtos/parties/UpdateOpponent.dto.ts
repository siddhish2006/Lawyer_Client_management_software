import { IsString, IsOptional, IsEmail } from "class-validator";

export class UpdateOpponentDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
