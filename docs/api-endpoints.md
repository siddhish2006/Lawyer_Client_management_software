# API Endpoints

Complete REST API documentation for Lawyer Client Management System.

---

## Base URL

```
http://localhost:3000
```

---

## System Endpoints

### Health Check
```http
GET /
```

**Response**:
```json
{
  "status": "OK",
  "message": "Client Management API is running"
}
```

---

### Database Health Check
```http
GET /health/db
```

**Response** (Success):
```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2026-03-22T10:30:00.000Z"
}
```

**Response** (Failure):
```json
{
  "status": "ERROR",
  "database": "Connection failed",
  "error": "Error message"
}
```

---

## Client Management

### Create Client
```http
POST /clients
Content-Type: application/json
```

**Request Body**:
```json
{
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "whatsapp_number": "+1234567890",
  "email": "john@example.com",
  "address": "123 Main St, City",
  "client_type_id": 1,
  "date_of_association": "2026-01-15",
  "primary_practice_area": "Corporate Law",
  "current_legal_relationship": "Active",
  "referred_by": "Partner X"
}
```

**Response** (201 Created):
```json
{
  "client_id": 1,
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  ...
}
```

**Validation**: Uses `CreateClientValidator` middleware

---

### Get Client by ID
```http
GET /clients/:id
```

**Response** (200 OK):
```json
{
  "client_id": 1,
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "client_type": {
    "id": 1,
    "name": "Individual"
  },
  ...
}
```

---

### List All Clients
```http
GET /clients
```

**Query Parameters** (optional):
- Various filters supported by service layer

**Response** (200 OK):
```json
[
  {
    "client_id": 1,
    "full_name": "John Doe",
    ...
  },
  {
    "client_id": 2,
    "full_name": "Jane Smith",
    ...
  }
]
```

---

### Update Client
```http
PATCH /clients/:id
Content-Type: application/json
```

**Request Body** (partial update):
```json
{
  "current_legal_relationship": "Inactive",
  "email": "newemail@example.com"
}
```

**Response** (200 OK):
```json
{
  "client_id": 1,
  "full_name": "John Doe",
  "current_legal_relationship": "Inactive",
  ...
}
```

**Validation**: Uses `UpdateClientValidator` middleware

---

### Delete Client
```http
DELETE /clients/:id
```

**Response** (204 No Content)

---

## Case Management

### Create Case
```http
POST /cases
Content-Type: application/json
```

**Request Body**:
```json
{
  "case_number": "CIV/2026/12345",
  "act": "Contract Act 1872",
  "registration_date": "2026-03-01",
  "case_category_id": 1,
  "case_type_id": 2,
  "case_status_id": 1,
  "district_id": 3,
  "court_complex_id": 5,
  "court_name_id": 8,
  "description": "Breach of contract dispute",
  "notes": "Client very concerned about timeline",
  "client_ids": [1, 2],
  "opponent_ids": [1],
  "defendant_ids": []
}
```

**Response** (201 Created):
```json
{
  "case_id": 1,
  "case_number": "CIV/2026/12345",
  ...
}
```

**Validation**: Uses `CaseValidator.create` middleware

---

### Get Case by ID
```http
GET /cases/:id
```

**Response** (200 OK):
```json
{
  "case_id": 1,
  "case_number": "CIV/2026/12345",
  "case_category": {
    "id": 1,
    "name": "Civil"
  },
  "clients": [...],
  "opponents": [...],
  "hearings": [...]
}
```

---

### List All Cases
```http
GET /cases
```

**Response** (200 OK):
```json
[
  {
    "case_id": 1,
    "case_number": "CIV/2026/12345",
    ...
  }
]
```

---

### Update Case
```http
PATCH /cases/:id
Content-Type: application/json
```

**Request Body** (partial):
```json
{
  "case_status_id": 3,
  "notes": "Updated after hearing"
}
```

**Response** (200 OK):
```json
{
  "case_id": 1,
  "case_status_id": 3,
  ...
}
```

**Validation**: Uses `CaseValidator.update` middleware

---

### Delete Case
```http
DELETE /cases/:id
```

**Response** (204 No Content)

---

## Hearing Management

### Create Hearing
```http
POST /hearings
Content-Type: application/json
```

**Request Body**:
```json
{
  "case_id": 1,
  "hearing_date": "2026-04-15",
  "purpose": "Arguments on preliminary objections",
  "requirements": "Bring witness statements"
}
```

