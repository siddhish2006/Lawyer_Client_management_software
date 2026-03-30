import { ReminderType } from "../../entities/reminder";

export class CreateReminderDTO {
  hearing_id!: number;
  reminder_date!: Date;
  type!: ReminderType;
}
