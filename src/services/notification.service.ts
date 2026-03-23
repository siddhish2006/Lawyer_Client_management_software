import { AppDataSource } from "../config/data-source";
import { Reminder } from "../entities/reminder";
import { Hearing } from "../entities/Hearing";
import { Client } from "../entities/Client";

/**
 * NotificationService
 *
 * Responsibilities:
 * 1. Send immediate notifications when hearing is created/rescheduled
 * 2. Schedule reminder (5 days before hearing)
 * 3. Determine best communication channel automatically
 * 4. Fallback if assistant chooses unavailable channel
 */
export class NotificationService {

  // ==================================================
  // INTENT METHODS (CALLED FROM SERVICES)
  // ==================================================

  /**
   * Called when hearing is created
   */
  static async notifyHearingCreated(
    hearing: Hearing,
    preferredChannels: string[]
  ) {

    const client = await this.getClientFromHearing(hearing);

    const channels = this.resolveChannels(client, preferredChannels);

    await this.dispatchNotification(
      channels,
      "New Hearing Scheduled",
      `A new hearing has been scheduled on ${hearing.hearing_date}`
    );

    await this.scheduleReminders(hearing);
  }

  /**
   * Called when hearing is rescheduled
   */
  static async notifyHearingRescheduled(
    hearing: Hearing,
    preferredChannels: string[]
  ) {

    const client = await this.getClientFromHearing(hearing);

    const channels = this.resolveChannels(client, preferredChannels);

    await this.dispatchNotification(
      channels,
      "Hearing Rescheduled",
      `Your hearing has been rescheduled to ${hearing.hearing_date}`
    );

    await this.resetReminders(hearing);
  }

  // ==================================================
  // CHANNEL RESOLUTION LOGIC
  // ==================================================

  /**
   * Determine best channels based on:
   * 1. Assistant preference
   * 2. Database availability
   * 3. Priority rules
   */
  private static resolveChannels(
    client: Client,
    preferred: string[]
  ): string[] {

    const available = {
      email: !!client.email,
      whatsapp: !!client.whatsapp_number,
      sms: !!client.phone_number,
    };

    // --------------------------------------------------
    // STEP 1: Check if preferred channels are valid
    // --------------------------------------------------

    const validPreferred = preferred.filter(
      (ch) => available[ch as keyof typeof available]
    );

    if (validPreferred.length === preferred.length) {
      return preferred;
    }

    // --------------------------------------------------
    // STEP 2: Apply automatic fallback rules
    // --------------------------------------------------

    if (available.email && available.whatsapp) {
      return ["email", "whatsapp"];
    }

    if (available.email && available.sms) {
      return ["email", "sms"];
    }

    // If email missing but whatsapp+sms present
    if (available.whatsapp && available.sms) {
      return ["whatsapp"]; // WhatsApp preferred
    }

    if (available.whatsapp) {
      return ["whatsapp"];
    }

    if (available.sms) {
      return ["sms"];
    }

    if (available.email) {
      return ["email"];
    }

    return [];
  }

  // ==================================================
  // DISPATCH LOGIC
  // ==================================================

  /**
   * Sends notification through selected channels
   */
  private static async dispatchNotification(
    channels: string[],
    subject: string,
    message: string
  ) {

    for (const channel of channels) {

      switch (channel) {

        case "email":
          await this.sendEmail({ subject, body: message });
          break;

        case "whatsapp":
          await this.sendWhatsApp(message);
          break;

        case "sms":
          await this.sendSMS(message);
          break;
      }
    }
  }

  // ==================================================
  // REMINDER DATABASE LOGIC
  // ==================================================

  /**
   * Schedule reminder (5 days before hearing)
   */
  static async scheduleReminders(hearing: Hearing) {

    const reminderRepo = AppDataSource.getRepository(Reminder);

    const hearingDate = new Date(hearing.hearing_date);

    const reminderDate = new Date(hearingDate);
    reminderDate.setDate(reminderDate.getDate() - 5);

    const reminder = reminderRepo.create({
      hearing,
      reminder_date: reminderDate,
    });

    await reminderRepo.save(reminder);
  }

  /**
   * Reset reminders when hearing date changes
   */
  static async resetReminders(hearing: Hearing) {

    const reminderRepo = AppDataSource.getRepository(Reminder);

    await reminderRepo.delete({
      hearing: { hearing_id: hearing.hearing_id },
    });

    await this.scheduleReminders(hearing);
  }

  // ==================================================
  // CLIENT FETCH
  // ==================================================

  /**
   * Load client from hearing -> case -> client relationship
   */
  private static async getClientFromHearing(
    hearing: Hearing
  ): Promise<Client> {

    const hearingRepo = AppDataSource.getRepository(Hearing);

    const loaded = await hearingRepo.findOne({
      where: { hearing_id: hearing.hearing_id },
      relations: {
        case: {
          clients: {
            client: true,
          },
        },
      },
    });

    if (!loaded || loaded.case.clients.length === 0) {
      throw new Error("Client not found for hearing");
    }

    return loaded.case.clients[0].client;
  }

  // ==================================================
  // TRANSPORT LAYER
  // ==================================================

  /**
   * EMAIL (Replace later with real provider)
   */
  static async sendEmail(payload: {
    subject: string;
    body: string;
  }) {

    console.log("📧 EMAIL SENT");
    console.log(payload.subject);
    console.log(payload.body);
  }

  /**
   * WhatsApp (placeholder)
   */
  private static async sendWhatsApp(message: string) {

    console.log("📱 WhatsApp sent");
    console.log(message);
  }

  /**
   * SMS (placeholder)
   */
  private static async sendSMS(message: string) {

    console.log("📩 SMS sent");
    console.log(message);
  }
}