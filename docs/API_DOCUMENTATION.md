# 🏥 EYECARE CRM - API Documentation

*Complete RESTful API Reference for the Eye Care Hospital Management System*

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Pagination](#pagination)
6. [API Endpoints](#api-endpoints)
   - [Patients API](#patients-api)
   - [Cases API](#cases-api)
   - [Appointments API](#appointments-api)
   - [Billing/Invoices API](#billinginvoices-api)
   - [Employees API](#employees-api)
   - [Master Data API](#master-data-api)
   - [Pharmacy API](#pharmacy-api)

---

## Overview

The EYECARE CRM API provides RESTful endpoints for managing all aspects of an eye care hospital's operations. All endpoints require authentication and follow consistent patterns for CRUD operations.

**Base URL**: `http://localhost:3000/api` (development)

**Content-Type**: `application/json`

**Authentication**: Bearer Token (Supabase JWT)

---

## Authentication

All API endpoints require authentication via Supabase JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting Authentication Token

1. **Login**: Use Supabase auth to get JWT token
2. **Session**: Token is automatically managed by Supabase client
3. **Expiry**: Tokens auto-refresh via Supabase

---

## Response Format

All API responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "pagination": { /* pagination info if applicable */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

### Common Error Messages

- `"Unauthorized"` - Missing or invalid authentication token
- `"Missing required fields"` - Required parameters not provided
- `"Not found"` - Resource doesn't exist
- `"Already exists"` - Duplicate entry attempted

---

## Pagination

List endpoints support pagination with these query parameters:

### Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `search`: Search term
- `sortBy`: Field to sort by
- `sortOrder`: 'asc' or 'desc' (default: 'desc')

### Pagination Response
```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## API Endpoints

## Patients API

### GET /api/patients
List all patients with pagination and filtering.

#### Query Parameters
- `page` (integer): Page number
- `limit` (integer): Items per page
- `search` (string): Search in name, email, mobile
- `status` (string): Filter by status (active/inactive)
- `gender` (string): Filter by gender
- `state` (string): Filter by state
- `sortBy` (string): Field to sort by
- `sortOrder` (string): asc/desc

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "patient_id": "PAT001",
      "full_name": "John Doe",
      "email": "john@example.com",
      "mobile": "9876543210",
      "gender": "male",
      "date_of_birth": "1990-01-01",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postal_code": "400001",
      "emergency_contact": "Jane Doe",
      "emergency_phone": "9876543211",
      "medical_history": "None",
      "current_medications": "None",
      "allergies": "None",
      "insurance_provider": "HDFC ERGO",
      "insurance_number": "INS123456",
      "status": "active",
      "created_at": "2023-11-08T12:00:00Z",
      "updated_at": "2023-11-08T12:00:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### POST /api/patients
Create a new patient.

#### Request Body
```json
{
  "patient_id": "PAT001",
  "full_name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "gender": "male",
  "date_of_birth": "1990-01-01",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "emergency_contact": "Jane Doe",
  "emergency_phone": "9876543211",
  "medical_history": "None",
  "current_medications": "None",
  "allergies": "None",
  "insurance_provider": "HDFC ERGO",
  "insurance_number": "INS123456",
  "status": "active"
}
```

#### Response
```json
{
  "success": true,
  "data": { /* patient object */ },
  "message": "Patient created successfully"
}
```

### GET /api/patients/[id]
Get a specific patient by ID.

#### Response
```json
{
  "success": true,
  "data": { /* patient object */ }
}
```

### PUT /api/patients/[id]
Update a patient.

#### Request Body
```json
{
  "full_name": "John Smith",
  "email": "johnsmith@example.com"
  /* other fields to update */
}
```

#### Response
```json
{
  "success": true,
  "data": { /* updated patient object */ },
  "message": "Patient updated successfully"
}
```

### DELETE /api/patients/[id]
Delete a patient (soft delete - sets status to inactive).

#### Response
```json
{
  "success": true,
  "data": { /* patient object */ },
  "message": "Patient deleted successfully"
}
```

---

## Cases API

### GET /api/cases
List all cases/encounters with patient information.

#### Query Parameters
- `page`, `limit`, `search`, `sortBy`, `sortOrder`: Standard pagination
- `status` (string): Filter by case status
- `patient_id` (string): Filter by patient ID

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "case_no": "OPT2023001",
      "patient_id": "uuid",
      "encounter_date": "2023-11-08",
      "visit_type": "First",
      "chief_complaint": "Blurred vision",
      "history_of_present_illness": "Patient reports...",
      "past_medical_history": "Diabetes",
      "examination_findings": "Myopia -2.5D",
      "diagnosis": "Myopia",
      "treatment_plan": "Glasses prescription",
      "medications_prescribed": "None",
      "follow_up_instructions": "Return in 6 months",
      "status": "active",
      "patients": {
        "id": "uuid",
        "patient_id": "PAT001",
        "full_name": "John Doe",
        "email": "john@example.com",
        "mobile": "9876543210",
        "gender": "male"
      },
      "created_at": "2023-11-08T12:00:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### POST /api/cases
Create a new case/encounter.

#### Request Body
```json
{
  "case_no": "OPT2023001",
  "patient_id": "uuid",
  "encounter_date": "2023-11-08",
  "visit_type": "First",
  "chief_complaint": "Blurred vision",
  "history_of_present_illness": "Patient reports...",
  "past_medical_history": "Diabetes",
  "examination_findings": "Myopia -2.5D",
  "diagnosis": "Myopia",
  "treatment_plan": "Glasses prescription",
  "medications_prescribed": "None",
  "follow_up_instructions": "Return in 6 months",
  "status": "active"
}
```

### GET /api/cases/[id]
Get a specific case with detailed patient information.

### PUT /api/cases/[id]
Update a case (cannot change patient_id).

### DELETE /api/cases/[id]
Cancel a case (soft delete - sets status to cancelled).

---

## Appointments API

### GET /api/appointments
List all appointments with patient information.

#### Query Parameters
- Standard pagination parameters
- `status` (string): scheduled, completed, cancelled, etc.
- `date` (string): Filter by specific date (YYYY-MM-DD)
- `patient_id` (string): Filter by patient

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "patient_id": "uuid",
      "appointment_date": "2023-11-08",
      "appointment_time": "10:00",
      "appointment_type": "consult",
      "doctor_id": "uuid",
      "reason": "Regular checkup",
      "duration_minutes": 30,
      "status": "scheduled",
      "notes": "First time patient",
      "patients": {
        "id": "uuid",
        "patient_id": "PAT001",
        "full_name": "John Doe",
        "email": "john@example.com",
        "mobile": "9876543210",
        "gender": "male"
      },
      "created_at": "2023-11-08T12:00:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### POST /api/appointments
Create a new appointment.

#### Request Body
```json
{
  "patient_id": "uuid",
  "appointment_date": "2023-11-08",
  "appointment_time": "10:00",
  "appointment_type": "consult",
  "doctor_id": "uuid",
  "reason": "Regular checkup",
  "duration_minutes": 30,
  "notes": "First time patient"
}
```

#### Automatic Conflict Detection
The API automatically checks for scheduling conflicts and returns a 409 error if the time slot is already booked.

### GET /api/appointments/[id]
Get appointment details.

### PUT /api/appointments/[id]
Update appointment (includes conflict checking for time changes).

### DELETE /api/appointments/[id]
Cancel appointment.

---

## Billing/Invoices API

### GET /api/invoices
List all invoices with patient information and invoice items.

#### Query Parameters
- Standard pagination parameters
- `status` (string): draft, sent, paid, overdue, cancelled
- `patient_id` (string): Filter by patient
- `date_from` (string): Start date filter
- `date_to` (string): End date filter

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV001",
      "patient_id": "uuid",
      "invoice_date": "2023-11-08",
      "due_date": "2023-11-15",
      "subtotal": 1000.00,
      "discount_amount": 100.00,
      "tax_amount": 135.00,
      "total_amount": 1035.00,
      "amount_paid": 500.00,
      "balance_due": 535.00,
      "payment_status": "partial",
      "payment_method": "cash",
      "notes": "Regular consultation",
      "status": "sent",
      "patients": {
        "id": "uuid",
        "patient_id": "PAT001",
        "full_name": "John Doe",
        "email": "john@example.com",
        "mobile": "9876543210",
        "gender": "male"
      },
      "invoice_items": [
        {
          "id": "uuid",
          "item_description": "Eye Examination",
          "quantity": 1,
          "unit_price": 500.00,
          "total_price": 500.00
        },
        {
          "id": "uuid",
          "item_description": "Refraction Test",
          "quantity": 1,
          "unit_price": 500.00,
          "total_price": 500.00
        }
      ],
      "created_at": "2023-11-08T12:00:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### POST /api/invoices
Create a new invoice with items.

#### Request Body
```json
{
  "invoice_number": "INV001",
  "patient_id": "uuid",
  "invoice_date": "2023-11-08",
  "due_date": "2023-11-15",
  "subtotal": 1000.00,
  "discount_amount": 100.00,
  "tax_amount": 135.00,
  "total_amount": 1035.00,
  "amount_paid": 0.00,
  "payment_method": "cash",
  "notes": "Regular consultation",
  "items": [
    {
      "item_description": "Eye Examination",
      "quantity": 1,
      "unit_price": 500.00
    },
    {
      "item_description": "Refraction Test",
      "quantity": 1,
      "unit_price": 500.00
    }
  ]
}
```

#### Automatic Calculations
- `balance_due` = `total_amount` - `amount_paid`
- `payment_status` automatically determined based on amounts

### GET /api/invoices/[id]
Get invoice with all details including items.

### PUT /api/invoices/[id]
Update invoice (automatically recalculates balance and payment status).

### DELETE /api/invoices/[id]
Cancel invoice.

---

## Employees API

### GET /api/employees
List all employees.

#### Query Parameters
- Standard pagination parameters
- `status` (string): active, inactive
- `role` (string): Filter by role
- `department` (string): Filter by department

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employee_id": "EMP001",
      "full_name": "Dr. Smith",
      "email": "smith@hospital.com",
      "phone": "9876543210",
      "role": "ophthalmologist",
      "department": "Ophthalmology",
      "hire_date": "2023-01-01",
      "salary": 80000.00,
      "address": "123 Hospital St",
      "emergency_contact": "Emergency Contact",
      "emergency_phone": "9876543211",
      "qualifications": "MBBS, MS Ophthalmology",
      "license_number": "LIC123456",
      "status": "active",
      "created_at": "2023-11-08T12:00:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### POST /api/employees
Create new employee.

### GET /api/employees/[id]
Get employee details.

### PUT /api/employees/[id]
Update employee (cannot change employee_id).

### DELETE /api/employees/[id]
Deactivate employee.

---

## Master Data API

The Master Data API manages centralized data for dropdowns and lookups across the application.

### GET /api/master-data
Get master data by category or list all categories.

#### Query Parameters
- `category` (string): Specific category to fetch
- `page`, `limit`: Standard pagination
- `search` (string): Search in name/description
- `active_only` (boolean): Only active items
- `sortBy`, `sortOrder`: Sorting

#### Get All Categories
```http
GET /api/master-data
```

#### Response
```json
{
  "success": true,
  "data": {
    "complaints": 25,
    "medicines": 150,
    "treatments": 30,
    "surgeries": 20
  },
  "categories": ["complaints", "medicines", "treatments", "surgeries"]
}
```

#### Get Specific Category
```http
GET /api/master-data?category=medicines&page=1&limit=50
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "category": "medicines",
      "name": "Tropicamide 0.8%",
      "description": "Mydriatic eye drops",
      "is_active": true,
      "sort_order": 1,
      "metadata": {},
      "created_at": "2023-11-08T12:00:00Z"
    }
  ],
  "category": "medicines",
  "pagination": { /* pagination info */ }
}
```

### POST /api/master-data
Add new master data item.

#### Request Body
```json
{
  "category": "medicines",
  "name": "New Medicine",
  "description": "Description of medicine",
  "is_active": true,
  "sort_order": 0,
  "metadata": {}
}
```

### GET /api/master-data/[id]
Get specific master data item.

### PUT /api/master-data/[id]
Update master data item (cannot change category).

### DELETE /api/master-data/[id]
Delete or deactivate master data item.

#### Query Parameters
- `hard=true`: Permanently delete (default: soft delete)

---

## Pharmacy API

### GET /api/pharmacy
List pharmacy inventory items.

#### Query Parameters
- Standard pagination parameters
- `category` (string): Filter by medicine category
- `low_stock=true`: Show only low stock items

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "item_name": "Tropicamide 0.8%",
      "generic_name": "Tropicamide",
      "manufacturer": "Pharma Corp",
      "category": "mydriatic",
      "unit_price": 25.00,
      "selling_price": 30.00,
      "current_stock": 50,
      "reorder_level": 10,
      "batch_number": "BATCH123",
      "expiry_date": "2024-12-31",
      "description": "Mydriatic eye drops",
      "created_at": "2023-11-08T12:00:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### POST /api/pharmacy
Add new pharmacy item.

---

## Real-time Features

All list endpoints support real-time updates via Supabase subscriptions:

```javascript
// Example: Subscribe to patients changes
const subscription = supabase
  .from('patients')
  .on('*', (payload) => {
    console.log('Change received!', payload)
    // Update UI accordingly
  })
  .subscribe()
```

---

## Rate Limiting

API endpoints are protected by Supabase's built-in rate limiting:
- **Read operations**: 1000 requests per minute
- **Write operations**: 100 requests per minute

---

## Testing

Use the included test scripts:

```bash
# Test authentication
npm run test:auth

# Test all endpoints
npm run test:api

# Test specific module
npm run test:patients
```

---

## Postman Collection

Import the provided Postman collection for easy testing:
- File: `/docs/EYECARE_API.postman_collection.json`
- Includes all endpoints with example requests
- Environment variables for easy switching between dev/prod

---

*Last Updated: November 8, 2025*
*API Version: 1.0.0*