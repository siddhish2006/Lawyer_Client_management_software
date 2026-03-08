import { AppDataSource } from "../config/data-source";
import { Hearing } from "../entities/Hearing";
import { Case } from "../entities/Case";
import { CreateHearingDTO } from "../dtos/hearing/CreateHearing.dto";
import { UpdateHearingDTO } from "../dtos/hearing/UpdateHearing.dto";
import { ValidationError } from "../errors/ValidationError";
import { NotFoundError } from "../errors/NotFoundError";
import { NotificationService } from "./notification.service";

/**
 * HearingService
 *
 * Responsible for:
 * - Hearing lifecycle
 * - Database persistence
 * - Triggering notification workflows
 */
export class HearingService {

  // ----------------------------------
  // CREATE HEARING
  // ----------------------------------

  static async createHearing(dto: CreateHearingDTO) {

    if (!dto.case_id) {
      throw new ValidationError("case_id is required");
    }

    return AppDataSource.transaction(async (manager) => {

      const caseRepo = manager.getRepository(Case);
      const hearingRepo = manager.getRepository(Hearing);

      const caseEntity = await caseRepo.findOne({
        where: { case_id: dto.case_id },
      });

      if (!caseEntity) {
        throw new NotFoundError("Case not found");
      }

      const hearing = hearingRepo.create({
        case: caseEntity,
        hearing_date: new Date(dto.hearing_date),
        purpose: dto.purpose,
        requirements: dto.requirements,
      });

      const saved = await hearingRepo.save(hearing);

      /**
       * Trigger notification workflow
       * Notification service handles:
       * - sending immediate notification
       * - scheduling reminder
       */
      await NotificationService.notifyHearingCreated(
        saved,
        dto.notification_channels || ["email","whatsapp"]
      );

      return saved;
    });
  }

  // ----------------------------------
  // UPDATE HEARING
  // ----------------------------------

  static async updateHearing(id: number, dto: UpdateHearingDTO) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid hearing ID required");
    }

    return AppDataSource.transaction(async (manager) => {

      const hearingRepo = manager.getRepository(Hearing);
      const caseRepo = manager.getRepository(Case);

      const hearing = await hearingRepo.findOne({
        where: { hearing_id: id },
        relations: { case: true },
      });

      if (!hearing) {
        throw new NotFoundError("Hearing not found");
      }

      const oldDate = hearing.hearing_date.getTime();

      // Case change
      if (dto.case_id) {

        const newCase = await caseRepo.findOne({
          where: { case_id: dto.case_id },
        });

        if (!newCase) {
          throw new NotFoundError("Case not found");
        }

        hearing.case = newCase;
      }

      // Date update
      if (dto.hearing_date) {
        hearing.hearing_date = new Date(dto.hearing_date);
      }

      if (dto.purpose !== undefined) {
        hearing.purpose = dto.purpose;
      }

      if (dto.requirements !== undefined) {
        hearing.requirements = dto.requirements;
      }

      const updated = await hearingRepo.save(hearing);

      /**
       * If hearing date changed
       * → notify client
       * → reset reminders
       */
      if (dto.hearing_date && updated.hearing_date.getTime() !== oldDate) {

        await NotificationService.notifyHearingRescheduled(
          updated,
          dto.notification_channels || ["email","whatsapp"]
        );

      }

      return updated;
    });
  }

  // ----------------------------------
  // GET HEARING BY ID
  // ----------------------------------

  static async getHearingById(id: number) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid hearing ID required");
    }

    const hearingRepo = AppDataSource.getRepository(Hearing);

    const hearing = await hearingRepo.findOne({
      where: { hearing_id: id },
      relations: { case: true },
    });

    if (!hearing) {
      throw new NotFoundError("Hearing not found");
    }

    return hearing;
  }

  // ----------------------------------
  // LIST HEARINGS
  // ----------------------------------

  static async listHearings(filters: any) {

    const hearingRepo = AppDataSource.getRepository(Hearing);

    const qb = hearingRepo
      .createQueryBuilder("h")
      .leftJoinAndSelect("h.case", "case");

    if (filters.case_id) {
      qb.andWhere("case.case_id = :caseId", {
        caseId: filters.case_id,
      });
    }

    if (filters.from_date) {
      qb.andWhere("h.hearing_date >= :from", {
        from: filters.from_date,
      });
    }

    if (filters.to_date) {
      qb.andWhere("h.hearing_date <= :to", {
        to: filters.to_date,
      });
    }

    return qb.orderBy("h.hearing_date", "ASC").getMany();
  }

  // ----------------------------------
  // DELETE HEARING
  // ----------------------------------

  static async deleteHearing(id: number) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid hearing ID required");
    }

    const hearingRepo = AppDataSource.getRepository(Hearing);

    const hearing = await hearingRepo.findOne({
      where: { hearing_id: id },
    });

    if (!hearing) {
      throw new NotFoundError("Hearing not found");
    }

    await hearingRepo.remove(hearing);
  }
}