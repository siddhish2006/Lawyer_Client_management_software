import { IsString, IsOptional, IsEmail, IsNumber } from "class-validator";

export class CreateDefendantDTO {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  client_id?: number;
}
