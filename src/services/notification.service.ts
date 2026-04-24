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
import { sendEmail } from "../utils/email";
import { sendWhatsApp } from "../utils/whatsapp";
import { sendSMS } from "../utils/sms";
import { ReminderTemplate } from "../utils/templates";

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
      // Provider hasn't confirmed yet — don't claim delivered.
      // Daily job will skip re-dispatch via getDispatchedClientIds.
      reminder.is_sent = false;
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
      const hearingWithCase = await this.getHearingWithFullCase(reminder.hearing.hearing_id) ?? reminder.hearing;
      const clients = await this.getClientsFromHearing(reminder.hearing);
      const contactableClients = clients.filter((client) =>
        this.clientHasAnyContact(client)
      );
      const sentClientIds = await this.getSentClientIds(reminder.hearing);
      const dispatchedClientIds = await this.getDispatchedClientIds(
        reminder.hearing
      );

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
        (client) => !dispatchedClientIds.has(client.client_id)
      );

      if (pendingClients.length === 0) {
        const allConfirmed = contactableClients.every((client) =>
          sentClientIds.has(client.client_id)
        );
        if (allConfirmed) {
          await this.finalizeReminderProcessing(reminder, true);
          return true;
        }
        // Awaiting provider confirmation on at least one client.
        // Release the processing lock but keep is_sent=false.
        reminder.is_processing = false;
        reminder.processing_started_at = null;
        await AppDataSource.getRepository(Reminder).save(reminder);
        return false;
      }

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

        const template = this.buildReminderTemplate(client, hearingWithCase);
        let dispatchedToClient = false;

        for (const channel of channels) {
          const reminderChannel = this.toReminderChannel(channel);

          try {
            switch (channel) {
              case "email":
                if (!client.email) {
                  throw new Error("Email address is missing for this client");
                }
                const emailResult = await sendEmail(client.email, template);
                await this.logReminderAttempt({
                  reminder,
                  client,
                  channel: reminderChannel,
                  // Resend webhooks aren't wired yet — accepted = delivered for audit.
                  status: ReminderDeliveryStatus.SENT,
                  providerName: emailResult.providerName,
                  providerMessageId: emailResult.messageId,
                  providerEventType: emailResult.providerEventType,
                  providerLastEventAt: new Date(),
                });
                dispatchedToClient = true;
                break;

              case "whatsapp":
                if (!client.whatsapp_number) {
                  throw new Error("WhatsApp number is missing for this client");
                }

                const whatsappResult = await sendWhatsApp(
                  client.whatsapp_number,
                  template
                );

                await this.logReminderAttempt({
                  reminder,
                  client,
                  channel: reminderChannel,
                  // Gupshup webhook will flip this to SENT/FAILED later.
                  status: ReminderDeliveryStatus.PENDING,
                  providerName: whatsappResult.providerName,
                  providerMessageId: whatsappResult.messageId,
                  providerEventType: whatsappResult.providerEventType,
                  providerLastEventAt: new Date(),
                });
                dispatchedToClient = true;
                break;

              case "sms":
                if (!client.phone_number) {
                  throw new Error("Phone number is missing for this client");
                }
                const smsResult = await sendSMS(client.phone_number, template);
                await this.logReminderAttempt({
                  reminder,
                  client,
                  channel: reminderChannel,
                  // Gupshup SMS webhook isn't wired — accepted = delivered for audit.
                  status: ReminderDeliveryStatus.SENT,
                  providerName: smsResult.providerName,
                  providerMessageId: smsResult.messageId,
                  providerEventType: smsResult.providerEventType,
                  providerLastEventAt: new Date(),
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
  private static async getHearingWithFullCase(
    hearingId: number
  ): Promise<Hearing | null> {
    return AppDataSource.getRepository(Hearing).findOne({
      where: { hearing_id: hearingId },
      relations: {
        case: {
          clients: { client: true },
          district: true,
          court_name: true,
        },
      },
    });
  }

  private static async getClientsFromHearing(
    hearing: Hearing
  ): Promise<Client[]> {
    const loaded = await this.getHearingWithFullCase(hearing.hearing_id);

    if (!loaded || loaded.case.clients.length === 0) {
      throw new Error("Client not found for hearing");
    }

    // Dedupe defensively in case legacy rows created duplicate links.
    const seen = new Set<number>();
    return loaded.case.clients
      .map((link) => link.client)
      .filter((client) => {
        if (!client || seen.has(client.client_id)) return false;
        seen.add(client.client_id);
        return true;
      });
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

  // Clients that already have a SENT or PENDING attempt — we should not re-dispatch.
  private static async getDispatchedClientIds(
    hearing: Hearing
  ): Promise<Set<number>> {
    const logs = await AppDataSource.getRepository(ReminderLog).find({
      where: [
        {
          hearing: { hearing_id: hearing.hearing_id },
          status: ReminderDeliveryStatus.SENT,
        },
        {
          hearing: { hearing_id: hearing.hearing_id },
          status: ReminderDeliveryStatus.PENDING,
        },
      ],
      relations: {
        client: true,
      },
    });

    return new Set(logs.map((log) => log.client.client_id));
  }

  private static buildReminderTemplate(
    client: Client,
    hearing: Hearing
  ): ReminderTemplate {
    return {
      clientName: client.full_name || "Client",
      hearingDate: hearing.hearing_date,
      purpose: hearing.purpose ?? undefined,
      requirements: hearing.requirements ?? undefined,
      caseTitle: hearing.case?.title ?? undefined,
      caseNumber: hearing.case?.case_number ?? undefined,
      courtName: hearing.case?.court_name?.name ?? undefined,
      district: hearing.case?.district?.name ?? undefined,
      act: hearing.case?.act ?? undefined,
    };
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

  // Transport layer lives in src/utils/{whatsapp,email,sms}.ts
}
