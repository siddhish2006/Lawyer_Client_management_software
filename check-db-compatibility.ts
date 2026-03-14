import "reflect-metadata";
import { DataSource } from "typeorm";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

interface TableSchema {
  [tableName: string]: {
    [columnName: string]: string;
  };
}

async function checkDatabaseCompatibility() {
  const client = new pg.Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✓ Connected to database successfully\n");

    // Get all tables in the database
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const existingTables = result.rows.map((row) => row.table_name);

    // Expected tables from the TypeORM entities
    const expectedTables = [
      "users",
      "clients",
      "client_type_master",
      "cases",
      "case_clients",
      "case_status_master",
      "case_type_master",
      "case_category_master",
      "district_master",
      "court_complex_master",
      "court_name_master",
      "hearings",
      "hearing_logs",
      "opponents",
      "defendants",
      "case_opponents",
      "case_defendants",
    ];

    console.log("=".repeat(70));
    console.log("DATABASE COMPATIBILITY CHECK");
    console.log("=".repeat(70));

    // Check for missing tables
    const missingTables = expectedTables.filter(
      (t) => !existingTables.includes(t)
    );
    const extraTables = existingTables.filter((t) => !expectedTables.includes(t));

    if (missingTables.length > 0) {
      console.log("\n❌ MISSING TABLES:");
      missingTables.forEach((t) => console.log(`   - ${t}`));
    } else {
      console.log("\n✓ All expected tables exist");
    }

    if (extraTables.length > 0) {
      console.log("\n⚠ EXTRA TABLES (not in entities):");
      extraTables.forEach((t) => console.log(`   - ${t}`));
    }

    // If all tables exist, check columns
    if (missingTables.length === 0) {
      console.log("\n" + "-".repeat(70));
      console.log("CHECKING TABLE SCHEMAS");
      console.log("-".repeat(70));

      const expectedSchema: { [key: string]: string[] } = {
        users: [
          "user_id",
          "full_name",
          "email",
          "phone_number",
          "password_hash",
          "status",
          "created_on",
          "last_login",
          "role",
        ],
        clients: [
          "client_id",
          "full_name",
          "phone_number",
          "whatsapp_number",
          "email",
          "address",
          "client_typeId", // or similar FK reference
          "date_of_association",
          "primary_practice_area",
          "current_legal_relationship",
          "referred_by",
          "added_on",
        ],
        client_type_master: ["id", "name", "is_active"],
        cases: [
          "case_id",
          "case_number",
          "act",
          "registration_date",
          "case_categoryId", // FK
          "case_typeId", // FK
          "case_statusId", // FK
          "districtId", // FK
          "court_complexId", // FK
          "court_nameId", // FK
          "description",
          "notes",
          "created_on",
          "last_updated",
        ],
        case_clients: ["id", "caseId", "clientId"],
        case_status_master: ["id", "name", "is_active"],
        case_type_master: ["id", "name", "is_active"],
        case_category_master: ["id", "name", "is_active"],
        district_master: ["id", "name", "is_active"],
        court_complex_master: ["id", "name", "districtId", "is_active"],
        court_name_master: ["id", "name", "complexId", "is_active"],
        hearings: ["hearing_id", "caseId", "hearing_date", "purpose", "requirements", "created_on"],
        hearing_logs: [
          "log_id",
          "caseId",
          "hearing_date",
          "purpose",
          "outcome",
          "logged_on",
        ],
        opponents: [
          "opponent_id",
          "name",
          "phone_number",
          "email",
        ],
        defendants: [
          "defendant_id",
          "clientId",
          "name",
          "phone_number",
          "email",
        ],
        case_opponents: ["id", "caseId", "opponentId"],
        case_defendants: ["id", "caseId", "defendantId"],
      };

      let schemaIssues = 0;

      // Check each table's columns
      for (const tableName of expectedTables) {
        const columnsResult = await client.query(
          `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `,
          [tableName]
        );

        const existingColumns = columnsResult.rows.map((r) => r.column_name);
        const expectedCols = expectedSchema[tableName] || [];

        // Flexible column matching (TypeORM might name FKs differently)
        const baseExpectedCols = expectedCols.map((c) =>
          c.replace(/Id$/, "").toLowerCase()
        );

        let allFound = true;
        console.log(`\n📋 Table: "${tableName}"`);
        console.log(`   Columns: ${existingColumns.length}`);

        const criticalMissing = expectedCols.filter((col) => {
          const baseName = col.replace(/Id$/, "").toLowerCase();
          return !existingColumns.some(
            (ec) =>
              ec.toLowerCase() === col.toLowerCase() ||
              ec.toLowerCase().includes(baseName)
          );
        });

        if (criticalMissing.length > 0) {
          console.log(`   ❌ Missing critical columns: ${criticalMissing.join(", ")}`);
          schemaIssues++;
          allFound = false;
        } else {
          console.log(`   ✓ All critical columns present`);
        }

        if (allFound) {
          console.log(`   ✓ Schema looks good`);
        }
      }

      console.log("\n" + "=".repeat(70));
      if (schemaIssues === 0) {
        console.log("✓ DATABASE IS COMPATIBLE WITH BACKEND CODE");
      } else {
        console.log(`❌ FOUND ${schemaIssues} TABLE(S) WITH SCHEMA ISSUES`);
      }
      console.log("=".repeat(70));
    } else {
      console.log("\n" + "=".repeat(70));
      console.log("❌ DATABASE IS NOT COMPATIBLE - MISSING TABLES");
      console.log("=".repeat(70));
      console.log("\nRECOMMENDATION: Run TypeORM synchronize to create tables:");
      console.log("   In data-source.ts, set: synchronize: true");
      console.log("   Then restart the application");
    }

    console.log("\n📊 SUMMARY:");
    console.log(`   Total Expected Tables: ${expectedTables.length}`);
    console.log(`   Existing Tables: ${existingTables.length}`);
    console.log(`   Missing Tables: ${missingTables.length}`);
    console.log(`   Extra Tables: ${extraTables.length}`);
  } catch (error) {
    console.error(
      "❌ Error connecting to database:",
      error instanceof Error ? error.message : error
    );
  } finally {
    await client.end();
  }
}

checkDatabaseCompatibility().catch(console.error);
