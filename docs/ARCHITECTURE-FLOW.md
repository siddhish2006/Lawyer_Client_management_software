# Architecture Flow: Routes → Middlewares → Controllers → Services

This document explains the request flow through the application. Understanding this will enable you to create all remaining files correctly.

---

## 1. Request Flow Diagram

```
HTTP Request
    ↓
Express App (app.ts)
    ↓
Global Middlewares (db, healthcheck)
    ↓
Specific Route Handler (routes/)
    ↓
Route-level Middlewares:
  - validateDto() [if POST/PATCH]
  - asyncHandler() [always wraps]
    ↓
Controller Method (controllers/)
    ↓
Service Layer (services/)
    ↓
Database Repository (entities/)
    ↓
Database
    ↓
Response back through chain
```

---

## 2. File Structure & Responsibilities

### 2.1 Entry Points: `app.ts` & `server.ts`

**`server.ts`** - Starts the app

- Initialize database connection
- Start Express on PORT

**`app.ts`** - Express setup

- Middleware: `express.json()`
- Middleware: `dbHealthCheck` + `attachDatabase`
- Health endpoints: `/` and `/health/db`
- Mount all route files
- Last: `errorMiddleware` (catches all errors)

**Key Pattern:**

```typescript
app.use(express.json());
app.use(dbHealthCheck);
app.use(attachDatabase);

// Mount routes
app.use("/clients", clientRoutes);
app.use("/cases", caseRoutes);
app.use("/hearings", hearingRoutes);
// ... more routes

// MUST BE LAST
app.use(errorMiddleware);
```

---

## 3. Routes Layer (`src/routes/*.routes.ts`)

### Purpose

Define API endpoints and compose middlewares with controller methods.

### Responsibilities

- Define HTTP methods (GET, POST, PATCH, DELETE)
- Apply validation middleware (if needed)
- Wrap all handlers with `asyncHandler()`
- Call appropriate controller method

### Structure Pattern

```typescript
import { Router } from "express";
import { YourController } from "../controllers/your.controller";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/asynchandler";
import {
  CreateYourValidator,
  UpdateYourValidator,
} from "../validators/your.validator";

const router = Router();

// CREATE - accept body, validate DTO
router.post(
  "/",
  validateDto(CreateYourValidator),
  asyncHandler(YourController.create),
);

// UPDATE - accept body, validate DTO
router.patch(
  "/:id",
  validateDto(UpdateYourValidator),
  asyncHandler(YourController.update),
);

// LIST - no body, no validation
router.get("/", asyncHandler(YourController.list));

// GET BY ID - no body, no validation
router.get("/:id", asyncHandler(YourController.getById));

// DELETE - no body, no validation
router.delete("/:id", asyncHandler(YourController.delete));

export default router;
```

### Key Rules

- **Always wrap controller methods with `asyncHandler()`**
  - Catches thrown errors and passes to error middleware
- **Only validate on POST/PATCH**
  - Use `validateDto(YourValidator)` middleware before controller
- **GET/DELETE: No validation**
  - Only wrap with `asyncHandler()`
- **Extract ID from params**: `Number(req.params.id)`

---

## 4. Middlewares (`src/middlewares/*.middleware.ts`)

### 4.1 Validation Middleware (`validation.middleware.ts`)

**Purpose:** Validate request body against DTO schema

**How it works:**

- Converts req.body to DTO class instance
- Runs class-validator decorators
- Throws `ValidationError` if invalid
- Calls `next()` if valid

**Usage in routes:**

```typescript
router.post(
  "/",
  validateDto(CreateClientValidator), // ← This middleware
  asyncHandler(YourController.create),
);
```

### 4.2 Error Middleware (`error.middleware.ts`)

**Purpose:** Catch all errors and format responses

**How it works:**

- Catches errors from controllers/services
- Checks if error is `AppError` (known error)
  - Returns proper status code + message
- If unknown error
  - Returns 500 Internal Server Error
- **MUST BE MOUNTED LAST in app.ts**

**Caught Errors:**

- `AppError` (base class, 400)
- `ValidationError` (400)
- `NotFoundError` (404)
- `ConflictError` (409)

### 4.3 DB Middleware (`db.middleware.ts`)

**Purpose:** Health check + attach DB instance to request

**Functions:**

