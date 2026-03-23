# Data Flow & Dependency Layers

This document outlines the correct order for populating database tables, showing dependencies between entities.

---

## Dependency Hierarchy

Tables must be filled in this order to respect foreign key constraints:

```
Layer 1 (Independent - No Dependencies)
  ├─ client_type_master
  ├─ case_category_master
  ├─ case_type_master
  ├─ case_status_master
  ├─ district_master
  └─ users

Layer 2 (Depends on Layer 1)
  ├─ court_complex_master (requires: district_master)
  ├─ clients (requires: client_type_master)
  ├─ opponents (independent, but used by Layer 4)
  └─ defendants (optional: clients)

Layer 3 (Depends on Layer 2)
  └─ court_name_master (requires: court_complex_master)

Layer 4 (Depends on Layer 1-3)
  └─ cases (requires: case_category_master, case_type_master, case_status_master,
             district_master, court_complex_master, court_name_master)

Layer 5 (Junction Tables - Depends on Layer 4)
  ├─ case_clients (requires: cases, clients)
  ├─ case_opponents (requires: cases, opponents)
  └─ case_defendants (requires: cases, defendants)

Layer 6 (Depends on Layer 4)
  └─ hearings (requires: cases)

Layer 7 (Depends on Layer 6)
  └─ reminders (requires: hearings)

Layer 8 (Logging - Depends on Layer 4)
  └─ hearing_logs (requires: cases)
```

---

## Layer Details

### **Layer 1: Master Data & Users** (No dependencies)

These tables can be populated in any order:

1. **client_type_master**
   - Examples: Individual, Corporate, Government, NGO
   - Required before creating clients

2. **case_category_master**
   - Examples: Civil, Criminal, Family, Corporate, Tax
   - Required before creating cases

3. **case_type_master**
   - Examples: Petition, Appeal, Writ, Review, Suit
   - Required before creating cases

4. **case_status_master**
   - Examples: Active, Pending, Ongoing, Closed, Dismissed, Won, Lost
   - Required before creating cases

5. **district_master**
   - Examples: Mumbai, Delhi, Bangalore, Chennai
   - Required before creating court complexes and cases

6. **users**
   - System users (lawyers, assistants)
   - Independent of other tables (no FK constraints)

---

### **Layer 2: Dependent Master Data**

7. **court_complex_master**
   - **Depends on**: district_master
   - Examples: "City Civil Court Complex", "Sessions Court Building"
   - Required before creating court names and cases

8. **clients**
   - **Depends on**: client_type_master
   - Client records
   - Required before linking to cases

9. **opponents**
   - No dependencies, but used by cases
   - Opposing party information

10. **defendants**
    - **Optional dependency**: clients (nullable FK)
    - Can reference a client or be standalone

---

### **Layer 3: Court Structure**

11. **court_name_master**
    - **Depends on**: court_complex_master
    - Examples: "Court No. 1", "Civil Judge Senior Division"
    - Required before creating cases

---

### **Layer 4: Cases** (Central entity)

12. **cases**
    - **Depends on**:
      - case_category_master
      - case_type_master
      - case_status_master
      - district_master
      - court_complex_master
      - court_name_master
    - Central entity linking all case-related data

---

### **Layer 5: Case Relationships** (Junction tables)

13. **case_clients**
    - **Depends on**: cases, clients
    - Links clients to cases (many-to-many)

14. **case_opponents**
    - **Depends on**: cases, opponents
    - Links opponents to cases

15. **case_defendants**
    - **Depends on**: cases, defendants
    - Links defendants to cases

---

### **Layer 6: Hearings**

16. **hearings**
    - **Depends on**: cases
    - Scheduled court hearings

---

### **Layer 7: Reminders**

17. **reminders**
    - **Depends on**: hearings
    - Automated reminders for hearings
    - **Cascade deletes**: Deleted when hearing is deleted

---

### **Layer 8: Logs**

18. **hearing_logs**
    - **Depends on**: cases
    - Historical record of past hearings
    - Independent of active hearings table

---

## Data Population Order (Step-by-Step)

