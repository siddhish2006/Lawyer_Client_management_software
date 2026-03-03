import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { Hearing } from "./Hearing";

export enum ReminderType {
  FIVE_DAYS = "FIVE_DAYS",
  ONE_DAY = "ONE_DAY",
}

@Entity("reminders")
export class Reminder {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Hearing, { onDelete: "CASCADE" })
  hearing!: Hearing;

  @Column({ type: "date" })
  reminder_date!: Date;

  @Column({
    type: "enum",
    enum: ReminderType,
  })
  type!: ReminderType;

  @Column({ default: false })
  sent!: boolean;
}
