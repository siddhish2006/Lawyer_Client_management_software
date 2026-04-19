import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Length,
  IsArray,
  IsIn,
  registerDecorator,
  ValidationOptions,
} from "class-validator";

function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isFutureDate",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== "string") return false;
          const d = new Date(value);
          if (isNaN(d.getTime())) return false;
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          const day = new Date(d);
          day.setUTCHours(0, 0, 0, 0);
          return day.getTime() >= today.getTime();
        },
        defaultMessage() {
          return "hearing_date must be today or in the future";
        },
      },
    });
  };
}

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
  @IsFutureDate()
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