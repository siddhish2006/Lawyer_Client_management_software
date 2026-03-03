import { AppDataSource } from "../config/data-source";
import { Reminder, ReminderType } from "../entities/reminder";
import { Hearing } from "../entities/Hearing";

export class NotificationService {

  // ==================================================
  // INTENT-LEVEL METHODS (CALLED BY SERVICES)
  // ==================================================

  /**
   * Called when a new hearing is created
   * → Immediate notification
   * → Reminders scheduled
   */
  static async notifyHearingCreated(hearing: Hearing) {

    // Immediate notification (Email now, others later)
    await this.sendEmail({
      subject: "New Hearing Scheduled",
      body: `A new hearing has been scheduled on ${hearing.hearing_date}.`,
    });

    // Schedule reminders
    await this.scheduleReminders(hearing);
  }

  /**
   * Called when hearing date is changed
   * → Immediate notification
   * → Reminders reset
   */
  static async notifyHearingRescheduled(hearing: Hearing) {

    await this.sendEmail({
      subject: "Hearing Rescheduled",
      body: `Your hearing has been rescheduled to ${hearing.hearing_date}.`,
    });

    await this.resetReminders(hearing);
  }

  /**
   * Used by daily reminder job (EMAIL ONLY)
   */
  static async sendReminderEmail(payload: {
    subject: string;
    body: string;
  }) {
    await this.sendEmail(payload);
  }

  // ==================================================
  // REMINDER DATABASE LOGIC
  // ==================================================

  static async scheduleReminders(hearing: Hearing) {

    const reminderRepo = AppDataSource.getRepository(Reminder);

    const hearingDate = new Date(hearing.hearing_date);

    const fiveDaysBefore = new Date(hearingDate);
    fiveDaysBefore.setDate(fiveDaysBefore.getDate() - 5);

    const oneDayBefore = new Date(hearingDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);

    const reminders = reminderRepo.create([
      {
        hearing,
        reminder_date: fiveDaysBefore,
        type: ReminderType.FIVE_DAYS,
      },
      {
        hearing,
        reminder_date: oneDayBefore,
        type: ReminderType.ONE_DAY,
      },
    ]);

    await reminderRepo.save(reminders);
  }

  static async resetReminders(hearing: Hearing) {

    const reminderRepo = AppDataSource.getRepository(Reminder);

    await reminderRepo.delete({
      hearing: { hearing_id: hearing.hearing_id },
    });

    await this.scheduleReminders(hearing);
  }

  // ==================================================
  // TRANSPORT LAYER (LOW-LEVEL)
  // ==================================================

  /**
   * EMAIL TRANSPORT
   * Replace with real provider later
   */
  public static async sendEmail(payload: {
    subject: string;
    body: string;
  }) {

    console.log("📧 Sending Email...");
    console.log("Subject:", payload.subject);
    console.log("Body:", payload.body);

    return;
  }
}