- `dbHealthCheck`: Verify DB connection on startup
- `attachDatabase`: Add DB instance to req.app.locals

**Mounted in app.ts:**

```typescript
app.use(dbHealthCheck);
app.use(attachDatabase);
```

### 4.4 Auth Middleware (`auth.middleware.ts`)

**Currently Empty** - For future JWT/session authentication

---

## 5. Controllers (`src/controllers/*.controller.ts`)

### Purpose

Handle HTTP requests and call services. **Pure orchestration layer** - no logic here.

### Responsibilities

- Extract data from `req` (params, body, query)
- Call appropriate service method
- Return response with status code
- **Absolutely NO:**
  - Validation
  - Try/catch blocks
  - Error creation
  - Database access

### Structure Pattern

```typescript
import { Request, Response } from "express";
import { YourService } from "../services/your.service";

/**
 * YourController
 *
 * RULES:
 * - NO validation here
 * - NO try/catch here
 * - NO error creation here
 *
 * Validation → middleware
 * Errors → service + error middleware
 * Async handling → asyncHandler
 */
export class YourController {
  //-------------------------------------
  // CREATE
  //-------------------------------------

  static async create(req: Request, res: Response) {
    const item = await YourService.create(req.body);
    res.status(201).json(item);
  }

  //-------------------------------------
  // GET BY ID
  //-------------------------------------

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await YourService.getById(id);
    res.json(item);
  }

  //-------------------------------------
  // LIST
  //-------------------------------------

  static async list(req: Request, res: Response) {
    const items = await YourService.list(req.query);
    res.json(items);
  }

  //-------------------------------------
  // UPDATE
  //-------------------------------------

  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const item = await YourService.update(id, req.body);
    res.json(item);
  }

  //-------------------------------------
  // DELETE
  //-------------------------------------

  static async delete(req: Request, res: Response) {
    await YourService.delete(Number(req.params.id));
    res.status(204).send();
  }
}
```

### Key Rules

- Static class methods (not instantiated)
- Extract params: `Number(req.params.id)`
- Extract query: `req.query`
- Extract body: `req.body`
- Status codes:
  - 201: POST (create)
  - 200: GET, PATCH, PUT (success)
  - 204: DELETE (no content)

---

## 6. Validators (`src/validators/*.validator.ts`)

### Purpose

Define data shape and validation rules using `class-validator` decorators.

### Responsibilities

- Define DTOs with decorators
- Specify required fields
- Set validation rules (length, format, etc.)
- Custom error messages

### Structure Pattern

```typescript
import {
  IsString,
  IsNumber,
  IsEmail,
  MinLength,
  IsOptional,
} from "class-validator";

export class CreateYourValidator {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsNumber()
  type_id: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateYourValidator {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  type_id?: number;
}
```

### Key Rules

- **Create validator:** All required fields unless marked `@IsOptional()`
- **Update validator:** All fields `@IsOptional()`
- Used by `validateDto()` middleware in routes
- Decorators from `class-validator` package

---

## 7. Services (`src/services/*.service.ts`)

### Purpose

Contain all business logic and database access. The brain of the application.

### Responsibilities

- Get repositories from AppDataSource
- Query database
- Implement business rules
- Throw appropriate errors
- Return data

### Structure Pattern

