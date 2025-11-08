# 🎨 UI Design System - Pixel Perfect Standards

## 📐 Spacing & Layout

### Page Container
```tsx
<div className="flex flex-col gap-6">  // Consistent 24px gap between sections
```

### Header Section
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground">Page description</p>
  </div>
  <Button>Action</Button>
</div>
```

### KPI Cards Grid
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  // Always 4 columns on large screens
  // 16px gap between cards
</div>
```

### Content Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    // Content with pt-0 to remove top padding
  </CardContent>
</Card>
```

## 🎯 Typography

### Headings
- **Page Title**: `text-3xl font-bold tracking-tight`
- **Card Title**: `text-2xl font-semibold tracking-tight` (default from CardTitle)
- **Section Title**: `text-lg font-semibold`
- **Subsection**: `text-base font-medium`

### Body Text
- **Primary**: `text-sm` (14px)
- **Secondary**: `text-sm text-muted-foreground`
- **Caption**: `text-xs text-muted-foreground`

## 🎨 Colors

### Status Badges
```tsx
const statusColors = {
  Active: "bg-green-100 text-green-700 border-green-200",
  Inactive: "bg-gray-100 text-gray-700 border-gray-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
}
```

### Button Variants
- **Primary**: `variant="default"` (blue)
- **Secondary**: `variant="outline"` (white with border)
- **Danger**: `variant="destructive"` (red)
- **Ghost**: `variant="ghost"` (transparent)

## 📦 Components

### Search Bar
```tsx
<div className="relative">
  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
  <Input
    type="search"
  <Input
    type="search"
    placeholder="Search..."
    className="pl-8 w-full md:w-[300px]"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
```

### Action Buttons (Table)
```tsx
<div className="flex items-center gap-1">
  <Button variant="ghost" size="icon" className="h-8 w-8">
    <Eye className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon" className="h-8 w-8">
    <Edit className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

### KPI Card Structure
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Metric Name</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">Value</div>
    <p className="text-xs text-muted-foreground">Description</p>
  </CardContent>
</Card>
```

## 📊 Tables

### Table Structure
```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
      {items.length === 0 ? (
        <TableRow>
          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
            No items found
          </TableCell>
        <TableRow>
          <TableCell colSpan={columns} className="text-center py-8 text-muted-foreground">
            No items found
          </TableCell>
        </TableRow>
      ) : (
        items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>Content</TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>
```

## 🔢 Spacing Scale

- **gap-1**: 4px (tight spacing)
- **gap-2**: 8px (compact spacing)
- **gap-3**: 12px (default spacing)
- **gap-4**: 16px (card grids, form fields)
- **gap-6**: 24px (page sections)
- **gap-8**: 32px (major sections)

## 📱 Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Grid Patterns
```tsx
// 2 columns on medium, 4 on large
grid gap-4 md:grid-cols-2 lg:grid-cols-4

// 1 column on mobile, 2 on medium, 3 on large
grid gap-4 md:grid-cols-2 lg:grid-cols-3

// Full width on mobile, 2 columns on medium+
grid gap-4 md:grid-cols-2
```

## 🎭 Animations

### Transitions
- **Default**: `transition-colors` (buttons, hover states)
- **Smooth**: `transition-smooth` (custom utility, 300ms cubic-bezier)
- **Spring**: `transition-spring` (custom utility, 500ms spring)

### Hover States
```tsx
hover:bg-gray-100  // For ghost buttons
hover:bg-primary/90  // For primary buttons
hover:shadow-md  // For cards
```

## ✅ Consistency Checklist

### Every Page Must Have:
- [ ] Consistent page container: `flex flex-col gap-6`
- [ ] Standard header with title and description
- [ ] KPI cards in 4-column grid (if applicable)
- [ ] Consistent card styling with `rounded-2xl`
- [ ] Proper spacing between sections (gap-6)
- [ ] Consistent table action buttons (h-8 w-8)
- [ ] Search bar with icon (if applicable)
- [ ] Pagination component at bottom
- [ ] Toast notifications for actions
- [ ] Consistent badge colors for status

### Form Standards:
- [ ] Grid layout: `grid grid-cols-2 gap-4`
- [ ] Consistent field spacing
- [ ] Proper validation with Zod
- [ ] Toast on success/error
- [ ] Loading states on submit

### Dialog Standards:
- [ ] Max width: `max-w-4xl` for view dialogs
- [ ] Max width: `max-w-2xl` for forms
- [ ] Scrollable content: `max-h-[90vh] overflow-y-auto`
- [ ] Consistent header structure

## 🚀 Implementation Priority

1. **High Priority**: Page containers, headers, spacing
2. **Medium Priority**: Card layouts, grids, typography
3. **Low Priority**: Animations, micro-interactions