**Response** (201 Created):
```json
{
  "hearing_id": 1,
  "case_id": 1,
  "hearing_date": "2026-04-15",
  ...
}
```

**Validation**: Uses `CreateHearingValidator` middleware

---

### Get Hearing by ID
```http
GET /hearings/:id
```

**Response** (200 OK):
```json
{
  "hearing_id": 1,
  "case": {
    "case_id": 1,
    "case_number": "CIV/2026/12345"
  },
  "hearing_date": "2026-04-15",
  ...
}
```

---

### List All Hearings
```http
GET /hearings
```

**Response** (200 OK):
```json
[
  {
    "hearing_id": 1,
    "hearing_date": "2026-04-15",
    ...
  }
]
```

---

### Update Hearing
```http
PATCH /hearings/:id
Content-Type: application/json
```

**Request Body**:
```json
{
  "hearing_date": "2026-04-20",
  "purpose": "Final arguments"
}
```

**Response** (200 OK):
```json
{
  "hearing_id": 1,
  "hearing_date": "2026-04-20",
  ...
}
```

**Validation**: Uses `UpdateHearingValidator` middleware

---

### Delete Hearing
```http
DELETE /hearings/:id
```

**Response** (204 No Content)

**Note**: Deleting a hearing will cascade delete associated reminders.

---

## Master Data Endpoints (Not Yet Implemented)

The following endpoints exist in route files but are not yet registered in `app.ts`:

### Client Types
```http
POST   /client-types
GET    /client-types
GET    /client-types/:id
PATCH  /client-types/:id
DELETE /client-types/:id
```

---

### Case Categories
```http
POST   /case-categories
GET    /case-categories
GET    /case-categories/:id
PATCH  /case-categories/:id
DELETE /case-categories/:id
```

---

### Case Types
```http
POST   /case-types
GET    /case-types
GET    /case-types/:id
PATCH  /case-types/:id
DELETE /case-types/:id
```

---

### Case Statuses
```http
POST   /case-statuses
GET    /case-statuses
GET    /case-statuses/:id
PATCH  /case-statuses/:id
DELETE /case-statuses/:id
```

---

### Districts
```http
POST   /districts
GET    /districts
GET    /districts/:id
PATCH  /districts/:id
DELETE /districts/:id
```

---

### Court Complexes
```http
POST   /court-complexes
GET    /court-complexes
GET    /court-complexes/:id
PATCH  /court-complexes/:id
DELETE /court-complexes/:id
```

---

### Court Names
```http
POST   /court-names
GET    /court-names
GET    /court-names/:id
PATCH  /court-names/:id
DELETE /court-names/:id
```

---

### Opponents
```http
POST   /opponents
GET    /opponents
GET    /opponents/:id
PATCH  /opponents/:id
DELETE /opponents/:id
```

---

### Defendants
```http
POST   /defendants
GET    /defendants
GET    /defendants/:id
PATCH  /defendants/:id
DELETE /defendants/:id
```

---

### Authentication (Not Yet Implemented)
```http
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

---

## Error Responses

All endpoints use centralized error handling middleware.

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [...]
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details"
}
```

---

## Middleware Stack

1. **express.json()** - Parse JSON request bodies
2. **dbHealthCheck** - Verify database connection
3. **attachDatabase** - Attach DB instance to request
4. **Validators** - Route-specific validation (class-validator)
5. **asyncHandler** - Async error handling wrapper
6. **errorMiddleware** - Centralized error handling (MUST BE LAST)

---

## Testing Recommendations

Use tools like:
- cURL
- Postman
- HTTPie
- Thunder Client (VS Code)

Example cURL:
```bash
# Create client
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Client",
    "phone_number": "1234567890",
    "client_type_id": 1,
    "current_legal_relationship": "Active"
  }'

# List clients
curl http://localhost:3000/clients

# Get specific client
curl http://localhost:3000/clients/1
```

---

## Implementation Status

✅ **Implemented & Registered**:
- Clients API (`/clients`)
- Cases API (`/cases`)
- Hearings API (`/hearings`)
- System endpoints (`/`, `/health/db`)

⏳ **Defined but Not Registered**:
- Master data endpoints (client types, case categories, etc.)
- Opponents API
- Defendants API
- Authentication API

---

## Next Steps

To fully activate all endpoints:

1. Register remaining routes in `src/app.ts`
2. Implement controllers for master data entities
3. Implement authentication system
4. Add authorization middleware
5. Add pagination for list endpoints
6. Add filtering/search capabilities
7. Add sorting options
