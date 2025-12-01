# Booking Flow Documentation

This document confirms the booking flow from the public website to the CRM bookings page.

## Flow Overview

```
Public Booking Form (WEBSITE)
    ↓
POST /api/public/appointments
    ↓
Creates record in appointment_requests table (status: 'pending')
    ↓
CRM Bookings Page (/bookings)
    ↓
GET /api/appointment-requests
    ↓
Displays all appointment_requests
```

## Step-by-Step Flow

### 1. Public Booking Form Submission

**Location:** `WEBSITE/src/components/BookingForm.tsx`

**What happens:**
- User fills out the booking form on the public website
- Form data is submitted to: `${NEXT_PUBLIC_API_URL}/api/public/appointments`
- Data sent includes:
  - `full_name`
  - `email` (optional)
  - `mobile`
  - `gender`
  - `appointment_date`
  - `start_time` (default: "10:00")
  - `end_time` (default: "11:00")
  - `type` (default: "consult")

### 2. API Endpoint: Create Appointment Request

**Location:** `app/api/public/appointments/route.ts`

**What happens:**
- Receives POST request from public form
- Validates required fields: `full_name`, `mobile`, `gender`, `appointment_date`, `start_time`, `end_time`, `type`
- Creates a new record in the `appointment_requests` table:
  ```sql
  INSERT INTO appointment_requests (
    full_name,
    email,
    mobile,
    gender,
    appointment_date,
    start_time,
    end_time,
    type,
    status,  -- Set to 'pending'
    ...
  )
  ```
- Returns the created `appointment_request` with status: `'pending'`

### 3. Supabase Database: appointment_requests Table

**Table:** `appointment_requests`

**Key Fields:**
- `id` (UUID, primary key)
- `full_name` (TEXT, required)
- `email` (TEXT, optional)
- `mobile` (TEXT, required)
- `gender` (TEXT, required: 'male', 'female', 'other')
- `appointment_date` (DATE, required)
- `start_time` (TIME, required)
- `end_time` (TIME, required)
- `type` (TEXT, required: 'consult', 'follow-up', 'surgery', 'refraction', 'other')
- `status` (ENUM: 'pending', 'accepted', 'rejected') - **Always set to 'pending' on creation**
- `provider_id` (UUID, optional - references users table)
- `reason` (TEXT, optional)
- `notes` (TEXT, optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 4. CRM Bookings Page

**Location:** `app/(dashboard)/bookings/page.tsx`

**What happens:**
- Fetches all appointment requests from: `/api/appointment-requests`
- Supports filtering by status (pending, accepted, rejected)
- Supports search by name, email, or mobile
- Supports pagination and sorting
- Displays in a table with:
  - Patient name and avatar
  - Contact information (email, mobile)
  - Appointment date and time
  - Appointment type
  - Preferred doctor (if specified)
  - Status badge (pending/accepted/rejected)
  - Action buttons (Accept/Reject for pending requests)

### 5. API Endpoint: List Appointment Requests

**Location:** `app/api/appointment-requests/route.ts`

**What happens:**
- Receives GET request from bookings page
- Queries `appointment_requests` table with:
  - Pagination support
  - Search filter (by name, email, mobile)
  - Status filter (pending/accepted/rejected)
  - Sorting options
  - Joins with `users` table for provider and processed_by information
- Returns paginated list of appointment requests

## Status Flow

```
pending (Initial state when created from public form)
    ↓
    ├─→ accepted (When staff accepts → creates patient + appointment)
    └─→ rejected (When staff rejects → deleted or marked as rejected)
```

## Verification Checklist

- ✅ Public form submits to `/api/public/appointments`
- ✅ API creates `appointment_requests` with status: 'pending'
- ✅ Bookings page fetches from `/api/appointment-requests`
- ✅ Bookings page displays all appointment requests
- ✅ Data includes all required fields (name, contact, date, time, type)
- ✅ Status filter works (pending/accepted/rejected)
- ✅ Search functionality works

## Testing the Flow

1. **Submit a booking from the public website:**
   - Fill out the booking form
   - Submit and verify success message
   - Check browser console for API response

2. **Verify in CRM:**
   - Navigate to `/bookings` page in the CRM
   - The new booking should appear in the table
   - Status should be "pending"
   - All form data should be visible

3. **Process the booking:**
   - Click "Accept" to create a patient and appointment
   - Or click "Reject" to reject the request
   - Verify status updates accordingly

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/public/appointments` | POST | Create appointment request from public form | No |
| `/api/appointment-requests` | GET | List all appointment requests for bookings page | Yes (RBAC) |
| `/api/appointment-requests/{id}/accept` | POST | Accept request and create patient + appointment | Yes (RBAC) |
| `/api/appointment-requests/{id}/reject` | POST | Reject appointment request | Yes (RBAC) |

## Data Mapping

**Form Field → Database Column:**
- Full Name → `full_name`
- Email → `email`
- Mobile → `mobile`
- Gender → `gender`
- Appointment Date → `appointment_date`
- Start Time → `start_time`
- End Time → `end_time`
- Appointment Type → `type`
- Provider ID → `provider_id` (optional)

All bookings from the public form will have:
- `status`: `'pending'`
- `created_at`: Current timestamp
- `provider_id`: `null` (unless specified)
- `patient_id`: `null` (set when accepted)
- `appointment_id`: `null` (set when accepted)


















