import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { District } from "./District";
import { CourtName } from "./CourtName";
import { Case } from "./Case";

@Entity("court_complex_master")
export class CourtComplex {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @ManyToOne(() => District, d => d.complexes)
  @JoinColumn({ name: "district_id" })
  district!: District;

  @Column({ default: true })
  is_active!: boolean;

  @OneToMany(() => CourtName, c => c.complex)
  courts!: CourtName[];

  @OneToMany(() => Case, c => c.court_complex)
  cases!: Case[];
}