### Step 1: Populate Master Tables (Layer 1)

```sql
-- Client types
INSERT INTO client_type_master (name) VALUES
  ('Individual'), ('Corporate'), ('Government'), ('NGO');

-- Case categories
INSERT INTO case_category_master (name) VALUES
  ('Civil'), ('Criminal'), ('Family'), ('Corporate'), ('Tax');

-- Case types
INSERT INTO case_type_master (name) VALUES
  ('Petition'), ('Appeal'), ('Writ'), ('Suit'), ('Complaint');

-- Case statuses
INSERT INTO case_status_master (name) VALUES
  ('Active'), ('Pending'), ('Ongoing'), ('Closed'), ('Won'), ('Lost');

-- Districts
INSERT INTO district_master (name) VALUES
  ('Mumbai'), ('Delhi'), ('Bangalore'), ('Chennai');

-- Users (optional)
INSERT INTO users (full_name, email, phone_number, password_hash, status, role)
VALUES ('John Lawyer', 'john@law.com', '1234567890', 'hashed_pwd', 'Active', 'lawyer');
```

---

### Step 2: Court Hierarchy (Layer 2-3)

```sql
-- Court complexes (depends on districts)
INSERT INTO court_complex_master (name, district_id) VALUES
  ('City Civil Court', 1),  -- district_id = 1 (Mumbai)
  ('Sessions Court', 1);

-- Court names (depends on court complexes)
INSERT INTO court_name_master (name, complex_id) VALUES
  ('Civil Judge Senior Division Court No. 1', 1),  -- complex_id = 1
  ('Court No. 45', 2);
```

---

### Step 3: Clients, Opponents, Defendants (Layer 2)

```sql
-- Clients (depends on client_type_master)
INSERT INTO clients (full_name, phone_number, client_type_id, current_legal_relationship)
VALUES ('Jane Doe', '9876543210', 1, 'Active');  -- client_type_id = 1 (Individual)

-- Opponents (independent)
INSERT INTO opponents (name, phone_number)
VALUES ('ABC Corporation', '5551234567');

-- Defendants (optional FK to clients)
INSERT INTO defendants (name, client_id)
VALUES ('Former Client as Defendant', 1);  -- Links to client_id = 1
```

---

### Step 4: Cases (Layer 4)

```sql
-- Cases (depends on multiple master tables)
INSERT INTO cases (
  case_number,
  case_category_id,
  case_type_id,
  case_status_id,
  district_id,
  court_complex_id,
  court_name_id
) VALUES (
  'CIV/2026/001',
  1,  -- Civil category
  4,  -- Suit type
  1,  -- Active status
  1,  -- Mumbai district
  1,  -- City Civil Court complex
  1   -- Court No. 1
);
```

---

### Step 5: Link Cases to Parties (Layer 5)

```sql
-- Link clients to cases
INSERT INTO case_clients (case_id, client_id)
VALUES (1, 1);  -- Case #1, Client #1

-- Link opponents to cases
INSERT INTO case_opponents (case_id, opponent_id)
VALUES (1, 1);  -- Case #1, Opponent #1

-- Link defendants to cases
INSERT INTO case_defendants (case_id, defendant_id)
VALUES (1, 1);  -- Case #1, Defendant #1
```

---

### Step 6: Hearings (Layer 6)

```sql
-- Create hearing for case
INSERT INTO hearings (case_id, hearing_date, purpose)
VALUES (1, '2026-04-15', 'Arguments on maintainability');
```

---

### Step 7: Reminders (Layer 7)

```sql
-- Create reminders for hearing
INSERT INTO reminders (hearing_id, reminder_date, type, sent)
VALUES
  (1, '2026-04-10', 'FIVE_DAYS', false),
  (1, '2026-04-14', 'ONE_DAY', false);
```

---

### Step 8: Logs (Layer 8)

```sql
-- Log past hearings
INSERT INTO hearing_logs (case_id, hearing_date, purpose, outcome)
VALUES (1, '2026-03-20', 'First hearing', 'Adjourned for filing reply');
```

