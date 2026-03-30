import { ReminderType } from "../../entities/reminder";

export class UpdateReminderDTO {
  hearing_id?: number;
  reminder_date?: Date;
  type?: ReminderType;
  sent?: boolean;
}
