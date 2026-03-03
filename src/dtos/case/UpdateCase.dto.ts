import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
} from "class-validator";

/**
 * UpdateCaseDTO
 *
 * Used when updating an existing case.
 * All fields are optional because updates are partial.
 */
export class UpdateCaseDTO {

  //----------------------------------
  // Basic Case Info
  //----------------------------------

  @IsOptional()
  @IsString()
  case_number?: string;

  @IsOptional()
  @IsString()
  act?: string;

  @IsOptional()
  @IsDateString()
  registration_date?: string;

  //----------------------------------
  // Master References
  //----------------------------------

  @IsOptional()
  @IsNumber()
  case_category_id?: number;

  @IsOptional()
  @IsNumber()
  case_type_id?: number;

  @IsOptional()
  @IsNumber()
  case_status_id?: number;

  @IsOptional()
  @IsNumber()
  district_id?: number;

  @IsOptional()
  @IsNumber()
  court_complex_id?: number;

  @IsOptional()
  @IsNumber()
  court_name_id?: number;

  //----------------------------------
  // Description & Notes
  //----------------------------------

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  //----------------------------------
  // Relations (Can Replace Existing Links)
  //----------------------------------

  @IsOptional()
  @IsArray()
  client_ids?: number[];

  @IsOptional()
  @IsArray()
  defendant_ids?: number[];

  @IsOptional()
  @IsArray()
  opponent_ids?: number[];
}
