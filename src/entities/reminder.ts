import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Hearing } from "./Hearing";

@Entity("reminders")
export class Reminder {
  @PrimaryGeneratedColumn()
  reminder_id!: number;

  @ManyToOne(() => Hearing, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hearing_id" })
  hearing!: Hearing;

  @Column({ type: "timestamp" })
  reminder_date!: Date;

  @Column("text", { array: true, nullable: true })
  notification_channels!: string[] | null;

  @Column({ default: false })
  is_sent!: boolean;

  @Column({ default: 0 })
  retry_count!: number;

  @Column({ default: false })
  is_failed!: boolean;

  @Column({ type: "timestamp", nullable: true })
  last_retry_at!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  failed_at!: Date | null;

  @Column({ default: false })
  is_processing!: boolean;

  @Column({ type: "timestamp", nullable: true })
  processing_started_at!: Date | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}
