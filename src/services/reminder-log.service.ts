import { AppDataSource } from "../config/data-source";
import { ReminderLog } from "../entities/ReminderLog";

export interface ReminderLogFilters {
  channel?: string;
  status?: string;
  provider_name?: string;
  hearing_id?: string | number;
  client_id?: string | number;
  page?: string | number;
  limit?: string | number;
}

/**
 * ReminderLogService
 *
 * Read-only surface over reminder_logs. Rows are written by
 * NotificationService on send and updated by the Gupshup webhook on
 * delivery confirmation — nothing here mutates them.
 */
export class ReminderLogService {
  static async list(filters: ReminderLogFilters) {
    const repo = AppDataSource.getRepository(ReminderLog);

    const qb = repo
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.hearing", "hearing")
      .leftJoinAndSelect("hearing.case", "c")
      .leftJoinAndSelect("log.client", "client");

    if (filters.channel) {
      qb.andWhere("log.channel = :channel", {
        channel: String(filters.channel).toUpperCase(),
      });
    }

    if (filters.status) {
      qb.andWhere("log.status = :status", {
        status: String(filters.status).toUpperCase(),
      });
    }

    if (filters.provider_name) {
      qb.andWhere("log.provider_name = :provider", {
        provider: String(filters.provider_name).toUpperCase(),
      });
    }

    if (filters.hearing_id) {
      qb.andWhere("hearing.hearing_id = :hid", {
        hid: Number(filters.hearing_id),
      });
    }

    if (filters.client_id) {
      qb.andWhere("client.client_id = :cid", {
        cid: Number(filters.client_id),
      });
    }

    qb.orderBy("log.created_at", "DESC");

    //----------------------------------
    // Pagination
    // When filters are applied, return ALL results.
    // When no filters, apply pagination (default 50, max 200).
    //----------------------------------

    const hasFilters = filters.channel || filters.status || filters.provider_name || 
                      filters.hearing_id || filters.client_id;

    if (!hasFilters) {
      const page = Math.max(Number(filters.page) || 1, 1);
      const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
      qb.skip((page - 1) * limit).take(limit);
    }

    return qb.getMany();
  }
}
