# Client Management API

Backend API for managing legal clients and hearings, including notification/reminder workflows.

## What This Software Does
The system exposes REST APIs to:
- create, update, list, fetch, and delete hearings
- validate incoming payloads with DTO-based rules
- run business logic in service classes
- persist domain data using TypeORM with PostgreSQL
- trigger immediate hearing notifications and schedule reminder records

Current app mount points:
- `/` health endpoint
- `/hearings` hearing APIs
- `/clients` client APIs

## Tech Stack
- Node.js + TypeScript
- Express
- TypeORM
- PostgreSQL

## High-Level Architecture
Request handling follows a layered flow:

1. `Routes` map HTTP endpoints to controllers.
2. `Validation middleware` transforms and validates DTOs.
3. `Controllers` parse request/params and call services.
4. `Services` contain business logic + DB operations.
5. `Entities` define database schema mappings.
6. `Error middleware` converts thrown errors to API responses.

Core folders:
- `src/config`: env and DB configuration
- `src/routes`: API route registration
- `src/controllers`: thin HTTP handlers
- `src/services`: domain/business logic
- `src/entities`: TypeORM models
- `src/dtos`, `src/validators`: request contracts
- `src/middlewares`: validation and error handlers
- `src/jobs`: scheduled/background jobs

## End-to-End Request Lifecycle
For a typical `POST /hearings` call:

1. Route receives request and runs `validateDto(CreateHearingDTO)`.
2. `class-transformer` maps payload to DTO instance.
3. `class-validator` enforces constraints (required fields, date format, etc.).
4. Controller calls `HearingService.createHearing(dto)`.
5. Service opens a DB transaction, verifies referenced case, saves hearing.
6. Notification layer sends immediate message and schedules reminders.
7. Controller returns `{ success: true, data: ... }`.
8. Any thrown `AppError` is formatted by global error middleware.

## Hearing Module: How It Works
### Create Hearing
- Input includes `case_id`, `hearing_date`, optional `purpose`, `requirements`.
- Service verifies the case exists.
- Hearing row is inserted.
- Notification service is triggered for immediate communication and reminder creation.

### Update Hearing
- Hearing is fetched by `hearing_id`.
- Partial updates are applied (`PATCH` semantics).
- If date changes, reschedule flow is triggered.

### List Hearings
Supports optional filters through query params:
- `case_id`
- `from_date`
- `to_date`

Results are sorted ascending by hearing date.

### Delete Hearing
- Removes hearing by id.
- Reminder rows linked via FK cascade are intended to be deleted with hearing removal.

## Reminder and Notification Workflow
Notification layer has two responsibilities:

1. Transport actions (currently console-based email simulation).
2. Reminder record management (`FIVE_DAYS`, `ONE_DAY`).

Reminder scheduling logic:
- On hearing creation: create reminder dates at T-5 and T-1.
- On hearing reschedule: delete old reminder rows for hearing and recreate based on new date.
- Daily reminder job fetches reminders due today with `sent = false`, sends message, marks as sent.

## Validation Model
Validation is centralized via `validateDto` middleware:
- unknown properties are stripped (`whitelist: true`)
- unknown properties can fail request (`forbidNonWhitelisted: true`)
- errors are aggregated into one `ValidationError`

This keeps controllers/services focused on behavior, not raw input sanitation.

## Error Handling Strategy
- Domain/operational errors inherit from `AppError` and return controlled status/message.
- Unexpected errors return HTTP 500 with generic message and are logged server-side.

## Data Model Notes
Important relationships:
- `Case (1) -> (N) Hearing`
- `Hearing (1) -> (N) Reminder`
- Reminder keeps `sent` status and `type` (`FIVE_DAYS`, `ONE_DAY`).

## Prerequisites
- Node.js 18+
- PostgreSQL

## Installation
```bash
npm install
```

## Environment Variables
Create a `.env` file in the project root.

Required:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Optional:
- `PORT` (default: `3000`)
- `NODE_ENV` (default: `development`)
- `EMAIL_API_KEY`
- `EMAIL_FROM`
- `SMS_API_KEY`
- `WHATSAPP_API_KEY`

## Run the App
Development:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Start production build:
```bash
npm start
```

Default local URL:
- `http://localhost:3000`

## Database
- ORM: TypeORM
- Dialect/driver: PostgreSQL
- `synchronize: true` is enabled (good for early dev, not recommended for production)

## API Surface (Current)
### Health
- `GET /`

### Hearings
- `POST /hearings`
- `PATCH /hearings/:id`
- `GET /hearings`
- `GET /hearings/:id`
- `DELETE /hearings/:id`

### Clients
- Mounted at `/clients` (see `src/routes/client.routes.ts` for detailed endpoints)

## Current Implementation Notes
- Server bootstrap currently starts Express directly from `src/server.ts`.
- DB config and entities are defined in `src/config/data-source.ts`.
- For production readiness, recommended next steps are:
  - switch from `synchronize` to migrations
  - wire a real notification provider for email/SMS/WhatsApp
  - ensure reminder job is scheduled via cron/queue worker
  - add integration tests for hearing + reminder flows
