import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

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

  @Column()
  full_name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  phone_number!: string;

  @Column()
  password_hash!: string;

  @Column({ type: "enum", enum: UserStatus })
  status!: UserStatus;

  @CreateDateColumn()
  created_on!: Date;

  @Column({ type: "timestamp", nullable: true })
  last_login!: Date | null;

  @Column({ type: "enum", enum: UserRole })
  role!: UserRole;
}
