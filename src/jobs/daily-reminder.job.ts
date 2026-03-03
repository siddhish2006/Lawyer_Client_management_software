import { AppDataSource } from "../config/data-source";
import { Reminder } from "../entities/reminder";
import { NotificationService } from "../services/notification.service";

export async function runDailyReminderJob() {

  const reminderRepo = AppDataSource.getRepository(Reminder);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reminders = await reminderRepo.find({
    where: {
      reminder_date: today,
      sent: false,
    },
    relations: {
      hearing: {
        case: true,
      },
    },
  });

  for (const reminder of reminders) {

    // EMAIL ONLY — business rule
    await NotificationService.sendEmail({
      subject: "Upcoming Court Hearing Reminder",
      body: `Reminder: You have a hearing scheduled on ${reminder.hearing.hearing_date}.`,
    });

    reminder.sent = true;
    await reminderRepo.save(reminder);
  }

  console.log(`✅ Sent ${reminders.length} hearing reminders`);
}
