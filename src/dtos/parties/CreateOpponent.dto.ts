import { IsString, IsOptional, IsEmail } from "class-validator";
import { Transform } from "class-transformer";

// Treat blank / whitespace-only strings as "not provided" so IsEmail /
// IsString don't reject a form where only name was filled in.
const blankToUndefined = ({ value }: { value: unknown }) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

export class CreateOpponentDTO {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @Transform(blankToUndefined)
  phone_number?: string;

  @IsOptional()
  @IsEmail()
  @Transform(blankToUndefined)
  email?: string;
}
