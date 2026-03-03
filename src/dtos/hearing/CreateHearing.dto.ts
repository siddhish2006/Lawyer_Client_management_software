import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Length,
} from "class-validator";

/**
 * CreateHearingDTO
 *
 * Defines the shape of data required
 * to create a new hearing for a case.
 *
 * This DTO:
 * - validates request body
 * - does NOT contain business logic
 * - does NOT touch the database
 */
export class CreateHearingDTO {

  //----------------------------------
  // Case Reference
  //----------------------------------

  @IsNumber()
  case_id!: number;

  //----------------------------------
  // Hearing Details
  //----------------------------------

  @IsDateString()
  hearing_date!: string; 
  // ISO string is frontend-safe (e.g. "2026-03-15")

  @IsOptional()
  @IsString()
  @Length(3, 255)
  purpose?: string;

  @IsOptional()
  @IsString()
  requirements?: string;
}
