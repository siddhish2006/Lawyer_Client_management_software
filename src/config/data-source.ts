import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";

// Entities
import { User } from "../entities/User";
import { Client } from "../entities/Client";
import { ClientType } from "../entities/ClientType";
import { Case } from "../entities/Case";
import { CaseClient } from "../entities/CaseClient";
import { CaseStatus } from "../entities/CaseStatus";
import { CaseType } from "../entities/CaseType";
import { CaseCategory } from "../entities/CaseCategory";
import { District } from "../entities/District";
import { CourtComplex } from "../entities/CourtComplex";
import { CourtName } from "../entities/CourtName";
import { Hearing } from "../entities/Hearing";
import { HearingLog } from "../entities/HearingLog";
import { Opponent } from "../entities/Opponent";
import { Defendant } from "../entities/Defendant";
import { CaseOpponent } from "../entities/CaseOpponent";
import { CaseDefendant } from "../entities/CaseDefendant";

/**
 * Central TypeORM DataSource.
 * This is the single DB connection used everywhere.
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB.HOST,
  port: env.DB.PORT,
  username: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,

  synchronize: true, // Use true in dev; switch to migrations in prod
  logging: false,

  entities: [
    User,
    Client,
    ClientType,
    Case,
    CaseClient,
    CaseStatus,
    CaseType,
    CaseCategory,
    District,
    CourtComplex,
    CourtName,
    Hearing,
    HearingLog,
    Opponent,
    Defendant,
    CaseOpponent,
    CaseDefendant,
  ],
});