```typescript
import { AppDataSource } from "../config/data-source";
import { Your } from "../entities/Your";
import { YourType } from "../entities/YourType";
import { CreateYourDTO } from "../dtos/your/CreateYour.dto";
import { AppError } from "../errors/AppError";
import { NotFoundError } from "../errors/NotFoundError";

export class YourService {
  //============================================
  // GET REPOSITORIES
  //============================================

  private static getYourRepo() {
    return AppDataSource.getRepository(Your);
  }

  private static getYourTypeRepo() {
    return AppDataSource.getRepository(YourType);
  }

  //============================================
  // CREATE
  //============================================

  static async create(dto: CreateYourDTO): Promise<Your> {
    const yourRepo = this.getYourRepo();
    const typeRepo = this.getYourTypeRepo();

    // Step 1: Validate related entity exists
    const type = await typeRepo.findOne({
      where: { id: dto.type_id },
    });

    if (!type) {
      throw new AppError("Invalid type", 400);
    }

    // Step 2: Check for duplicates (if needed)
    const existing = await yourRepo.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictError("Already exists");
    }

    // Step 3: Create entity
    const item = yourRepo.create({
      ...dto,
      type,
    });

    // Step 4: Save to database
    const saved = await yourRepo.save(item);

    return saved;
  }

  //============================================
  // GET BY ID
  //============================================

  static async getById(id: number): Promise<Your> {
    const yourRepo = this.getYourRepo();

    const item = await yourRepo.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundError(`Not found`);
    }

    return item;
  }

  //============================================
  // LIST
  //============================================

  static async list(query?: any): Promise<Your[]> {
    const yourRepo = this.getYourRepo();

    const items = await yourRepo.find({
      // relations: ["type"], // if needed
      // where: { ... },      // filters
      // order: { id: "ASC" } // sorting
    });

    return items;
  }

  //============================================
  // UPDATE
  //============================================

  static async update(id: number, dto: Partial<Your>): Promise<Your> {
    const yourRepo = this.getYourRepo();

    // Step 1: Check exists
    const item = await this.getById(id);

    // Step 2: Validate related entities if needed
    if (dto.type_id) {
      const typeRepo = this.getYourTypeRepo();
      const type = await typeRepo.findOne({
        where: { id: dto.type_id },
      });
      if (!type) {
        throw new AppError("Invalid type", 400);
      }
    }

    // Step 3: Update fields
    Object.assign(item, dto);

    // Step 4: Save
    const updated = await yourRepo.save(item);

    return updated;
  }

  //============================================
  // DELETE
  //============================================

  static async delete(id: number): Promise<void> {
    const yourRepo = this.getYourRepo();

    // Step 1: Check exists (or will throw NotFoundError)
    await this.getById(id);

    // Step 2: Delete
    await yourRepo.delete(id);
  }
}
```

### Key Rules

- Static methods (class not instantiated)
- Always get fresh repository: `AppDataSource.getRepository(Entity)`
- Validate related entities exist before using
- Throw `NotFoundError` if item not found
- Throw `AppError` for business rule violations
- Throw `ConflictError` for duplicates
- Let errors bubble up to error middleware

---

## 8. Error Handling

### Error Hierarchy

```
Error (JavaScript base)
  ↓
AppError (base operational error)
  ├─ ValidationError (400)
  ├─ NotFoundError (404)
  └─ ConflictError (409)
```

### How Errors Flow

1. **Service throws error:**

   ```typescript
   throw new NotFoundError("Client not found");
   ```

2. **asyncHandler catches it:**

   ```typescript
   const asyncHandler = (fn) => (req, res, next) => {
     fn(req, res, next).catch(next);
   };
   ```

3. **Error middleware formats response:**
   ```typescript
   if (err instanceof AppError) {
     return res.status(err.statusCode).json({
       success: false,
       message: err.message,
     });
   }
   ```

### When to Throw Which Error

- **ValidationError (400):** Invalid input after validation fails

  ```typescript
  throw new ValidationError("Invalid email format");
  ```

- **AppError (400):** Business rule violation

  ```typescript
  throw new AppError("Client type does not exist", 400);
  throw new AppError("Cannot delete active cases", 400);
  ```

- **NotFoundError (404):** Entity not found

  ```typescript
  throw new NotFoundError("Client not found");
  ```

- **ConflictError (409):** Duplicate or conflict
  ```typescript
  throw new ConflictError("Client already exists");
  ```

---

## 9. Complete Request Example: Create Client

### Step-by-step flow:

**1. HTTP Request**

```
POST /clients
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "client_type_id": 1
}
```

**2. Reaches Route Handler** (`client.routes.ts`)

```typescript
router.post(
  "/",
  validateDto(CreateClientValidator), // ← Middleware 1
  asyncHandler(ClientController.create), // ← Middleware 2 + Handler
);
```

**3. validateDto Middleware** (`validation.middleware.ts`)

- Converts req.body to CreateClientValidator instance
- Runs class-validator decorators
- If valid → calls `next()`
- If invalid → throws ValidationError

**4. asyncHandler Wrapper**

- Wraps controller method
- Catches any thrown errors
- Passes to next middleware (error middleware)

**5. Controller Method** (`client.controller.ts`)

```typescript
static async create(req: Request, res: Response) {
  const client = await ClientService.createClient(req.body);
  res.status(201).json(client);
}
```

