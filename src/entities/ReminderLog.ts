import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Hearing } from "./Hearing";
import { Client } from "./Client";

export enum ReminderChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  SMS = "SMS",
}

export enum ReminderDeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

@Entity("reminder_logs")
export class ReminderLog {
  @PrimaryGeneratedColumn()
  log_id!: number;

  @ManyToOne(() => Hearing, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hearing_id" })
  hearing!: Hearing;

  @ManyToOne(() => Client, { onDelete: "CASCADE" })
  @JoinColumn({ name: "client_id" })
  client!: Client;

  @Column({
    type: "enum",
    enum: ReminderChannel,
    enumName: "reminder_logs_channel_enum",
  })
  channel!: ReminderChannel;

  @Column({
    type: "enum",
    enum: ReminderDeliveryStatus,
    enumName: "reminder_logs_status_enum",
  })
  status!: ReminderDeliveryStatus;

  @Column({ type: "text", nullable: true })
  error_message!: string | null;

  @Column({ type: "text", nullable: true })
  provider_name!: string | null;

  @Column({ type: "text", nullable: true })
  provider_message_id!: string | null;

  @Column({ type: "text", nullable: true })
  provider_event_type!: string | null;

  @Column({ type: "timestamp", nullable: true })
  provider_last_event_at!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  sent_at!: Date | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}
