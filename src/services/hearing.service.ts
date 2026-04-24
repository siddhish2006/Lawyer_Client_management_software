import { AppDataSource } from "../config/data-source";
import { Hearing } from "../entities/Hearing";
import { Case } from "../entities/Case";
import { Client } from "../entities/Client";
import { CreateHearingDTO } from "../dtos/hearing/CreateHearing.dto";
import { ValidationError } from "../errors/ValidationError";
import { NotFoundError } from "../errors/NotFoundError";
import { NotificationService } from "./notification.service";

/**
 * HearingService
 *
 * Responsible for:
 * - Hearing creation, lookup, listing, and deletion
 * - Database persistence
 * - Triggering notification workflows after hearing creation
 */
export class HearingService {
  private static hasAnyContact(client: Client): boolean {
    return [client.email, client.phone_number, client.whatsapp_number].some(
      (value) => typeof value === "string" && value.trim().length > 0
    );
  }

  // ----------------------------------
  // CREATE HEARING
  // ----------------------------------

  static async createHearing(dto: CreateHearingDTO) {
    if (!dto.case_id) {
      throw new ValidationError("case_id is required");
    }

    const saved = await AppDataSource.transaction(async (manager) => {
      const caseRepo = manager.getRepository(Case);
      const hearingRepo = manager.getRepository(Hearing);

      const caseEntity = await caseRepo.findOne({
        where: { case_id: dto.case_id },
        relations: {
          clients: {
            client: true,
          },
        },
      });

      if (!caseEntity) {
        throw new NotFoundError("Case not found");
      }

      const caseClients = caseEntity.clients
        .map((link) => link.client)
        .filter(Boolean);

      const clientsWithContact = caseClients.filter((client) =>
        this.hasAnyContact(client)
      );
      const clientsWithoutContact = caseClients.filter(
        (client) => !this.hasAnyContact(client)
      );

      if (clientsWithContact.length === 0) {
        throw new ValidationError(
          "Please input at least one contact info for at least one client before creating a hearing."
        );
      }

      const hearing = hearingRepo.create({
        case: caseEntity,
        hearing_date: new Date(dto.hearing_date),
        purpose: dto.purpose,
        requirements: dto.requirements,
      });

      const savedHearing = await hearingRepo.save(hearing);
      const reminder = await NotificationService.createReminderRecord(
        manager,
        savedHearing,
        dto.notification_channels || ["email", "whatsapp"]
      );

      return {
        hearing: savedHearing,
        reminder,
        clientsWithoutContact,
      };
    });

    // Try immediate delivery only after the hearing + reminder record commit.
    await NotificationService.notifyHearingCreated(
      saved.reminder,
      dto.notification_channels || ["email", "whatsapp"]
    ).catch((err) => {
      console.error(
        "Immediate reminder delivery failed (hearing and reminder still created):",
        err.message
      );
    });

    const warnings =
      saved.clientsWithoutContact.length > 0
        ? [
            {
              code: "MISSING_CO_CLIENT_CONTACT_INFO",
              message:
                "Hearing created, but some co-clients do not have any contact info. Reminders will be sent only to co-clients with available contact details.",
              clients: saved.clientsWithoutContact.map((client) => ({
                client_id: client.client_id,
                full_name: client.full_name,
              })),
            },
          ]
        : [];

    return {
      success: true,
      message: "Hearing created successfully",
      data: saved.hearing,
      warnings,
    };
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
      .leftJoinAndSelect("h.case", "case")
      .leftJoinAndSelect("case.court_name", "court_name")
      .leftJoinAndSelect("case.clients", "case_clients")
      .leftJoinAndSelect("case_clients.client", "client");

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

    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 1000);

    qb.skip((page - 1) * limit).take(limit);

    return qb.orderBy("h.hearing_date", "ASC").getMany();
  }

  // ----------------------------------
  // UPDATE OUTCOME (past hearings only)
  // ----------------------------------

  static async updateOutcome(id: number, outcome: string) {
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

    hearing.outcome = outcome;
    return hearingRepo.save(hearing);
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