---

## Critical Dependency Rules

### ✅ **MUST Follow**

1. **Master tables first**: Always populate all `*_master` tables before creating cases
2. **District → Complex → Court**: Follow court hierarchy strictly
3. **Client types before clients**: Cannot create clients without valid client_type_id
4. **Cases before hearings**: Cannot schedule hearings without a case
5. **Hearings before reminders**: Reminders require valid hearing_id

### ⚠️ **Optional Dependencies**

1. **Defendants → Clients**: defendant.client_id is nullable
2. **Users**: Independent, can be created anytime

### 🔄 **Cascade Rules**

1. **Deleting a hearing** → Automatically deletes all associated reminders
2. Other deletes may fail if dependent records exist (protect data integrity)

---

## API Population Order (Practical)

When using the REST API:

```bash
# 1. Create master data
POST /client-types      # { "name": "Individual" }
POST /case-categories   # { "name": "Civil" }
POST /case-types        # { "name": "Suit" }
POST /case-statuses     # { "name": "Active" }
POST /districts         # { "name": "Mumbai" }

# 2. Create court hierarchy
POST /court-complexes   # { "name": "City Civil Court", "district_id": 1 }
POST /court-names       # { "name": "Court No. 1", "complex_id": 1 }

# 3. Create parties
POST /clients           # { "full_name": "...", "client_type_id": 1, ... }
POST /opponents         # { "name": "...", ... }
POST /defendants        # { "name": "...", "client_id": 1 }

# 4. Create case (links all together)
POST /cases             # { "case_number": "...", "client_ids": [1],
                        #   "case_category_id": 1, "court_name_id": 1, ... }

# 5. Create hearings
POST /hearings          # { "case_id": 1, "hearing_date": "2026-04-15", ... }

# Reminders are auto-created by system (not manual API)
```

---

## Common Mistakes to Avoid

❌ **Don't**:
- Create cases before master data exists
- Create hearings without a valid case
- Delete hearings without expecting reminders to be deleted
- Create court names before court complexes
- Create court complexes before districts

✅ **Do**:
- Always validate foreign key IDs exist before insertion
- Populate master tables during initial system setup
- Use transactions when creating related records (case + case_clients)
- Check cascade rules before deletion

---

## Recommended Setup Script Order

For initial database population:

1. Master data (manual SQL or seed script)
2. Court structure (admin panel or API)
3. Users (registration API)
4. Clients/Opponents/Defendants (API as needed)
5. Cases (API during case filing)
6. Hearings (API when scheduled)
7. Logs (API after hearings occur)

---

## Visual Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: Independent Tables (Start Here)                   │
│  • client_type_master                                       │
│  • case_category_master, case_type_master, case_status_master│
│  • district_master                                          │
│  • users                                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: First Level Dependencies                          │
│  • court_complex_master ← district_master                  │
│  • clients ← client_type_master                            │
│  • opponents (independent)                                  │
│  • defendants ← clients (optional)                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Court Names                                        │
│  • court_name_master ← court_complex_master                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: Cases (Central Hub)                               │
│  • cases ← (6 master tables from layers 1-3)               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 5: Case Relationships                                 │
│  • case_clients ← cases + clients                          │
│  • case_opponents ← cases + opponents                      │
│  • case_defendants ← cases + defendants                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 6: Hearings                                           │
│  • hearings ← cases                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 7: Reminders (Auto-Cascade Delete)                   │
│  • reminders ← hearings                                    │
└─────────────────────────────────────────────────────────────┘

                    [PARALLEL]
┌─────────────────────────────────────────────────────────────┐
│ LAYER 8: Logs (Independent Timeline)                       │
│  • hearing_logs ← cases                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

**Order of Operations**:
1. Master tables (types, categories, districts)
2. Court hierarchy (complex → names)
3. Parties (clients, opponents, defendants)
4. Cases (central entity)
5. Case relationships (junction tables)
6. Hearings
7. Reminders (auto-managed)
8. Logs (as events occur)

**Key Rule**: Never create a record with a foreign key before the referenced record exists.
