import { AppDataSource } from "../config/data-source";
import { CourtName } from "../entities/CourtName";
import { CourtComplex } from "../entities/CourtComplex";
import { CreateCourtNameDTO } from "../dtos/masters/CreateCourtName.dto";
import { UpdateCourtNameDTO } from "../dtos/masters/UpdateCourtName.dto";
import { AppError } from "../errors/AppError";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";

export class CourtNameService {
  private static getCourtNameRepo() {
    return AppDataSource.getRepository(CourtName);
  }

  private static getCourtComplexRepo() {
    return AppDataSource.getRepository(CourtComplex);
  }

  static async create(dto: CreateCourtNameDTO): Promise<CourtName> {
    const courtNameRepo = this.getCourtNameRepo();
    const courtComplexRepo = this.getCourtComplexRepo();

    const existing = await courtNameRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictError("Court name already exists");
    }

    const complex = await courtComplexRepo.findOne({
      where: { id: dto.court_complex_id },
    });

    if (!complex) {
      throw new AppError("Invalid court complex", 400);
    }

    const item = courtNameRepo.create({
      name: dto.name,
      complex: complex,
    });

    const saved = await courtNameRepo.save(item);

    return saved;
  }

  static async getById(id: number): Promise<CourtName> {
    const courtNameRepo = this.getCourtNameRepo();

    const item = await courtNameRepo.findOne({
      where: { id },
      relations: ["complex"],
    });

    if (!item) {
      throw new NotFoundError(`Court name not found`);
    }

    return item;
  }

  static async list(query?: any): Promise<CourtName[]> {
    const courtNameRepo = this.getCourtNameRepo();

    const items = await courtNameRepo.find({
      order: { id: "ASC" },
      relations: ["complex"],
    });

    return items;
  }

  static async update(id: number, dto: UpdateCourtNameDTO): Promise<CourtName> {
    const courtNameRepo = this.getCourtNameRepo();
    const courtComplexRepo = this.getCourtComplexRepo();
    const item = await this.getById(id);

    if (dto.name) {
      item.name = dto.name;
    }

    if (dto.court_complex_id) {
      const complex = await courtComplexRepo.findOne({
        where: { id: dto.court_complex_id },
      });

      if (!complex) {
        throw new AppError("Invalid court complex", 400);
      }
      item.complex = complex;
    }

    const updated = await courtNameRepo.save(item);

    return updated;
  }

  static async delete(id: number): Promise<void> {
    const courtNameRepo = this.getCourtNameRepo();
    await this.getById(id);
    await courtNameRepo.delete(id);
  }
}
