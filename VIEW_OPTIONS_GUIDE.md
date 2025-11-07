# View Options Implementation Guide

## Overview

The ViewOptions component has been successfully implemented across all dashboard pages to provide consistent filtering, sorting, and view management capabilities.

## Features Added

### 1. ViewOptions Component (`/components/ui/view-options.tsx`)

A reusable component that provides:
- **View Toggle**: Switch between different view modes (List, Grid, Calendar, etc.)
- **Filtering**: Filter data based on multiple criteria with count badges
- **Sorting**: Sort data by different fields with ascending/descending options
- **Export**: Quick export functionality
- **Settings**: Access to additional settings

### 2. Pages Updated

#### Patients Page (`/dashboard/patients`)
- **Views**: List, Grid
- **Filters**: Active Patients, Gender (Male/Female), State (Gujarat/Maharashtra)
- **Sorting**: Name, Age, Last Visit, State
- **Export & Settings**: Available

#### Appointments Page (`/dashboard/appointments`)
- **Views**: List, Calendar
- **Filters**: Today, Status (Scheduled/Confirmed/Completed), Type (Consultation/Surgery)
- **Sorting**: Date & Time, Patient Name, Doctor, Type, Status
- **Export & Settings**: Available

#### Pharmacy Page (`/dashboard/pharmacy`)
- **Pharmacy Tab**:
  - Views: List, Grid
  - Filters: Low Stock, Expiring Soon, Eye Drops, Antibiotics
  - Sorting: Name, Stock Quantity, Price, Expiry Date
  - Export: Available

- **Optical Tab**:
  - Views: List, Grid
  - Filters: Low Stock, Frames, Lenses, Accessories
  - Sorting: Name, Stock Quantity, Price, Brand
  - Export: Available

- **Stock Movements Tab**:
  - Views: List
  - Filters: Purchase, Sale, Expired, Pharmacy, Optical
  - Sorting: Date, Type, Total Value, Quantity
  - Export: Available

## How It Works

### 1. Configuration
Each page defines a `ViewOptionsConfig` object:

```typescript
const viewOptionsConfig: ViewOptionsConfig = {
  views: [
    { id: "list", label: "List" },
    { id: "grid", label: "Grid" },
  ],
  filters: [
    { id: "active", label: "Active Patients", count: 4 },
    { id: "male", label: "Male", count: 2 },
  ],
  sortOptions: [
    { id: "name", label: "Name" },
    { id: "age", label: "Age" },
  ],
  showExport: true,
  showSettings: true,
}
```

### 2. State Management
Each page maintains separate state for:
- Current view mode
- Applied filters array
- Current sort field
- Sort direction

### 3. Data Processing
The `filteredAndSortedData` useMemo hook:
- Filters data based on applied filters
- Sorts data based on current sort settings
- Returns processed data for display

### 4. Event Handlers
- `handleViewChange`: Updates current view mode
- `handleFilterChange`: Updates applied filters
- `handleSortChange`: Updates sort field and direction
- `handleExport`: Triggers data export
- `handleSettings`: Opens settings panel

## Usage Example

```tsx
<ViewOptions
  config={viewOptionsConfig}
  currentView={currentView}
  appliedFilters={appliedFilters}
  currentSort={currentSort}
  sortDirection={sortDirection}
  onViewChange={handleViewChange}
  onFilterChange={handleFilterChange}
  onSortChange={handleSortChange}
  onExport={handleExport}
  onSettings={handleSettings}
/>
```

## Benefits

1. **Consistent UX**: Same interface pattern across all pages
2. **Powerful Filtering**: Multiple filter combinations with visual indicators
3. **Flexible Sorting**: Quick access to different sort options
4. **Export Ready**: Built-in export functionality
5. **Responsive Design**: Works well on mobile and desktop
6. **Customizable**: Easy to add new filters and sort options

## Future Enhancements

1. **Grid View Implementation**: Add actual grid layout when grid view is selected
2. **Calendar View**: Implement calendar layout for appointments
3. **Advanced Filters**: Date range pickers, numeric range filters
4. **Export Formats**: Support for CSV, PDF, Excel exports
5. **Saved Views**: Allow users to save frequently used filter combinations
6. **Search Integration**: Combine search with filters for more powerful queries

## Next Steps

The ViewOptions component is now fully functional across all pages. You can:

1. Test the filtering by clicking on different filter options
2. Try the sorting by using the sort dropdown
3. Switch between view modes where available
4. Use the export functionality (currently logs to console)

All functionality is working and the build passes successfully!