import {
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { ReminderType } from "../entities/reminder";

export class CreateReminderValidator {
  @IsNumber()
  hearing_id!: number;

  @IsDateString()
  reminder_date!: Date;

  @IsEnum(ReminderType)
  type!: ReminderType;
}

export class UpdateReminderValidator {
  @IsOptional()
  @IsNumber()
  hearing_id?: number;

  @IsOptional()
  @IsDateString()
  reminder_date?: Date;

  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @IsOptional()
  @IsBoolean()
  sent?: boolean;
}
