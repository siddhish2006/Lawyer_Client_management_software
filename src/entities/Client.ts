import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { ClientType } from "./ClientType";
import { CaseClient } from "./CaseClient";
import { Defendant } from "./Defendant";

export enum ClientRelationship {
  Active = "Active",
  Inactive = "Inactive",
  Closed = "Closed",
  Blacklisted = "Blacklisted",
}

@Entity("clients")
export class Client {
  @PrimaryGeneratedColumn()
  client_id!: number;

  @Column({ type: "text", nullable: true })
  full_name!: string;

  @Column({ type: "text", nullable: true })
  phone_number!: string;

  @Column({ type: "text", nullable: true })
  whatsapp_number!: string;

  @Column({ type: "text", nullable: true })
  email!: string;

  @Column({ type: "text", nullable: true })
  address!: string;

  @ManyToOne(() => ClientType, ct => ct.clients)
  @JoinColumn({ name: "client_type_id" })
  client_type!: ClientType;

  @Column({ type: "date", nullable: true })
  date_of_association!: Date;

  @Column({ type: "text", nullable: true })
  primary_practice_area!: string;

  @Column({ type: "text", nullable: true })
  current_legal_relationship!: ClientRelationship;

  @Column({ type: "text", nullable: true })
  referred_by!: string;

  @Column({ type: "timestamptz", nullable: true })
  added_on!: Date;

  @OneToMany(() => CaseClient, cc => cc.client)
  case_links!: CaseClient[];

  @OneToMany(() => Defendant, d => d.client)
  defendant_links!: Defendant[];
}
