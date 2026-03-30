import { AppDataSource } from "../config/data-source";
import { Defendant } from "../entities/Defendant";
import { CreateDefendantDTO } from "../dtos/parties/CreateDefendant.dto";
import { UpdateDefendantDTO } from "../dtos/parties/UpdateDefendant.dto";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";
import { Client } from "../entities/Client";
import { AppError } from "../errors/AppError";

export class DefendantService {
  private static getDefendantRepo() {
    return AppDataSource.getRepository(Defendant);
  }

  private static getClientRepo() {
    return AppDataSource.getRepository(Client);
  }

  static async create(dto: CreateDefendantDTO): Promise<Defendant> {
    const defendantRepo = this.getDefendantRepo();

    const existing = await defendantRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictError("Defendant already exists");
    }

    let client: Client | null = null;
    if (dto.client_id) {
      client = await this.getClientRepo().findOne({ where: { client_id: dto.client_id } });
      if (!client) {
        throw new AppError("Invalid client", 400);
      }
    }

    const item = defendantRepo.create({
      name: dto.name,
      phone_number: dto.phone_number,
      email: dto.email,
      client: client,
    });

    const saved = await defendantRepo.save(item);

    return saved;
  }

  static async getById(id: number): Promise<Defendant> {
    const defendantRepo = this.getDefendantRepo();

    const item = await defendantRepo.findOne({
      where: { defendant_id: id },
      relations: ["client"],
    });

    if (!item) {
      throw new NotFoundError(`Defendant not found`);
    }

    return item;
  }

  static async list(query?: any): Promise<Defendant[]> {
    const defendantRepo = this.getDefendantRepo();

    const items = await defendantRepo.find({
      order: { defendant_id: "ASC" },
      relations: ["client"],
    });

    return items;
  }

  static async update(id: number, dto: UpdateDefendantDTO): Promise<Defendant> {
    const defendantRepo = this.getDefendantRepo();
    const item = await this.getById(id);

    if (dto.name) {
      item.name = dto.name;
    }
    if (dto.phone_number) {
      item.phone_number = dto.phone_number;
    }
    if (dto.email) {
      item.email = dto.email;
    }

    if (dto.client_id) {
      const client = await this.getClientRepo().findOne({ where: { client_id: dto.client_id } });
      if (!client) {
        throw new AppError("Invalid client", 400);
      }
      item.client = client;
    }

    const updated = await defendantRepo.save(item);

    return updated;
  }

  static async delete(id: number): Promise<void> {
    const defendantRepo = this.getDefendantRepo();
    await this.getById(id);
    await defendantRepo.delete(id);
  }
}
