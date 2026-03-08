import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Length,
  IsArray,
  IsIn,
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

  //----------------------------------
  // Notification Preferences
  //----------------------------------

  /**
   * Channels selected by the assistant in the frontend.
   *
   * Examples:
   * ["email","whatsapp"]
   * ["email","sms"]
   *
   * Backend will still validate these against
   * client contact availability.
   */
  @IsOptional()
  @IsArray()
  @IsIn(["email","whatsapp","sms"], { each: true })
  notification_channels?: string[];
}