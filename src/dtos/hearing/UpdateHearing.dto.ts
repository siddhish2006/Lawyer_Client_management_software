import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Length,
} from "class-validator";

/**
 * UpdateHearingDTO
 *
 * Used for updating hearing details.
 * All fields are optional because updates are partial.
 */
export class UpdateHearingDTO {

  //----------------------------------
  // Case Reference (rare but allowed)
  //----------------------------------

  @IsOptional()
  @IsNumber()
  case_id?: number;

  //----------------------------------
  // Hearing Details
  //----------------------------------

  @IsOptional()
  @IsDateString()
  hearing_date?: string;

  @IsOptional()
  @IsString()
  @Length(3, 255)
  purpose?: string;

  @IsOptional()
  @IsString()
  requirements?: string;
}
