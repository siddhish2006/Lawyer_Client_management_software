import { AppDataSource } from "../config/data-source";
import { HearingLog } from "../entities/HearingLog";
import { Hearing } from "../entities/Hearing";
import { CreateHearingLogDTO } from "../dtos/hearing/CreateHearingLog.dto";
import { NotFoundError } from "../errors/NotFoundError";
import { ValidationError } from "../errors/ValidationError";

export interface HearingLogFilters {
  hearing_id?: string | number;
  case_id?: string | number;
  page?: string | number;
  limit?: string | number;
}

/**
 * HearingLogService
 *
 * Records outcomes after each hearing. Legacy rows may have a NULL hearing_id
 * (see 2026-04-19-hearing-logs-reshape.sql); those are ignored by hearing_id
 * filters.
 */
export class HearingLogService {
  static async list(filters: HearingLogFilters) {
    const repo = AppDataSource.getRepository(HearingLog);

    const qb = repo
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.hearing", "hearing")
      .leftJoinAndSelect("hearing.case", "c");

    if (filters.hearing_id) {
      qb.andWhere("hearing.hearing_id = :hid", {
        hid: Number(filters.hearing_id),
      });
    }

    if (filters.case_id) {
      qb.andWhere("c.case_id = :cid", {
        cid: Number(filters.case_id),
      });
    }

    if (filters.page !== undefined || filters.limit !== undefined) {
      const page = Math.max(Number(filters.page) || 1, 1);
      const limit = Math.max(Number(filters.limit) || 50, 1);
      qb.skip((page - 1) * limit).take(limit);
    }

    return qb.orderBy("log.logged_on", "DESC").getMany();
  }

  static async create(dto: CreateHearingLogDTO) {
    if (!dto.hearing_id) {
      throw new ValidationError("hearing_id is required");
    }

    const hearingRepo = AppDataSource.getRepository(Hearing);
    const hearing = await hearingRepo.findOne({
      where: { hearing_id: dto.hearing_id },
    });

    if (!hearing) {
      throw new NotFoundError("Hearing not found");
    }

    const repo = AppDataSource.getRepository(HearingLog);
    const log = repo.create({
      hearing,
      hearing_date: new Date(dto.hearing_date),
      purpose: dto.purpose,
      outcome: dto.outcome,
    });

    return repo.save(log);
  }

  static async delete(id: number) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid log ID required");
    }

    const repo = AppDataSource.getRepository(HearingLog);
    const log = await repo.findOne({ where: { log_id: id } });

    if (!log) {
      throw new NotFoundError("Hearing log not found");
    }

    await repo.remove(log);
  }
}
