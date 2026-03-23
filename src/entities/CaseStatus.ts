import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Case } from "./Case";

@Entity("case_status_master")
export class CaseStatus {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  name!: string;

  @Column({ default: true, nullable: true })
  is_active!: boolean;

  @OneToMany(() => Case, c => c.case_status)
  cases!: Case[];
}
