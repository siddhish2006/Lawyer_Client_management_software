import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Case } from "./Case";

@Entity("hearing_logs")
export class HearingLog {
  @PrimaryGeneratedColumn()
  log_id!: number;

  @ManyToOne(() => Case, c => c.hearing_logs)
  case!: Case;

  @Column({ type: "date" })
  hearing_date!: Date;

  @Column({ type: "text", nullable: true })
  purpose!: string;

  @Column({ type: "text", nullable: true })
  outcome!: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  logged_on!: Date;
}
