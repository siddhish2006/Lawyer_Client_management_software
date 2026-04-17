import { EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Client } from "../entities/Client";
import { Hearing } from "../entities/Hearing";
import { Reminder } from "../entities/reminder";
import {
  ReminderChannel,
  ReminderDeliveryStatus,
  ReminderLog,
} from "../entities/ReminderLog";
import { logger } from "../utils/logger";
import { GupshupMessageEvent, GupshupService } from "./gupshup.service";

interface ReminderAttemptParams {
  reminder: Reminder;
  client: Client;
  channel: ReminderChannel;
  status: ReminderDeliveryStatus;
  errorMessage?: string;
  providerName?: string;
  providerMessageId?: string;
  providerEventType?: string;
  providerLastEventAt?: Date | null;
}

/**
 * NotificationService
 *
 * Responsibilities:
 * 1. Create one reminder record (5 days before hearing)
 * 2. Send that reminder immediately if the hearing is already inside the window
 * 3. Determine best communication channel automatically
 * 4. Keep reminder logs truthful when external providers confirm delivery later
 */
export class NotificationService {
  private static readonly DEFAULT_PREFERRED_CHANNELS = ["email", "whatsapp"];
  private static readonly PROCESSING_TIMEOUT_MINUTES = 15;
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  private static hasValue(value?: string | null): boolean {
    return typeof value === "string" && value.trim().length > 0;
  }

  private static clientHasAnyContact(client: Client): boolean {
    return (
      this.hasValue(client.email) ||
      this.hasValue(client.whatsapp_number) ||
      this.hasValue(client.phone_number)
    );
  }

  private static resolvePreferredChannels(
    reminder?: Reminder,
    preferredChannels?: string[]
  ): string[] {
    if (preferredChannels && preferredChannels.length > 0) {
      return preferredChannels;
    }

    if (
      reminder?.notification_channels &&
      reminder.notification_channels.length > 0
    ) {
      return reminder.notification_channels;
    }

    return this.DEFAULT_PREFERRED_CHANNELS;
  }

  static getProcessingTimeoutMinutes(): number {
    return this.PROCESSING_TIMEOUT_MINUTES;
  }

  static getMaxRetryAttempts(): number {
    return this.MAX_RETRY_ATTEMPTS;
  }

  private static isSuccessfulDeliveryStatus(
    status: ReminderDeliveryStatus
  ): boolean {
    return status === ReminderDeliveryStatus.SENT;
  }

  private static async findReminderByHearingId(
    hearingId: number
  ): Promise<Reminder | null> {
    return AppDataSource.getRepository(Reminder).findOne({
      where: {
        hearing: {
          hearing_id: hearingId,
        },
      },
      relations: {
        hearing: true,
      },
    });
  }

  private static async syncReminderStateFromLogs(hearingId: number) {
    const reminder = await this.findReminderByHearingId(hearingId);

    if (!reminder) {
      return;
    }

    let contactableClients: Client[] = [];

    try {
      const clients = await this.getClientsFromHearing(reminder.hearing);
      contactableClients = clients.filter((client) =>
        this.clientHasAnyContact(client)
      );
    } catch {
      contactableClients = [];
    }

    if (contactableClients.length === 0) {
      reminder.is_sent = false;
      reminder.is_failed = true;
      reminder.is_processing = false;
      reminder.processing_started_at = null;
      reminder.failed_at = reminder.failed_at ?? new Date();
      await AppDataSource.getRepository(Reminder).save(reminder);
      return;
    }

    const logs = await AppDataSource.getRepository(ReminderLog).find({
      where: {
        hearing: { hearing_id: hearingId },
      },
      relations: {
        client: true,
      },
    });

    let allClientsHaveSuccessfulAttempt = true;
    let hasPendingAttempts = false;

    for (const client of contactableClients) {
      const clientLogs = logs.filter(
        (log) => log.client.client_id === client.client_id
      );

      if (
        clientLogs.some((log) =>
          this.isSuccessfulDeliveryStatus(log.status)
        )
      ) {
        continue;
      }

      if (
        clientLogs.some((log) => log.status === ReminderDeliveryStatus.PENDING)
      ) {
        hasPendingAttempts = true;
        allClientsHaveSuccessfulAttempt = false;
        continue;
      }

      allClientsHaveSuccessfulAttempt = false;
    }

    reminder.is_processing = false;
    reminder.processing_started_at = null;

    if (allClientsHaveSuccessfulAttempt) {
      reminder.is_sent = true;
      reminder.is_failed = false;
      reminder.failed_at = null;
    } else if (hasPendingAttempts) {
      reminder.is_sent = true;
      reminder.is_failed = false;
      reminder.failed_at = null;
    } else {
      reminder.is_sent = false;
      reminder.is_failed = true;
      reminder.failed_at = reminder.failed_at ?? new Date();
    }

    await AppDataSource.getRepository(Reminder).save(reminder);
  }

