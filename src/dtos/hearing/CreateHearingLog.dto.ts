import { IsNumber, IsOptional, IsString, IsDateString, Length } from "class-validator";

export class CreateHearingLogDTO {
  @IsNumber()
  hearing_id!: number;

  @IsDateString()
  hearing_date!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  purpose?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  outcome?: string;
}
