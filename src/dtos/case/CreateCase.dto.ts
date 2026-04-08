import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
} from "class-validator";

/**
 * CreateCaseDTO
 *
 * Defines the shape of data required
 * to create a new legal case.
 *
 * This DTO:
 * - validates request body
 * - does NOT contain business logic
 * - does NOT touch database
 */
export class CreateCaseDTO {

  //----------------------------------
  // Basic Case Info
  //----------------------------------

  @IsString()
  case_number!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  act?: string;

  @IsOptional()
  @IsDateString()
  registration_date?: string;

  //----------------------------------
  // Master Table References
  //----------------------------------

  @IsNumber()
  case_category_id!: number;

  @IsNumber()
  case_type_id!: number;

  @IsNumber()
  case_status_id!: number;

  @IsNumber()
  district_id!: number;

  @IsNumber()
  court_complex_id!: number;

  @IsNumber()
  court_name_id!: number;

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
  // Relations
  //----------------------------------

  @IsArray()
  @ArrayNotEmpty()
  client_ids!: number[];

  @IsOptional()
  @IsArray()
  defendant_ids?: number[];

  @IsOptional()
  @IsArray()
  opponent_ids?: number[];
}
