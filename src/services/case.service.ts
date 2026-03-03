import { AppDataSource } from "../config/data-source";
import { CreateCaseDTO } from "../dtos/case/CreateCase.dto";
import { UpdateCaseDTO } from "../dtos/case/UpdateCase.dto";
import { Case } from "../entities/Case";
import { CaseClient } from "../entities/CaseClient";
import { CaseDefendant } from "../entities/CaseDefendant";
import { CaseOpponent } from "../entities/CaseOpponent";
import { Client } from "../entities/Client";
import { Defendant } from "../entities/Defendant";
import { Opponent } from "../entities/Opponent";
import { NotFoundError } from "../errors/NotFoundError";
import { ValidationError } from "../errors/ValidationError";

export class CaseService {

  //====================================================
  // CREATE CASE
  //====================================================

  static async createCase(dto: CreateCaseDTO) {

    return await AppDataSource.transaction(async (manager) => {

      const caseRepo = manager.getRepository(Case);
      const clientRepo = manager.getRepository(Client);
      const defendantRepo = manager.getRepository(Defendant);
      const opponentRepo = manager.getRepository(Opponent);

      //----------------------------------
      // Validate Clients
      //----------------------------------

      const clients = await clientRepo.findByIds(dto.client_ids);

      if (clients.length !== dto.client_ids.length) {
        throw new ValidationError("One or more clients not found");
      }

      //----------------------------------
      // Validate Defendants (optional)
      //----------------------------------

      let defendants: Defendant[] = [];

      if (dto.defendant_ids?.length) {
        defendants = await defendantRepo.findByIds(dto.defendant_ids);

        if (defendants.length !== dto.defendant_ids.length) {
          throw new ValidationError("One or more defendants not found");
        }
      }

      //----------------------------------
      // Validate Opponents (optional)
      //----------------------------------

      let opponents: Opponent[] = [];

      if (dto.opponent_ids?.length) {
        opponents = await opponentRepo.findByIds(dto.opponent_ids);

        if (opponents.length !== dto.opponent_ids.length) {
          throw new ValidationError("One or more opponents not found");
        }
      }

      //----------------------------------
      // Create Case Entity
      //----------------------------------

      const caseEntity = caseRepo.create({
        case_number: dto.case_number,
        act: dto.act,
        registration_date: dto.registration_date,
        description: dto.description,
        notes: dto.notes,
      });

      const savedCase = await caseRepo.save(caseEntity);

      //----------------------------------
      // Link Clients
      //----------------------------------

      for (const client of clients) {
        const link = manager.getRepository(CaseClient).create({
          case: savedCase,
          client,
        });
        await manager.save(link);
      }

      //----------------------------------
      // Link Defendants
      //----------------------------------

      for (const defendant of defendants) {
        const link = manager.getRepository(CaseDefendant).create({
          case: savedCase,
          defendant,
        });
        await manager.save(link);
      }

      //----------------------------------
      // Link Opponents
      //----------------------------------

      for (const opponent of opponents) {
        const link = manager.getRepository(CaseOpponent).create({
          case: savedCase,
          opponent,
        });
        await manager.save(link);
      }

      return savedCase;
    });
  }

  //====================================================
  // GET CASE BY ID
  //====================================================

  static async getCaseById(id: number) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid case ID required");
    }

    const caseRepo = AppDataSource.getRepository(Case);

    const caseEntity = await caseRepo.findOne({
      where: { case_id: id },
      relations: {
        clients: true,
        defendants: true,
        opponents: true,
        hearings: true,
      }
    });

    if (!caseEntity) {
      throw new NotFoundError("Case not found");
    }

    return caseEntity;
  }

  //====================================================
  // LIST CASES WITH FILTERING
  //====================================================

  static async listCases(filters: any) {

    const caseRepo = AppDataSource.getRepository(Case);

    const qb = caseRepo.createQueryBuilder("case")
      .leftJoinAndSelect("case.clients", "clients")
      .leftJoinAndSelect("case.defendants", "defendants")
      .leftJoinAndSelect("case.opponents", "opponents");

    //----------------------------------
    // Filtering
    //----------------------------------

    if (filters.case_number) {
      qb.andWhere("LOWER(case.case_number) LIKE LOWER(:num)", {
        num: `%${filters.case_number}%`
      });
    }

    if (filters.status_id) {
      qb.andWhere("case.case_status_id = :status", {
        status: filters.status_id
      });
    }

    //----------------------------------
    // Pagination
    //----------------------------------

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;

    qb.skip((page - 1) * limit);
    qb.take(limit);

    qb.orderBy("case.created_on", "DESC");

    return await qb.getMany();
  }

  //====================================================
  // UPDATE CASE
  //====================================================

  static async updateCase(id: number, dto: UpdateCaseDTO) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid case ID required");
    }

    return await AppDataSource.transaction(async (manager) => {

      const caseRepo = manager.getRepository(Case);

      const caseEntity = await caseRepo.findOne({
        where: { case_id: id }
      });

      if (!caseEntity) {
        throw new NotFoundError("Case not found");
      }

      //----------------------------------
      // Update scalar fields
      //----------------------------------

      Object.assign(caseEntity, dto);
      caseEntity.last_updated = new Date();

      await caseRepo.save(caseEntity);

      //----------------------------------
      // Replace relations if provided
      //----------------------------------

      if (dto.client_ids) {
        await manager.delete(CaseClient, { case: { case_id: id } });

        for (const clientId of dto.client_ids) {
          const link = manager.getRepository(CaseClient).create({
            case: caseEntity,
            client: { client_id: clientId } as any
          });
          await manager.save(link);
        }
      }

      return caseEntity;
    });
  }

  //====================================================
  // DELETE CASE (SOFT DELETE LATER)
  //====================================================

  static async deleteCase(id: number) {

    if (!id || isNaN(id)) {
      throw new ValidationError("Valid case ID required");
    }

    const caseRepo = AppDataSource.getRepository(Case);

    const caseEntity = await caseRepo.findOne({
      where: { case_id: id }
    });

    if (!caseEntity) {
      throw new NotFoundError("Case not found");
    }

    await caseRepo.remove(caseEntity);
  }
}
