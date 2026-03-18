import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Case } from "./Case";

@Entity("hearings")
export class Hearing {
  @PrimaryGeneratedColumn()
  hearing_id!: number;

  @ManyToOne(() => Case, c => c.hearings)
  @JoinColumn({ name: "case_id" })
  case!: Case;

  @Column({ type: "date" })
  hearing_date!: Date;

  @Column({ type: "text", nullable: true })
  purpose!: string;

  @Column({ type: "text", nullable: true })
  requirements!: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  created_on!: Date;
}
