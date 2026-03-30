import { AppDataSource } from "../config/data-source";
import { Reminder } from "../entities/reminder";
import { Hearing } from "../entities/Hearing";
import { CreateReminderDTO } from "../dtos/reminder/CreateReminder.dto";
import { UpdateReminderDTO } from "../dtos/reminder/UpdateReminder.dto";
import { AppError } from "../errors/AppError";
import { NotFoundError } from "../errors/NotFoundError";

export class ReminderService {
  private static getReminderRepo() {
    return AppDataSource.getRepository(Reminder);
  }

  private static getHearingRepo() {
    return AppDataSource.getRepository(Hearing);
  }

  static async create(dto: CreateReminderDTO): Promise<Reminder> {
    const reminderRepo = this.getReminderRepo();
    const hearingRepo = this.getHearingRepo();

    const hearing = await hearingRepo.findOne({
      where: { hearing_id: dto.hearing_id },
    });

    if (!hearing) {
      throw new AppError("Invalid hearing", 400);
    }

    const item = reminderRepo.create({
      ...dto,
      hearing: hearing,
    });

    const saved = await reminderRepo.save(item);

    return saved;
  }

  static async getById(id: number): Promise<Reminder> {
    const reminderRepo = this.getReminderRepo();

    const item = await reminderRepo.findOne({
      where: { id },
      relations: ["hearing"],
    });

    if (!item) {
      throw new NotFoundError(`Reminder not found`);
    }

    return item;
  }

  static async list(query?: any): Promise<Reminder[]> {
    const reminderRepo = this.getReminderRepo();

    const items = await reminderRepo.find({
      relations: ["hearing"],
      order: { id: "ASC" },
    });

    return items;
  }

  static async update(id: number, dto: UpdateReminderDTO): Promise<Reminder> {
    const reminderRepo = this.getReminderRepo();
    const item = await this.getById(id);

    if (dto.hearing_id) {
      const hearingRepo = this.getHearingRepo();
      const hearing = await hearingRepo.findOne({
        where: { hearing_id: dto.hearing_id },
      });
      if (!hearing) {
        throw new AppError("Invalid hearing", 400);
      }
      item.hearing = hearing;
    }

    Object.assign(item, dto);

    const updated = await reminderRepo.save(item);

    return updated;
  }

  static async delete(id: number): Promise<void> {
    const reminderRepo = this.getReminderRepo();
    await this.getById(id);
    await reminderRepo.delete(id);
  }
}