  private static mapProviderEventTypeToReminderStatus(
    providerEventType: string
  ): ReminderDeliveryStatus {
    switch (providerEventType) {
      case "sent":
      case "delivered":
      case "read":
        return ReminderDeliveryStatus.SENT;
      case "failed":
        return ReminderDeliveryStatus.FAILED;
      default:
        return ReminderDeliveryStatus.PENDING;
    }
  }

  private static async updateReminderAttemptFromProviderEvent(
    event: GupshupMessageEvent
  ) {
    if (!event.providerMessageId) {
      logger.warn("Received Gupshup event without a provider message id");
      return;
    }

    const reminderLogRepo = AppDataSource.getRepository(ReminderLog);
    const log = await reminderLogRepo.findOne({
      where: {
        provider_name: "GUPSHUP",
        provider_message_id: event.providerMessageId,
      },
      relations: {
        hearing: true,
      },
      order: {
        log_id: "DESC",
      },
    });

    if (!log) {
      logger.warn(
        `No reminder log found for Gupshup message ${event.providerMessageId}`
      );
      return;
    }

    log.provider_name = "GUPSHUP";
    log.provider_event_type = event.providerEventType;
    log.provider_last_event_at = event.providerLastEventAt ?? new Date();
    log.status = this.mapProviderEventTypeToReminderStatus(
      event.providerEventType
    );

    if (this.isSuccessfulDeliveryStatus(log.status)) {
      log.sent_at = log.sent_at ?? event.providerLastEventAt ?? new Date();
      log.error_message = null;
    }

    if (log.status === ReminderDeliveryStatus.FAILED) {
      log.error_message =
        event.errorMessage ??
        log.error_message ??
        "Gupshup reported that the message failed";
    }

    await reminderLogRepo.save(log);
    await this.syncReminderStateFromLogs(log.hearing.hearing_id);
  }

  private static async finalizeReminderProcessing(
    reminder: Reminder,
    isSent: boolean
  ) {
    reminder.is_sent = isSent;
    reminder.is_failed = false;
    reminder.is_processing = false;
    reminder.processing_started_at = null;
    reminder.failed_at = null;

    await AppDataSource.getRepository(Reminder).save(reminder);
  }

  private static async markReminderAttemptFailure(reminder: Reminder) {
    reminder.retry_count += 1;
    reminder.last_retry_at = new Date();
    reminder.is_processing = false;
    reminder.processing_started_at = null;

    if (reminder.retry_count >= this.MAX_RETRY_ATTEMPTS) {
      reminder.is_failed = true;
      reminder.failed_at = new Date();
      logger.error(
        `Reminder ${reminder.reminder_id} reached max retry attempts and now requires manual follow-up.`
      );
    }

    await AppDataSource.getRepository(Reminder).save(reminder);
  }

  // ==================================================
  // INTENT METHODS (CALLED FROM SERVICES)
  // ==================================================

  /**
   * Called after hearing and reminder creation commit successfully.
   */
  static async notifyHearingCreated(
    reminder: Reminder,
    preferredChannels: string[]
  ) {
    if (reminder.reminder_date <= new Date()) {
      return this.sendScheduledReminder(reminder, preferredChannels);
    }

    return true;
  }

