import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum UserStatus {
  Active = "Active",
  Resigned = "Resigned",
}

export enum UserRole {
  Lawyer = "lawyer",
  Assistant = "assistant",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  user_id!: number;

  @Column({ type: "text", nullable: true })
  full_name!: string;

  @Column({ type: "text", nullable: true })
  email!: string;

  @Column({ type: "text", nullable: true })
  phone_number!: string;

  @Column({ type: "text", nullable: true })
  password_hash!: string;

  @Column({ type: "text", nullable: true })
  status!: UserStatus;

  @Column({ type: "timestamptz", nullable: true })
  created_on!: Date;

  @Column({ type: "timestamptz", nullable: true })
  last_login!: Date | null;

  @Column({ type: "text", nullable: true })
  role!: UserRole;
}
