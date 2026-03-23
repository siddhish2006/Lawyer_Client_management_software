# Database Schema

Complete database schema for Lawyer Client Management System using TypeORM with PostgreSQL.

## Tables Overview

- **Master Tables**: 9 tables (reference data)
- **Core Tables**: 4 tables (users, clients, cases, hearings)
- **Junction Tables**: 3 tables (many-to-many relationships)
- **Log Tables**: 2 tables (hearing logs, reminders)

**Total**: 18 tables

---

## 1. Master Tables

### 1.1 client_type_master
**Purpose**: Client categorization (Individual, Corporate, Government, etc.)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| name | VARCHAR | NO | - | Client type name (unique) |
| is_active | BOOLEAN | NO | true | Active status |

**Relations**:
- → clients (OneToMany)

---

### 1.2 case_category_master
**Purpose**: Case categorization (Civil, Criminal, Family, etc.)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| name | VARCHAR | NO | - | Category name (unique) |
| is_active | BOOLEAN | NO | true | Active status |

**Relations**:
- → cases (OneToMany)

---

### 1.3 case_type_master
**Purpose**: Specific case types (Petition, Appeal, Writ, etc.)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| name | VARCHAR | NO | - | Type name (unique) |
| is_active | BOOLEAN | NO | true | Active status |

**Relations**:
- → cases (OneToMany)

---

### 1.4 case_status_master
**Purpose**: Case status tracking (Active, Pending, Closed, etc.)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| name | VARCHAR | NO | - | Status name (unique) |
| is_active | BOOLEAN | NO | true | Active status |

**Relations**:
- → cases (OneToMany)

---

### 1.5 district_master
**Purpose**: District/jurisdiction listing

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| name | VARCHAR | NO | - | District name (unique) |
| is_active | BOOLEAN | NO | true | Active status |

**Relations**:
- → court_complex_master (OneToMany)
- → cases (OneToMany)

---

### 1.6 court_complex_master
**Purpose**: Court complex/building listing

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| name | VARCHAR | NO | - | Complex name (unique) |
| district_id | INTEGER | NO | - | Foreign key to district |
| is_active | BOOLEAN | NO | true | Active status |

**Relations**:
- → district_master (ManyToOne)
- → court_name_master (OneToMany)
- → cases (OneToMany)

---

### 1.7 court_name_master
**Purpose**: Specific court names within complexes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| name | VARCHAR | NO | - | Court name (unique) |
| complex_id | INTEGER | NO | - | Foreign key to court complex |
| is_active | BOOLEAN | NO | true | Active status |

**Relations**:
- → court_complex_master (ManyToOne)
- → cases (OneToMany)

---

## 2. Core Tables

### 2.1 users
**Purpose**: System users (lawyers, assistants)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| user_id | INTEGER | NO | AUTO | Primary key |
| full_name | VARCHAR | NO | - | User full name |
| email | VARCHAR | NO | - | Email (unique) |
| phone_number | VARCHAR | NO | - | Contact number |
| password_hash | VARCHAR | NO | - | Hashed password |
| status | ENUM | NO | - | Active, Resigned |
| role | ENUM | NO | - | lawyer, assistant |
| created_on | TIMESTAMP | NO | NOW() | Account creation date |
| last_login | TIMESTAMP | YES | NULL | Last login timestamp |

**Relations**: None

**Enums**:
- UserStatus: `Active`, `Resigned`
- UserRole: `lawyer`, `assistant`

---

### 2.2 clients
**Purpose**: Client information

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| client_id | INTEGER | NO | AUTO | Primary key |
| full_name | VARCHAR | NO | - | Client full name |
| phone_number | VARCHAR | NO | - | Contact number |
| whatsapp_number | VARCHAR | YES | NULL | WhatsApp contact |
| email | VARCHAR | YES | NULL | Email address |
| address | VARCHAR | YES | NULL | Physical address |
| client_type_id | INTEGER | NO | - | Foreign key to client_type_master |
| date_of_association | DATE | YES | NULL | Client onboarding date |
| primary_practice_area | VARCHAR | YES | NULL | Legal area focus |
| current_legal_relationship | ENUM | NO | - | Active, Inactive, Closed, Blacklisted |
| referred_by | VARCHAR | YES | NULL | Referral source |
| added_on | TIMESTAMP | NO | NOW() | Record creation date |

