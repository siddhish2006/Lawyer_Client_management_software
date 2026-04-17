import { AppDataSource } from "../config/data-source";
import { Reminder } from "../entities/reminder";
import { NotificationService } from "../services/notification.service";

export async function runDailyReminderJob() {
  const reminderRepo = AppDataSource.getRepository(Reminder);
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const claimedRows: Array<{ reminder_id: number }> = await queryRunner.query(
      `
        WITH due_reminders AS (
          SELECT reminder_id
          FROM reminders
          WHERE reminder_date <= CURRENT_TIMESTAMP
            AND is_sent = false
            AND is_failed = false
            AND (
              is_processing = false
              OR processing_started_at IS NULL
              OR processing_started_at < CURRENT_TIMESTAMP - ($1 * INTERVAL '1 minute')
            )
          FOR UPDATE SKIP LOCKED
        )
        UPDATE reminders r
        SET is_processing = true,
            processing_started_at = CURRENT_TIMESTAMP
        FROM due_reminders d
        WHERE r.reminder_id = d.reminder_id
        RETURNING r.reminder_id
      `,
      [NotificationService.getProcessingTimeoutMinutes()]
    );

    await queryRunner.commitTransaction();

    const claimedReminderIds = claimedRows.map((row) => Number(row.reminder_id));
    const reminders =
      claimedReminderIds.length > 0
        ? await reminderRepo.find({
            where: claimedReminderIds.map((reminder_id) => ({ reminder_id })),
            relations: {
              hearing: true,
            },
          })
        : [];

    let sentCount = 0;

    for (const reminder of reminders) {
      try {
        const delivered = await NotificationService.sendScheduledReminder(reminder);

        if (delivered) {
          sentCount += 1;
        }
      } catch (error) {
        console.error(
          `Reminder ${reminder.reminder_id} failed:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    console.log(`Sent ${sentCount} of ${reminders.length} hearing reminders`);
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    throw error;
  } finally {
    await queryRunner.release();
  }
}
