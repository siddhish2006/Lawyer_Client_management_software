import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Case } from "./Case";

@Entity("hearing_logs")
export class HearingLog {
  @PrimaryGeneratedColumn()
  log_id!: number;

  @ManyToOne(() => Case, c => c.hearing_logs)
  @JoinColumn({ name: "case_id" })
  case!: Case;

  @Column({ type: "date", nullable: true })
  hearing_date!: Date;

  @Column({ type: "text", nullable: true })
  purpose!: string;

  @Column({ type: "text", nullable: true })
  outcome!: string;

  @Column({ type: "timestamptz", nullable: true })
  logged_on!: Date;
}