**Relations**:
- → client_type_master (ManyToOne)
- → case_clients (OneToMany)
- → defendants (OneToMany)

**Enums**:
- ClientRelationship: `Active`, `Inactive`, `Closed`, `Blacklisted`

---

### 2.3 opponents
**Purpose**: Opposing parties in cases

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| opponent_id | INTEGER | NO | AUTO | Primary key |
| name | VARCHAR | NO | - | Opponent name |
| phone_number | VARCHAR | YES | NULL | Contact number |
| email | VARCHAR | YES | NULL | Email address |

**Relations**:
- → case_opponents (OneToMany)

---

### 2.4 defendants
**Purpose**: Defendants in cases (can link to clients)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| defendant_id | INTEGER | NO | AUTO | Primary key |
| client_id | INTEGER | YES | NULL | Optional link to client |
| name | VARCHAR | NO | - | Defendant name |
| phone_number | VARCHAR | YES | NULL | Contact number |
| email | VARCHAR | YES | NULL | Email address |

**Relations**:
- → clients (ManyToOne, nullable)
- → case_defendants (OneToMany)

---

### 2.5 cases
**Purpose**: Legal case records

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| case_id | INTEGER | NO | AUTO | Primary key |
| case_number | VARCHAR | NO | - | Case file number |
| act | VARCHAR | YES | NULL | Legal act/statute |
| registration_date | DATE | YES | NULL | Case registration date |
| case_category_id | INTEGER | NO | - | FK to case_category_master |
| case_type_id | INTEGER | NO | - | FK to case_type_master |
| case_status_id | INTEGER | NO | - | FK to case_status_master |
| district_id | INTEGER | NO | - | FK to district_master |
| court_complex_id | INTEGER | NO | - | FK to court_complex_master |
| court_name_id | INTEGER | NO | - | FK to court_name_master |
| description | TEXT | YES | NULL | Case description |
| notes | TEXT | YES | NULL | Internal notes |
| created_on | TIMESTAMP | NO | NOW() | Record creation |
| last_updated | TIMESTAMP | NO | NOW() | Last modification |

**Relations**:
- → case_category_master (ManyToOne)
- → case_type_master (ManyToOne)
- → case_status_master (ManyToOne)
- → district_master (ManyToOne)
- → court_complex_master (ManyToOne)
- → court_name_master (ManyToOne)
- → case_clients (OneToMany)
- → case_opponents (OneToMany)
- → case_defendants (OneToMany)
- → hearings (OneToMany)
- → hearing_logs (OneToMany)

---

### 2.6 hearings
**Purpose**: Upcoming court hearing schedule

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| hearing_id | INTEGER | NO | AUTO | Primary key |
| case_id | INTEGER | NO | - | Foreign key to cases |
| hearing_date | DATE | NO | - | Scheduled hearing date |
| purpose | TEXT | YES | NULL | Hearing purpose |
| requirements | TEXT | YES | NULL | Documents/actions needed |
| created_on | TIMESTAMP | NO | NOW() | Record creation |

**Relations**:
- → cases (ManyToOne)
- → reminders (OneToMany, cascade delete)

---

## 3. Junction Tables

### 3.1 case_clients
**Purpose**: Many-to-many between cases and clients

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| case_id | INTEGER | NO | - | Foreign key to cases |
| client_id | INTEGER | NO | - | Foreign key to clients |

**Relations**:
- → cases (ManyToOne)
- → clients (ManyToOne)

---

### 3.2 case_opponents
**Purpose**: Many-to-many between cases and opponents

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| case_id | INTEGER | NO | - | Foreign key to cases |
| opponent_id | INTEGER | NO | - | Foreign key to opponents |

**Relations**:
- → cases (ManyToOne)
- → opponents (ManyToOne)

---

