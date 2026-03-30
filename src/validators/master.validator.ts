import { IsString, IsNumber, IsOptional, MinLength } from "class-validator";

export class CreateMasterValidator {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class UpdateMasterValidator {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}

export class CreateCourtComplexValidator {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNumber()
  district_id!: number;
}

export class UpdateCourtComplexValidator {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsNumber()
  district_id?: number;
}

export class CreateCourtNameValidator {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNumber()
  court_complex_id!: number;
}

export class UpdateCourtNameValidator {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsNumber()
  court_complex_id?: number;
}

