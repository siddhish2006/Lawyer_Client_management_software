import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Hearing } from "./Hearing";

@Entity("hearing_logs")
export class HearingLog {
  @PrimaryGeneratedColumn()
  log_id!: number;

  @ManyToOne(() => Hearing, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hearing_id" })
  hearing!: Hearing;

  @Column({ type: "date" })
  hearing_date!: Date;

  @Column({ type: "text", nullable: true })
  purpose!: string;

  @Column({ type: "text", nullable: true })
  outcome!: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  logged_on!: Date;
}
