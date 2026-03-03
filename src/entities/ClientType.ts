import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Client } from "./Client";

@Entity("client_type_master")
export class ClientType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ default: true })
  is_active!: boolean;

  @OneToMany(() => Client, c => c.client_type)
  clients!: Client[];
}
