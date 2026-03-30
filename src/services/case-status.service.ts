import { AppDataSource } from "../config/data-source";
import { CaseStatus } from "../entities/CaseStatus";
import { CreateCaseStatusDTO } from "../dtos/masters/CreateCaseStatus.dto";
import { UpdateMasterDTO } from "../dtos/masters/UpdateMaster.dto";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";
import { ValidationError } from "../errors/ValidationError";

export class CaseStatusService {

  //====================================================
  // CREATE
  //====================================================

  static async create(dto: CreateCaseStatusDTO) {
    const repo = AppDataSource.getRepository(CaseStatus);

    //----------------------------------
    // Check duplicate name
    //----------------------------------

    const existing = await repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictError("Case status already exists");
    }

    //----------------------------------
    // Save
    //----------------------------------

    const entity = repo.create({
      name: dto.name,
      is_active: dto.is_active ?? true,
    });

    return repo.save(entity);
  }

  //====================================================
  // GET BY ID
  //====================================================

  static async getById(id: number) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid ID required");
    }

    const repo = AppDataSource.getRepository(CaseStatus);
    const entity = await repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundError("Case status not found");
    }

    return entity;
  }

  //====================================================
  // LIST
  //====================================================

  static async list(filters: any) {
    const repo = AppDataSource.getRepository(CaseStatus);
    const qb = repo.createQueryBuilder("cs");

    //----------------------------------
    // Filters
    //----------------------------------

    if (filters.name) {
      qb.andWhere("LOWER(cs.name) LIKE LOWER(:name)", {
        name: `%${filters.name}%`,
      });
    }

    if (filters.is_active !== undefined) {
      qb.andWhere("cs.is_active = :active", {
        active: filters.is_active,
      });
    }

    //----------------------------------
    // Pagination
    //----------------------------------

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;

    qb.skip((page - 1) * limit);
    qb.take(limit);
    qb.orderBy("cs.name", "ASC");

    return qb.getMany();
  }

  //====================================================
  // UPDATE
  //====================================================

  static async update(id: number, dto: UpdateMasterDTO) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid ID required");
    }

    const repo = AppDataSource.getRepository(CaseStatus);
    const entity = await repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundError("Case status not found");
    }

    //----------------------------------
    // Check duplicate name if changing
    //----------------------------------

    if (dto.name && dto.name !== entity.name) {
      const dup = await repo.findOne({ where: { name: dto.name } });
      if (dup) {
        throw new ConflictError("Case status name already exists");
      }
    }

    Object.assign(entity, dto);
    return repo.save(entity);
  }

  //====================================================
  // DELETE
  //====================================================

  static async delete(id: number) {
    if (!id || isNaN(id)) {
      throw new ValidationError("Valid ID required");
    }

    const repo = AppDataSource.getRepository(CaseStatus);
    const entity = await repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundError("Case status not found");
    }

    await repo.remove(entity);
  }
}