### 3.3 case_defendants
**Purpose**: Many-to-many between cases and defendants

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| case_id | INTEGER | NO | - | Foreign key to cases |
| defendant_id | INTEGER | NO | - | Foreign key to defendants |

**Relations**:
- → cases (ManyToOne)
- → defendants (ManyToOne)

---

## 4. Log & Tracking Tables

### 4.1 hearing_logs
**Purpose**: Historical record of past hearings

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| log_id | INTEGER | NO | AUTO | Primary key |
| case_id | INTEGER | NO | - | Foreign key to cases |
| hearing_date | DATE | NO | - | Hearing date |
| purpose | TEXT | YES | NULL | Hearing purpose |
| outcome | TEXT | YES | NULL | Hearing outcome/notes |
| logged_on | TIMESTAMP | NO | NOW() | Record creation |

**Relations**:
- → cases (ManyToOne)

---

### 4.2 reminders
**Purpose**: Automated hearing reminders

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTO | Primary key |
| hearing_id | INTEGER | NO | - | FK to hearings (CASCADE DELETE) |
| reminder_date | DATE | NO | - | When to send reminder |
| type | ENUM | NO | - | FIVE_DAYS, ONE_DAY |
| sent | BOOLEAN | NO | false | Reminder sent status |

**Relations**:
- → hearings (ManyToOne, onDelete: CASCADE)

**Enums**:
- ReminderType: `FIVE_DAYS`, `ONE_DAY`

---

## Entity Relationship Diagram (Text)

```
district_master
  └─→ court_complex_master
       └─→ court_name_master

client_type_master
  └─→ clients ←─┐
                │
case_category_master ──→ cases ←── case_status_master
case_type_master ─────────┘  │
district_master ──────────────┤
court_complex_master ─────────┤
court_name_master ────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         case_clients   case_opponents  case_defendants
                │             │             │
             clients      opponents     defendants
                                            │
                                         clients (nullable)

cases
  └─→ hearings
       └─→ reminders (CASCADE DELETE)
  └─→ hearing_logs
```

---

## Key Constraints

1. **Unique Constraints**:
   - All master table `name` fields are unique
   - `users.email` is unique

2. **Cascade Deletes**:
   - `reminders` cascade delete when parent `hearing` is deleted

3. **NOT NULL Constraints**:
   - All IDs and foreign keys (except `defendants.client_id`)
   - All master table names
   - Core identifying fields (names, case numbers, etc.)

4. **Enum Constraints**:
   - `users.status`: Active | Resigned
   - `users.role`: lawyer | assistant
   - `clients.current_legal_relationship`: Active | Inactive | Closed | Blacklisted
   - `reminders.type`: FIVE_DAYS | ONE_DAY

---

## Indexing Recommendations

```sql
-- Primary keys (auto-indexed)
-- Foreign keys (should be indexed)
CREATE INDEX idx_clients_client_type ON clients(client_type_id);
CREATE INDEX idx_cases_category ON cases(case_category_id);
CREATE INDEX idx_cases_type ON cases(case_type_id);
CREATE INDEX idx_cases_status ON cases(case_status_id);
CREATE INDEX idx_cases_court ON cases(court_name_id);
CREATE INDEX idx_hearings_case ON hearings(case_id);
CREATE INDEX idx_hearings_date ON hearings(hearing_date);
CREATE INDEX idx_reminders_hearing ON reminders(hearing_id);

-- Junction tables
CREATE INDEX idx_case_clients_case ON case_clients(case_id);
CREATE INDEX idx_case_clients_client ON case_clients(client_id);
CREATE INDEX idx_case_opponents_case ON case_opponents(case_id);
CREATE INDEX idx_case_defendants_case ON case_defendants(case_id);

-- Lookup optimizations
CREATE INDEX idx_clients_name ON clients(full_name);
CREATE INDEX idx_cases_number ON cases(case_number);
CREATE INDEX idx_users_email ON users(email);
```

---

## Migration Notes

- **synchronize: true** is enabled for initial setup
- Tables will be auto-created on first connection
- For production: disable synchronize, use TypeORM migrations
- All entities use `@Entity()` decorators with TypeORM
