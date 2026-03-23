import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { CourtComplex } from "./CourtComplex";
import { Case } from "./Case";

@Entity("court_name_master")
export class CourtName {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true })
  name!: string;

  @ManyToOne(() => CourtComplex, c => c.courts)
  @JoinColumn({ name: "complex_id" })
  complex!: CourtComplex;

  @Column({ default: true, nullable: true })
  is_active!: boolean;

  @OneToMany(() => Case, c => c.court_name)
  cases!: Case[];
}
