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

  @Column()
  full_name!: string;

  @Column()
  phone_number!: string;

  @Column({ nullable: true })
  whatsapp_number!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  address!: string;

  @ManyToOne(() => ClientType, ct => ct.clients)
  @JoinColumn({ name: "client_type_id" })
  client_type!: ClientType;

  @Column({ type: "date", nullable: true })
  date_of_association!: Date;

  @Column({ nullable: true })
  primary_practice_area!: string;

  @Column({ type: "enum", enum: ClientRelationship })
  current_legal_relationship!: ClientRelationship;

  @Column({ nullable: true })
  referred_by!: string;

  @Column({ type: "timestamp", default: () => "NOW()" })
  added_on!: Date;

  @OneToMany(() => CaseClient, cc => cc.client)
  case_links!: CaseClient[];

  @OneToMany(() => Defendant, d => d.client)
  defendant_links!: Defendant[];
}
