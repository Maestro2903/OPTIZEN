# Booking API Documentation

This document describes the APIs for the appointment booking system, including public booking endpoints for the landing page and authenticated endpoints for staff management.

## Table of Contents

1. [Public Booking API](#public-booking-api)
2. [Appointment Requests Management API](#appointment-requests-management-api)
3. [Accept Appointment Request API](#accept-appointment-request-api)
4. [Reject Appointment Request API](#reject-appointment-request-api)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Authentication](#authentication)
8. [CORS Configuration](#cors-configuration)

---

## Public Booking API

### Base URL
```
/api/public/appointments
```

### POST - Create Appointment Request

Create a new appointment request from the public landing page. No authentication required.

**Endpoint:** `POST /api/public/appointments`

**Authentication:** None required (public endpoint)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**

```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "mobile": "+1 234 567 8900",
  "gender": "male",
  "date_of_birth": "1990-01-15",
  "appointment_date": "2024-12-25",
  "start_time": "10:00",
  "end_time": "11:00",
  "type": "consult",
  "provider_id": "uuid-of-doctor",
  "reason": "Eye checkup",
  "notes": "First time visit"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | Yes | Patient's full name (minimum 2 characters) |
| `email` | string | No | Patient's email address (must be valid format if provided) |
| `mobile` | string | Yes | Patient's mobile number (10 digits with optional country code) |
| `gender` | enum | Yes | Gender: `male`, `female`, or `other` |
| `date_of_birth` | date | No | Patient's date of birth (YYYY-MM-DD format) |
| `appointment_date` | date | Yes | Preferred appointment date (YYYY-MM-DD format) |
| `start_time` | time | Yes | Start time (HH:MM format, 24-hour) |
| `end_time` | time | Yes | End time (HH:MM format, 24-hour, must be after start_time) |
| `type` | enum | Yes | Appointment type: `consult`, `follow-up`, `surgery`, `refraction`, `other` |
| `provider_id` | uuid | No | Preferred doctor/provider ID (optional) |
| `reason` | string | No | Reason for visit |
| `notes` | string | No | Additional notes |

**Validation Rules:**

- `mobile`: Must match pattern `/^(\+\d{1,3}[- ]?)?\d{10}$/`
- `email`: If provided, must be valid email format
- `start_time` and `end_time`: Must be in HH:MM format (24-hour), end_time must be after start_time
- `gender`: Must be one of: `male`, `female`, `other`
- `type`: Must be one of: `consult`, `follow-up`, `surgery`, `refraction`, `other`
- `provider_id`: If provided, must exist in the users table

**Success Response:**

**Status Code:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "created_at": "2024-12-20T10:00:00Z",
    "updated_at": "2024-12-20T10:00:00Z",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "mobile": "+1 234 567 8900",
    "gender": "male",
    "date_of_birth": "1990-01-15",
    "appointment_date": "2024-12-25",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "type": "consult",
    "provider_id": "uuid-of-doctor",
    "reason": "Eye checkup",
    "notes": "First time visit\nReason: Eye checkup",
    "status": "pending",
    "processed_by": null,
    "processed_at": null,
    "patient_id": null,
    "appointment_id": null
  },
  "message": "Appointment request submitted successfully. Our team will contact you soon to confirm your appointment."
}
```

**Error Responses:**

**Status Code:** `400 Bad Request`

```json
{
  "error": "Missing required patient fields: full_name, mobile, gender"
}
```

```json
{
  "error": "Invalid mobile number format. Expected 10 digits with optional country code"
}
```

```json
{
  "error": "Invalid email format"
}
```

```json
{
  "error": "Invalid start_time format. Expected HH:MM (24-hour format)"
}
```

```json
{
  "error": "Selected doctor/provider not found"
}
```

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Failed to submit appointment request",
  "details": "Database error message",
  "code": "error_code"
}
```

---

### GET - Get Appointment by ID

Retrieve appointment details by ID. Used for success page display.

**Endpoint:** `GET /api/public/appointments?id={appointment_id}`

**Authentication:** None required (public endpoint)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Appointment ID |

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "provider_id": "uuid",
    "appointment_date": "2024-12-25",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "type": "consult",
    "status": "scheduled",
    "room": null,
    "notes": "Eye checkup",
    "created_at": "2024-12-20T10:00:00Z",
    "patients": {
      "id": "uuid",
      "patient_id": "PAT001",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "mobile": "+1 234 567 8900"
    }
  }
}
```

**Error Responses:**

**Status Code:** `400 Bad Request`

```json
{
  "error": "Appointment ID is required"
}
```

**Status Code:** `404 Not Found`

```json
{
  "error": "Appointment not found"
}
```

---

### OPTIONS - CORS Preflight

Handle CORS preflight requests for the public endpoints.

**Endpoint:** `OPTIONS /api/public/appointments`

**Response:**

**Status Code:** `204 No Content`

**Headers:**
```
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Access-Control-Allow-Origin: [origin] (if localhost/127.0.0.1)
```

---

## Appointment Requests Management API

### Base URL
```
/api/appointment-requests
```

### GET - List Appointment Requests

List all appointment requests with filtering, pagination, and sorting. Requires authentication.

**Endpoint:** `GET /api/appointment-requests`

**Authentication:** Required (RBAC: `appointments:view` permission)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1, minimum: 1) |
| `limit` | integer | No | Items per page (default: 50, maximum: 100) |
| `search` | string | No | Search term (searches full_name, email, mobile) |
| `sortBy` | string | No | Field to sort by (default: `created_at`) |
| `sortOrder` | enum | No | Sort order: `asc` or `desc` (default: `desc`) |
| `status` | enum | No | Filter by status: `pending`, `accepted`, `rejected` |

**Example Request:**
```
GET /api/appointment-requests?page=1&limit=20&status=pending&search=john&sortBy=created_at&sortOrder=desc
```

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "created_at": "2024-12-20T10:00:00Z",
      "updated_at": "2024-12-20T10:00:00Z",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "mobile": "+1 234 567 8900",
      "gender": "male",
      "date_of_birth": "1990-01-15",
      "appointment_date": "2024-12-25",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "type": "consult",
      "provider_id": "uuid",
      "reason": "Eye checkup",
      "notes": "First time visit",
      "status": "pending",
      "processed_by": null,
      "processed_at": null,
      "patient_id": null,
      "appointment_id": null,
      "provider": {
        "id": "uuid",
        "full_name": "Dr. Jane Smith",
        "email": "jane.smith@hospital.com",
        "role": "ophthalmologist"
      },
      "processed_by_user": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error Responses:**

**Status Code:** `401 Unauthorized` or `403 Forbidden`

```json
{
  "error": "Unauthorized"
}
```

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Failed to fetch appointment requests",
  "details": "Database error message"
}
```

---

### GET - Get Appointment Request by ID

Get a specific appointment request by ID. Public access for success page.

**Endpoint:** `GET /api/appointment-requests?id={request_id}`

**Authentication:** Not required (uses service client)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Appointment request ID |

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "created_at": "2024-12-20T10:00:00Z",
    "updated_at": "2024-12-20T10:00:00Z",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "mobile": "+1 234 567 8900",
    "gender": "male",
    "date_of_birth": "1990-01-15",
    "appointment_date": "2024-12-25",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "type": "consult",
    "provider_id": "uuid",
    "reason": "Eye checkup",
    "notes": "First time visit",
    "status": "pending",
    "processed_by": null,
    "processed_at": null,
    "patient_id": null,
    "appointment_id": null
  }
}
```

**Error Responses:**

**Status Code:** `404 Not Found`

```json
{
  "error": "Appointment request not found"
}
```

---

### OPTIONS - CORS Preflight

Handle CORS preflight requests.

**Endpoint:** `OPTIONS /api/appointment-requests`

**Response:**

**Status Code:** `204 No Content`

---

## Accept Appointment Request API

### POST - Accept Appointment Request

Accept an appointment request, create a patient record, and create an appointment. Requires authentication.

**Endpoint:** `POST /api/appointment-requests/{id}/accept`

**Authentication:** Required (RBAC: `appointments:create` permission)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "mobile": "+1 234 567 8900",
  "gender": "male",
  "date_of_birth": "1990-01-15",
  "country": "India",
  "state": "Karnataka",
  "address": "123 Main Street",
  "city": "Bangalore",
  "postal_code": "560001",
  "emergency_contact": "Jane Doe",
  "emergency_phone": "+1 234 567 8901",
  "medical_history": "None",
  "current_medications": "None",
  "allergies": "None",
  "insurance_provider": "ABC Insurance",
  "insurance_number": "INS123456"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | Yes | Patient's full name |
| `email` | string | No | Patient's email address |
| `mobile` | string | Yes | Patient's mobile number |
| `gender` | enum | Yes | Gender: `male`, `female`, or `other` |
| `date_of_birth` | date | No | Patient's date of birth |
| `country` | string | No | Country (defaults to "India") |
| `state` | string | Yes | State/province |
| `address` | string | No | Street address |
| `city` | string | No | City |
| `postal_code` | string | No | Postal/ZIP code |
| `emergency_contact` | string | No | Emergency contact name |
| `emergency_phone` | string | No | Emergency contact phone |
| `medical_history` | string | No | Medical history |
| `current_medications` | string | No | Current medications |
| `allergies` | string | No | Known allergies |
| `insurance_provider` | string | No | Insurance provider name |
| `insurance_number` | string | No | Insurance policy number |

**Validation Rules:**

- All validation rules from the appointment request creation apply
- `state` is required
- `provider_id` from the appointment request must exist, or system will auto-assign an available doctor
- Time slot must not conflict with existing appointments for the provider

**Success Response:**

**Status Code:** `201 Created`

```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "uuid",
      "patient_id": "PAT001",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "mobile": "+1 234 567 8900",
      "gender": "male",
      "date_of_birth": "1990-01-15",
      "country": "India",
      "state": "Karnataka",
      "status": "active",
      "created_at": "2024-12-20T10:00:00Z"
    },
    "appointment": {
      "id": "uuid",
      "patient_id": "uuid",
      "provider_id": "uuid",
      "appointment_date": "2024-12-25",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "type": "consult",
      "status": "scheduled",
      "notes": "Eye checkup",
      "patients": {
        "id": "uuid",
        "patient_id": "PAT001",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "mobile": "+1 234 567 8900"
      },
      "users": {
        "id": "uuid",
        "full_name": "Dr. Jane Smith",
        "email": "jane.smith@hospital.com",
        "role": "ophthalmologist"
      }
    },
    "request": {
      "id": "uuid",
      "status": "accepted",
      "patient_id": "uuid",
      "appointment_id": "uuid",
      "processed_by": "uuid",
      "processed_at": "2024-12-20T10:05:00Z"
    }
  },
  "message": "Appointment request accepted and appointment created successfully"
}
```

**Error Responses:**

**Status Code:** `400 Bad Request`

```json
{
  "error": "Missing required fields: full_name, mobile, gender, state"
}
```

```json
{
  "error": "Request has already been accepted"
}
```

```json
{
  "error": "Time slot is already booked. Please choose a different time."
}
```

```json
{
  "error": "No available doctor found. Please assign a doctor to the appointment request before accepting.",
  "code": "NO_PROVIDER_AVAILABLE"
}
```

**Status Code:** `404 Not Found`

```json
{
  "error": "Appointment request not found"
}
```

**Status Code:** `409 Conflict`

```json
{
  "error": "Time slot is already booked. Please choose a different time."
}
```

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Failed to generate patient ID",
  "details": "Error message",
  "code": "PATIENT_ID_GENERATION_FAILED"
}
```

```json
{
  "error": "Failed to create patient",
  "details": "Database error message",
  "code": "PATIENT_CREATION_FAILED",
  "hint": "Additional hint"
}
```

```json
{
  "error": "Failed to create appointment",
  "details": "Database error message",
  "code": "APPOINTMENT_CREATION_FAILED"
}
```

---

## Reject Appointment Request API

### POST - Reject Appointment Request

Reject and delete an appointment request. Requires authentication.

**Endpoint:** `POST /api/appointment-requests/{id}/reject`

**Authentication:** Required (RBAC: `appointments:edit` permission)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Yes | Appointment request ID |

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Appointment request rejected and deleted successfully"
}
```

**Error Responses:**

**Status Code:** `400 Bad Request`

```json
{
  "error": "Request has already been accepted"
}
```

**Status Code:** `401 Unauthorized` or `403 Forbidden`

```json
{
  "error": "Unauthorized"
}
```

**Status Code:** `404 Not Found`

```json
{
  "error": "Appointment request not found"
}
```

**Status Code:** `500 Internal Server Error`

```json
{
  "error": "Failed to reject appointment request",
  "details": "Database error message"
}
```

---

## Data Models

### AppointmentRequest

```typescript
interface AppointmentRequest {
  id: string;                    // UUID
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
  full_name: string;             // Required
  email: string | null;          // Optional
  mobile: string;                // Required
  gender: 'male' | 'female' | 'other';  // Required
  date_of_birth: string | null;  // Date (YYYY-MM-DD)
  appointment_date: string;      // Date (YYYY-MM-DD), required
  start_time: string;            // Time (HH:MM:SS), required
  end_time: string;              // Time (HH:MM:SS), required
  type: 'consult' | 'follow-up' | 'surgery' | 'refraction' | 'other';  // Required
  provider_id: string | null;    // UUID, optional
  reason: string | null;         // Optional
  notes: string | null;          // Optional
  status: 'pending' | 'accepted' | 'rejected';  // Required
  processed_by: string | null;   // UUID (user ID)
  processed_at: string | null;   // ISO 8601 timestamp
  patient_id: string | null;     // UUID (set after acceptance)
  appointment_id: string | null; // UUID (set after acceptance)
}
```

### Appointment

```typescript
interface Appointment {
  id: string;                    // UUID
  patient_id: string;            // UUID, required
  provider_id: string;           // UUID, required
  appointment_date: string;      // Date (YYYY-MM-DD)
  start_time: string;            // Time (HH:MM:SS)
  end_time: string;              // Time (HH:MM:SS)
  type: string;                  // Appointment type
  status: string;                // Appointment status
  room: string | null;           // Room number/name
  notes: string | null;          // Additional notes
  created_at: string;            // ISO 8601 timestamp
}
```

### Patient

```typescript
interface Patient {
  id: string;                    // UUID
  patient_id: string;            // Auto-generated (e.g., PAT001)
  full_name: string;             // Required
  email: string | null;          // Optional
  mobile: string;                // Required
  gender: 'male' | 'female' | 'other';
  date_of_birth: string | null;  // Date (YYYY-MM-DD)
  country: string;               // Default: "India"
  state: string;                 // Required
  address: string | null;
  city: string | null;
  postal_code: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  medical_history: string | null;
  current_medications: string | null;
  allergies: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  status: 'active' | 'inactive';
  created_at: string;            // ISO 8601 timestamp
  created_by: string;            // UUID (user ID)
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | OK - Request succeeded |
| `201` | Created - Resource created successfully |
| `204` | No Content - Success with no response body |
| `400` | Bad Request - Invalid request data or validation error |
| `401` | Unauthorized - Missing or invalid authentication |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource not found |
| `409` | Conflict - Resource conflict (e.g., time slot already booked) |
| `500` | Internal Server Error - Server error |

### Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "details": "Detailed error message (optional)",
  "code": "ERROR_CODE (optional)"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `PATIENT_ID_GENERATION_FAILED` | Failed to generate unique patient ID |
| `PATIENT_CREATION_FAILED` | Failed to create patient record |
| `APPOINTMENT_CREATION_FAILED` | Failed to create appointment |
| `NO_PROVIDER_AVAILABLE` | No available doctor/provider found |

---

## Authentication

### Public Endpoints

The following endpoints do **not** require authentication:

- `POST /api/public/appointments` - Create appointment request
- `GET /api/public/appointments` - Get appointment by ID
- `GET /api/appointment-requests?id={id}` - Get appointment request by ID (for success page)

### Authenticated Endpoints

The following endpoints **require** authentication:

- `GET /api/appointment-requests` - List appointment requests (requires `appointments:view`)
- `POST /api/appointment-requests/{id}/accept` - Accept request (requires `appointments:create`)
- `POST /api/appointment-requests/{id}/reject` - Reject request (requires `appointments:edit`)

### Authentication Method

Authenticated endpoints use Bearer token authentication:

```
Authorization: Bearer {supabase_jwt_token}
```

The token is validated by the RBAC middleware, which checks for the required permissions.

---

## CORS Configuration

### Supported Origins

CORS is configured for development environments:

- `localhost` (any port)
- `127.0.0.1` (any port)

### CORS Headers

Public endpoints include the following CORS headers:

```
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Access-Control-Allow-Origin: [request origin] (if localhost/127.0.0.1)
```

### Preflight Requests

All endpoints support OPTIONS requests for CORS preflight:

```
OPTIONS /api/public/appointments
OPTIONS /api/appointment-requests
```

---

## Examples

### Example 1: Create Appointment Request

```bash
curl -X POST https://your-domain.com/api/public/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "mobile": "+1 234 567 8900",
    "gender": "male",
    "appointment_date": "2024-12-25",
    "start_time": "10:00",
    "end_time": "11:00",
    "type": "consult",
    "reason": "Regular eye checkup"
  }'
```

### Example 2: List Pending Appointment Requests

```bash
curl -X GET "https://your-domain.com/api/appointment-requests?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Accept Appointment Request

```bash
curl -X POST https://your-domain.com/api/appointment-requests/{request_id}/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "mobile": "+1 234 567 8900",
    "gender": "male",
    "state": "Karnataka",
    "address": "123 Main Street",
    "city": "Bangalore"
  }'
```

### Example 4: Reject Appointment Request

```bash
curl -X POST https://your-domain.com/api/appointment-requests/{request_id}/reject \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes

1. **Time Format**: All times are in 24-hour format (HH:MM or HH:MM:SS)
2. **Date Format**: All dates are in ISO 8601 format (YYYY-MM-DD)
3. **UUID Format**: All IDs are UUIDs (version 4)
4. **Patient ID Generation**: Patient IDs are auto-generated (e.g., PAT001, PAT002)
5. **Provider Auto-Assignment**: If no provider is specified when accepting a request, the system will attempt to auto-assign an available doctor
6. **Conflict Detection**: When accepting a request, the system checks for time slot conflicts with existing appointments
7. **Request Status**: Appointment requests start with status `pending` and change to `accepted` or `rejected` after processing

