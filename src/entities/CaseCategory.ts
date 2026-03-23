import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Case } from "./Case";

@Entity("case_category_master")
export class CaseCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  name!: string;

  @Column({ default: true, nullable: true })
  is_active!: boolean;

  @OneToMany(() => Case, c => c.case_category)
  cases!: Case[];
}