  static async handleGupshupWebhook(body: unknown, token?: string | null) {
    GupshupService.validateWebhookToken(token);

    const event = GupshupService.parseMessageEvent(body);

    if (!event) {
      return;
    }

    await this.updateReminderAttemptFromProviderEvent(event);
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
      email: this.hasValue(client.email),
      whatsapp: this.hasValue(client.whatsapp_number),
      sms: this.hasValue(client.phone_number),
    };

    const validPreferred = preferred.filter(
      (channel) => available[channel as keyof typeof available]
    );

    if (validPreferred.length === preferred.length) {
      return preferred;
    }

    if (available.email && available.whatsapp) {
      return ["email", "whatsapp"];
    }

    if (available.email && available.sms) {
      return ["email", "sms"];
    }

    if (available.whatsapp && available.sms) {
      return ["whatsapp"];
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
  // REMINDER DATABASE LOGIC
  // ==================================================

  /**
   * Create the reminder record inside the same transaction as hearing creation.
   */
  static async createReminderRecord(
    manager: EntityManager,
    hearing: Hearing,
    preferredChannels?: string[]
  ): Promise<Reminder> {
    const hearingDate = new Date(hearing.hearing_date);
    const reminderDate = new Date(hearingDate);
    reminderDate.setDate(reminderDate.getDate() - 5);
    const shouldProcessImmediately = reminderDate <= new Date();

    const reminderRepo = manager.getRepository(Reminder);
    const reminder = reminderRepo.create({
      hearing,
      reminder_date: reminderDate,
      notification_channels: this.resolvePreferredChannels(
        undefined,
        preferredChannels
      ),
      is_sent: false,
      retry_count: 0,
      is_failed: false,
      last_retry_at: null,
      failed_at: null,
      is_processing: shouldProcessImmediately,
      processing_started_at: shouldProcessImmediately ? new Date() : null,
    });

    return reminderRepo.save(reminder);
  }

  /**
   * Send the scheduled reminder and write audit logs per channel.
   */
  static async sendScheduledReminder(
    reminder: Reminder,
    preferredChannels?: string[]
  ): Promise<boolean> {
    try {
      const resolvedPreferredChannels = this.resolvePreferredChannels(
        reminder,
        preferredChannels
      );
      const clients = await this.getClientsFromHearing(reminder.hearing);
      const contactableClients = clients.filter((client) =>
        this.clientHasAnyContact(client)
      );
      const sentClientIds = await this.getSentClientIds(reminder.hearing);

      if (contactableClients.length === 0) {
        for (const client of clients) {
          await this.logReminderAttempt({
            reminder,
            client,
            channel: ReminderChannel.EMAIL,
            status: ReminderDeliveryStatus.FAILED,
            errorMessage: "No contact channel is available for this client",
          });
        }

        await this.markReminderAttemptFailure(reminder);
        return false;
      }

      const pendingClients = contactableClients.filter(
        (client) => !sentClientIds.has(client.client_id)
      );

      if (pendingClients.length === 0) {
        await this.finalizeReminderProcessing(reminder, true);
        return true;
      }

      const subject = "Upcoming Court Hearing Reminder";
      let dispatchedToAllPendingClients = true;

      for (const client of pendingClients) {
        const channels = this.resolveChannels(client, resolvedPreferredChannels);

        if (channels.length === 0) {
          await this.logReminderAttempt({
            reminder,
            client,
            channel: ReminderChannel.EMAIL,
            status: ReminderDeliveryStatus.FAILED,
            errorMessage: "No contact channel is available for this client",
          });
          dispatchedToAllPendingClients = false;
          continue;
        }

        const message = this.buildReminderMessage(client, reminder.hearing);
        let dispatchedToClient = false;

        for (const channel of channels) {
          const reminderChannel = this.toReminderChannel(channel);

          try {
            switch (channel) {
              case "email":
                await this.sendEmail({ subject, body: message });
                await this.logReminderAttempt({
                  reminder,
                  client,
                  channel: reminderChannel,
                  status: ReminderDeliveryStatus.SENT,
                });
                dispatchedToClient = true;
                break;

              case "whatsapp":
                if (!client.whatsapp_number) {
                  throw new Error("WhatsApp number is missing for this client");
                }

                const whatsappResult = await this.sendWhatsApp(
                  client.whatsapp_number,
                  message
                );

                await this.logReminderAttempt({
                  reminder,
                  client,
                  channel: reminderChannel,
                  status: ReminderDeliveryStatus.PENDING,
                  providerName: whatsappResult.providerName,
                  providerMessageId: whatsappResult.messageId,
                  providerEventType: whatsappResult.providerEventType,
                  providerLastEventAt: new Date(),
                });
                dispatchedToClient = true;
                break;

              case "sms":
                await this.sendSMS(message);
                await this.logReminderAttempt({
                  reminder,
                  client,
                  channel: reminderChannel,
                  status: ReminderDeliveryStatus.SENT,
                });
                dispatchedToClient = true;
                break;
            }
          } catch (error) {
            await this.logReminderAttempt({
              reminder,
              client,
              channel: reminderChannel,
              status: ReminderDeliveryStatus.FAILED,
              errorMessage:
                error instanceof Error ? error.message : String(error),
            });
          }
        }

        if (!dispatchedToClient) {
          dispatchedToAllPendingClients = false;
        }
      }

      if (dispatchedToAllPendingClients) {
        await this.finalizeReminderProcessing(reminder, true);
      } else {
        await this.markReminderAttemptFailure(reminder);
      }

      return dispatchedToAllPendingClients;
    } catch (error) {
      await this.markReminderAttemptFailure(reminder);
      throw error;
    }
  }

  // ==================================================
  // CLIENT FETCH
  // ==================================================

  /**
   * Load client from hearing -> case -> client relationship
   */
  private static async getClientsFromHearing(
    hearing: Hearing
  ): Promise<Client[]> {
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

    return loaded.case.clients.map((link) => link.client).filter(Boolean);
  }

  private static async getSentClientIds(hearing: Hearing): Promise<Set<number>> {
    const sentLogs = await AppDataSource.getRepository(ReminderLog).find({
      where: {
        hearing: { hearing_id: hearing.hearing_id },
        status: ReminderDeliveryStatus.SENT,
      },
      relations: {
        client: true,
      },
    });

    return new Set(sentLogs.map((log) => log.client.client_id));
  }

  private static buildReminderMessage(client: Client, hearing: Hearing): string {
    const details = [
      `Dear ${client.full_name || "Client"},`,
      `This is a reminder that your hearing is scheduled on ${hearing.hearing_date}.`,
    ];

    if (hearing.purpose) {
      details.push(`Purpose: ${hearing.purpose}`);
    }

    if (hearing.requirements) {
      details.push(`Requirements: ${hearing.requirements}`);
    }

    return details.join("\n");
  }

  private static toReminderChannel(channel: string): ReminderChannel {
    switch (channel) {
      case "email":
        return ReminderChannel.EMAIL;
      case "whatsapp":
        return ReminderChannel.WHATSAPP;
      case "sms":
        return ReminderChannel.SMS;
      default:
        throw new Error(`Unsupported reminder channel: ${channel}`);
    }
  }

  private static async logReminderAttempt(params: ReminderAttemptParams) {
    const log = AppDataSource.getRepository(ReminderLog).create({
      hearing: params.reminder.hearing,
      client: params.client,
      channel: params.channel,
      status: params.status,
      error_message: params.errorMessage ?? null,
      provider_name: params.providerName ?? null,
      provider_message_id: params.providerMessageId ?? null,
      provider_event_type: params.providerEventType ?? null,
      provider_last_event_at: params.providerLastEventAt ?? null,
      sent_at:
        params.status === ReminderDeliveryStatus.SENT
          ? params.providerLastEventAt ?? new Date()
          : null,
    });

    await AppDataSource.getRepository(ReminderLog).save(log);
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
    logger.info("Email reminder dispatched through placeholder transport", {
      subject: payload.subject,
      preview: payload.body.slice(0, 80),
    });
  }

  /**
   * WhatsApp via Gupshup
   */
  private static async sendWhatsApp(destination: string, message: string) {
    return GupshupService.sendTextMessage(destination, message);
  }

  /**
   * SMS (placeholder)
   */
  private static async sendSMS(message: string) {
    logger.info("SMS reminder dispatched through placeholder transport", {
      preview: message.slice(0, 80),
    });
  }
}
