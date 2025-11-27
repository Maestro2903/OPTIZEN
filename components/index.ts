/**
 * Component Barrel Exports
 * 
 * This file provides centralized exports for all components,
 * making imports cleaner and easier to manage.
 */

// Forms
export { AppointmentForm } from "./forms/appointment-form"
export { AttendanceForm } from "./forms/attendance-form"
export { BedAssignmentForm } from "./forms/bed-assignment-form"
export { BedForm } from "./forms/bed-form"
export { CaseForm } from "./forms/case-form"
export { CertificateForms } from "./forms/certificate-forms"
export { CertificateGeneratorForm } from "./forms/certificate-generator-form"
export { DischargeForm } from "./forms/discharge-form"
export { EmployeeForm } from "./forms/employee-form"
export { ExpenseForm } from "./forms/expense-form"
export { InvoiceForm } from "./forms/invoice-form-new"
export { MasterDataForm } from "./forms/master-data-form"
export { OperationForm } from "./forms/operation-form"
export { PharmacyItemForm } from "./forms/pharmacy-item-form"

// Dialogs
export { AppointmentReassignDialog } from "./dialogs/appointment-reassign-dialog"
export { AppointmentViewDialog } from "./dialogs/appointment-view-dialog"
export { BedDetailsDialog } from "./dialogs/bed-details-dialog"
export { CaseViewDialog } from "./dialogs/case-view-dialog"
export { CertificatePrintModal } from "./dialogs/certificate-print-modal"
export { DeleteConfirmDialog } from "./dialogs/delete-confirm-dialog"
export { FinanceInvoiceDialog } from "./dialogs/finance-invoice-dialog"
export { InvoiceViewDialog } from "./dialogs/invoice-view-dialog"
export { PatientDetailModal } from "./dialogs/patient-detail-modal"
export { PatientFormDialog } from "./dialogs/patient-form-dialog"
export { PharmacyViewDialog } from "./dialogs/pharmacy-view-dialog"
export { ViewEditDialog } from "./dialogs/view-edit-dialog"

// Print Components
export { AppointmentPrint } from "./print/appointment-print"
export { AttendancePrint } from "./print/attendance-print"
export { BedPrint } from "./print/bed-print"
export { BillingPrint } from "./print/billing-print"
export { CasePrint } from "./print/case-print"
export { CertificatePrint } from "./print/certificate-print"
export { DischargePrint } from "./print/discharge-print"
export { EmployeePrint } from "./print/employee-print"
export { OperationPrint, type OperationPrintData } from "./print/operation-print"
export { PharmacyPrint } from "./print/pharmacy-print"
export { RevenuePrint } from "./print/revenue-print"
export { PrintHeader, PrintSection, PrintGrid, PrintFooter, PrintLayout, PrintRow, PrintCol, PrintField, PrintSignature } from "./print/print-layout"
export { PrintModalShell } from "./print/print-modal-shell"

// Feature Components
// Appointments
export { DoctorAppointmentCard } from "./features/appointments/doctor-appointment-card"

// Attendance
export { AttendanceDashboardStats } from "./features/attendance/attendance-dashboard-stats"

// Beds
export { BedCard } from "./features/beds/bed-card"

// Doctors
export { DoctorStatsWidget } from "./features/doctors/doctor-stats-widget"

// Patients
export { DuplicatePatientDetector } from "./features/patients/duplicate-patient-detector"
export { PatientCaseHistoryTabs } from "./features/patients/patient-case-history-tabs"
export { PatientSearchSelector } from "./features/patients/patient-search-selector"
export { PatientSelectorWithHistory } from "./features/patients/patient-selector-with-history"

// Revenue
export { RevenueCharts } from "./features/revenue/revenue-charts"

// Shared Components
export { AppSidebar } from "./shared/app-sidebar"
export { Logo } from "./shared/logo"
export { NavMain } from "./shared/nav-main"
export { NavUser } from "./shared/nav-user"
export { EyeDrawingTool } from "./shared/eye-drawing-tool"

// Layout Components
export { Header } from "./layout/header"














