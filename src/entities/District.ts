import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { CourtComplex } from "./CourtComplex";
import { Case } from "./Case";

@Entity("district_master")
export class District {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ default: true })
  is_active!: boolean;

  @OneToMany(() => CourtComplex, c => c.district)
  complexes!: CourtComplex[];

  @OneToMany(() => Case, c => c.district)
  cases!: Case[];
}