- No validation here
- No error handling here
- Calls service

**6. Service Layer** (`client.service.ts`)

```typescript
static async createClient(dto: CreateClientDTO): Promise<Client> {
  // Validate client type exists
  const clientType = await clientTypeRepo.findOne({
    where: { id: dto.client_type_id }
  });
  if (!clientType) {
    throw new AppError("Invalid client type", 400); // ← Error thrown
  }

  // Create and save
  const client = clientRepo.create({ ...dto, type: clientType });
  return await clientRepo.save(client);
}
```

- If error is thrown → caught by asyncHandler → sent to error middleware
- If success → returns client object

**7. Back to Controller**

- Receives client from service
- Returns 201 + JSON response

**8. Error Middleware** (if error thrown)

```typescript
if (err instanceof AppError) {
  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
}
```

**9. HTTP Response**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "client_type_id": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## 10. Implementation Checklist

For each resource (Client, Case, Hearing, etc.), create:

### Files to Create

- [ ] `src/routes/[resource].routes.ts`
  - Import controller, validators, middlewares
  - Define POST, PATCH, GET, GET/:id, DELETE routes
  - Wrap all with asyncHandler
  - Validate POST/PATCH with DTO

- [ ] `src/controllers/[resource].controller.ts`
  - Static class with async methods
  - No validation, no error handling, no DB access
  - Call appropriate service method
  - Return response with status code

- [ ] `src/validators/[resource].validator.ts`
  - CreateValidator with required fields
  - UpdateValidator with optional fields
  - Use class-validator decorators

- [ ] `src/services/[resource].service.ts`
  - Get repositories from AppDataSource
  - Implement create, getById, list, update, delete
  - Validate related entities
  - Throw appropriate errors
  - Return data

### Required Imports

**Every Route File:**

```typescript
import { Router } from "express";
import { YourController } from "../controllers/your.controller";
import { validateDto } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/asynchandler";
import {
  CreateYourValidator,
  UpdateYourValidator,
} from "../validators/your.validator";
```

**Every Controller File:**

```typescript
import { Request, Response } from "express";
import { YourService } from "../services/your.service";
```

**Every Service File:**

```typescript
import { AppDataSource } from "../config/data-source";
import { Your } from "../entities/Your";
import { CreateYourDTO } from "../dtos/your/CreateYour.dto";
import { AppError } from "../errors/AppError";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";
```

**Every Validator File:**

```typescript
import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  MinLength,
} from "class-validator";
```

---

## 11. Key Principles Summary

| Layer          | Responsibility                         | Rule                              |
| -------------- | -------------------------------------- | --------------------------------- |
| **Route**      | Define endpoints & compose middlewares | Always use asyncHandler           |
| **Middleware** | Pre/post processing                    | Validation only, throw errors     |
| **Controller** | HTTP orchestration                     | No logic, no errors, call service |
| **Service**    | Business logic & DB                    | All validation, error throwing    |
| **Error**      | Format responses                       | Last middleware in app.ts         |

---

## 12. Common Patterns

### Pattern: Validating Related Entity

```typescript
// In Service
const relatedEntity = await relatedRepo.findOne({
  where: { id: dto.related_id },
});

if (!relatedEntity) {
  throw new AppError("Related entity not found", 400);
}

// Now safe to use
const item = repo.create({
  ...dto,
  relatedEntity,
});
```

### Pattern: Filtering List Results

```typescript
static async list(query?: any): Promise<Your[]> {
  const repo = this.getYourRepo();

  const items = await repo.find({
    where: query.filter ? { /* filter */ } : {},
    relations: ["relationName"],
    order: { id: "ASC" }
  });

  return items;
}
```

### Pattern: Soft Delete or Status Change

```typescript
static async delete(id: number): Promise<void> {
  const repo = this.getYourRepo();
  const item = await this.getById(id);

  // Option 1: Hard delete
  await repo.delete(id);

  // Option 2: Soft delete (set status)
  item.status = "deleted"; // if field exists
  await repo.save(item);
}
```

---

## 13. Database Initialization

- Routes are mounted in `app.ts`
- Database initialized in `server.ts` before app starts
- Use `AppDataSource.getRepository(Entity)` to access data
- Entities defined in `src/entities/`

---

This document contains everything needed to implement all remaining routes, controllers, services, and validators consistently.
