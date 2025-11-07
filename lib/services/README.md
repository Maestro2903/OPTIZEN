# API Services Layer

This directory contains the centralized API services layer for the Eye Care Hospital CRM. Following best practices for frontend-backend separation, all API calls are organized into dedicated service modules.

## Architecture

```
lib/services/
├── index.ts              # Central export point
├── api-client.ts         # Base API client with auth & error handling
├── patient.service.ts    # Patient-related API operations
├── appointment.service.ts # Appointment management APIs
├── billing.service.ts    # Billing and invoice APIs
├── user.service.ts       # User management and auth APIs
└── README.md            # This file
```

## Key Benefits

✅ **Security**: No API keys or secrets exposed in frontend code
✅ **Maintainability**: Centralized API logic, easy to update
✅ **Type Safety**: Full TypeScript support with database types
✅ **Error Handling**: Consistent error handling across all services
✅ **Testing**: Easy to mock and test individual services
✅ **Reusability**: Services can be used across components and pages

## Usage

### Import Services

```typescript
// Import individual services
import { patientService } from '@/lib/services'

// Import multiple services
import {
  patientService,
  appointmentService,
  billingService
} from '@/lib/services'

// Import types for type safety
import type { Patient, Appointment } from '@/lib/services'
```

### Using Services in Components

```typescript
// In a React component
import { patientService } from '@/lib/services'

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true)
        const data = await patientService.getPatients({ limit: 20 })
        setPatients(data)
      } catch (error) {
        console.error('Failed to load patients:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPatients()
  }, [])

  // Rest of component...
}
```

### Error Handling

All services include comprehensive error handling:

```typescript
try {
  const patient = await patientService.getPatientById('123')
} catch (error) {
  // Error is already logged by the service
  // Handle UI error state here
  toast.error('Failed to load patient data')
}
```

## Available Services

### 🧑‍⚕️ Patient Service

- `getPatients()` - List patients with filtering
- `getPatientById()` - Get single patient
- `getPatientByMRN()` - Find by Medical Record Number
- `createPatient()` - Create new patient
- `updatePatient()` - Update patient data
- `searchPatients()` - Search functionality
- `getPatientStats()` - Patient statistics

### 📅 Appointment Service

- `getAppointments()` - List appointments with filters
- `getTodayAppointments()` - Today's schedule
- `getUpcomingAppointments()` - Future appointments
- `createAppointment()` - Schedule new appointment
- `updateAppointment()` - Modify appointment
- `cancelAppointment()` - Cancel appointment
- `checkInAppointment()` - Patient check-in
- `getAvailableTimeSlots()` - Available slots for booking

### 💰 Billing Service

- `getInvoices()` - List invoices with filtering
- `createInvoice()` - Generate new invoice
- `markInvoiceAsPaid()` - Record payment
- `getOverdueInvoices()` - Overdue invoices
- `getRevenueStats()` - Financial statistics
- `getPaymentHistory()` - Patient payment history

### 👥 User Service

- `getUsers()` - List users with roles
- `getCurrentUserProfile()` - Current user data
- `getProviders()` - Doctors, nurses, etc.
- `createUser()` - Add new user (admin)
- `updateUserRole()` - Change user permissions
- `checkUserPermission()` - Permission validation

## Configuration

Service configuration is available in `index.ts`:

```typescript
import { serviceConfig } from '@/lib/services'

// Pagination settings
serviceConfig.pagination.defaultLimit // 10
serviceConfig.pagination.maxLimit     // 100

// Date formats
serviceConfig.dateFormats.api      // ISO format for API
serviceConfig.dateFormats.display  // Human-readable format

// Error handling
serviceConfig.errorHandling.retryAttempts  // 3
serviceConfig.errorHandling.timeoutDuration // 10s
```

## Health Monitoring

Check service health status:

```typescript
import { healthCheck } from '@/lib/services'

const status = await healthCheck()
console.log(status)
// {
//   status: 'healthy' | 'degraded' | 'down',
//   services: { auth: true, patients: true, ... },
//   timestamp: '2024-01-01T00:00:00.000Z'
// }
```

## Environment Variables

Services automatically use environment variables:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Best Practices

1. **Always use services** instead of direct Supabase calls in components
2. **Handle errors gracefully** with try-catch blocks
3. **Use TypeScript types** for better development experience
4. **Implement loading states** for better UX
5. **Test services independently** with mocked data
6. **Keep business logic in services**, not components

## Migration from Direct API Calls

If you find direct API calls in components:

```typescript
// ❌ Bad: Direct API call in component
const { data } = await supabase.from('patients').select('*')

// ✅ Good: Use service layer
const patients = await patientService.getPatients()
```

This ensures consistent error handling, type safety, and maintainability.