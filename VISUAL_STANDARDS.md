# 👁️ Visual Standards Guide - EYECARE CRM

## 🎨 Design Philosophy

The EYECARE CRM follows a **clean, modern, medical-grade design** inspired by Apple's design language with a focus on:
- **Clarity**: Clear visual hierarchy
- **Consistency**: Same patterns everywhere
- **Professionalism**: Medical-grade polish
- **Accessibility**: WCAG AA compliant

---

## 📐 Layout Standards

### Page Structure (Every Page)
```
┌─────────────────────────────────────────────────────────┐
│  gap-6 (24px)                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ HEADER (flex items-center justify-between)        │  │
│  │ ┌─────────────────┐         ┌─────────────────┐  │  │
│  │ │ Title           │         │ Action Button   │  │  │
│  │ │ Description     │         └─────────────────┘  │  │
│  │ └─────────────────┘                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  gap-6 (24px)                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ KPI CARDS (grid gap-4 md:grid-cols-2 lg:grid-cols-4)│
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐                      │  │
│  │ │Card│ │Card│ │Card│ │Card│                      │  │
│  │ └────┘ └────┘ └────┘ └────┘                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  gap-6 (24px)                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ MAIN CONTENT CARD                                 │  │
│  │ ┌─────────────────────────────────────────────┐  │  │
│  │ │ CardHeader (p-6)                            │  │  │
│  │ │ ┌─────────────┐         ┌─────────────────┐│  │  │
│  │ │ │ Title       │         │ Search + Filter ││  │  │
│  │ │ │ Description │         └─────────────────┘│  │  │
│  │ │ └─────────────┘                            │  │  │
│  │ └─────────────────────────────────────────────┘  │  │
│  │ ┌─────────────────────────────────────────────┐  │  │
│  │ │ CardContent (p-6 pt-0)                      │  │  │
│  │ │ Table / Content                             │  │  │
│  │ │ Pagination                                  │  │  │
│  │ └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Specifications

### 1. Page Title
```tsx
<h1 className="text-3xl font-bold tracking-tight">
  Page Title
</h1>
<p className="text-muted-foreground">
  Brief description of the page
</p>
```
- **Font Size**: 30px (text-3xl)
- **Font Weight**: 700 (bold)
- **Letter Spacing**: -0.025em (tracking-tight)
- **Line Height**: 1.2
- **Color**: slate-900 (#0f172a)

### 2. KPI Cards
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
    <Users className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">2,847</div>
    <p className="text-xs text-muted-foreground">+12.5% from last month</p>
  </CardContent>
</Card>
```
- **Border Radius**: 16px (rounded-2xl)
- **Padding**: 24px (p-6)
- **Shadow**: subtle (shadow-sm)
- **Icon Size**: 16px (h-4 w-4)
- **Value Size**: 24px (text-2xl)
- **Caption Size**: 12px (text-xs)

### 3. Search Bar
```tsx
<div className="relative">
  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
  <Input
    type="search"
    placeholder="Search..."
    className="pl-8 w-[300px]"
  />
</div>
```
- **Width**: 300px (fixed)
- **Height**: 40px (h-10)
- **Icon Size**: 16px (h-4 w-4)
- **Icon Position**: left-2.5 top-2.5
- **Padding Left**: 32px (pl-8)
- **Border Radius**: 6px (rounded-md)

### 4. Action Buttons
```tsx
<Button className="gap-2">
  <Plus className="h-4 w-4" />
  Add Item
</Button>
```
- **Height**: 40px (h-10)
- **Padding**: 16px horizontal (px-4)
- **Icon Size**: 16px (h-4 w-4)
- **Gap**: 8px (gap-2)
- **Border Radius**: 6px (rounded-md)
- **Font Size**: 14px (text-sm)

### 5. Table Action Buttons
```tsx
<Button variant="ghost" size="icon" className="h-8 w-8">
  <Eye className="h-4 w-4" />
</Button>
```
- **Size**: 32x32px (h-8 w-8)
- **Icon Size**: 16px (h-4 w-4)
- **Hover**: bg-gray-100
- **Gap Between**: 4px (gap-1)

### 6. Status Badges
```tsx
<Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
  Active
</Badge>
```
- **Height**: auto (fits content)
- **Padding**: 4px 8px
- **Font Size**: 12px (text-xs)
- **Border Radius**: 4px (rounded-sm)
- **Border Width**: 1px

---

## 🎨 Color System

### Status Colors (Semantic)
```tsx
// Success States
bg-green-100 text-green-700 border-green-200  // Active, Completed, Paid
bg-green-50  // Hover states

// Warning States
bg-yellow-100 text-yellow-700 border-yellow-200  // Pending, Partial
bg-yellow-50  // Hover states

// Error States
bg-red-100 text-red-700 border-red-200  // Cancelled, Unpaid, Error
bg-red-50  // Hover states

// Info States
bg-blue-100 text-blue-700 border-blue-200  // Scheduled, Info
bg-blue-50  // Hover states

// Neutral States
bg-gray-100 text-gray-700 border-gray-200  // Inactive, Default
bg-gray-50  // Hover states
```

### Interactive States
```tsx
// Buttons
hover:bg-primary/90  // Primary buttons (-10% opacity)
hover:bg-gray-100    // Ghost buttons
hover:shadow-md      // Cards

// Inputs
focus:ring-2 focus:ring-ring focus:ring-offset-2
border-input hover:border-gray-300

// Links
hover:underline underline-offset-4
```

---

## 📊 Spacing System

### Consistent Gaps
```tsx
gap-1  // 4px  - Icon spacing, tight elements
gap-2  // 8px  - Button content, compact spacing
gap-3  // 12px - Related elements
gap-4  // 16px - Card grids, form fields
gap-6  // 24px - Page sections (PRIMARY)
gap-8  // 32px - Major divisions
```

### Padding Scale
```tsx
p-2   // 8px  - Compact elements
p-3   // 12px - Small cards
p-4   // 16px - Medium elements
p-6   // 24px - Cards, dialogs (PRIMARY)
p-8   // 32px - Large containers
```

### Margin Scale
```tsx
mt-2  // 8px  - Tight spacing
mt-4  // 16px - Standard spacing
mt-6  // 24px - Section spacing
mt-8  // 32px - Major spacing
```

---

## 🔤 Typography Scale

### Font Sizes
```tsx
text-xs   // 12px - Captions, helper text
text-sm   // 14px - Body text, table cells (PRIMARY)
text-base // 16px - Emphasized body text
text-lg   // 18px - Section headings
text-xl   // 20px - Subsection headings
text-2xl  // 24px - Card titles, KPI values
text-3xl  // 30px - Page titles (PRIMARY)
```

### Font Weights
```tsx
font-normal   // 400 - Body text
font-medium   // 500 - Labels, emphasized text
font-semibold // 600 - Headings, card titles
font-bold     // 700 - Page titles, KPI values
```

### Line Heights
```tsx
leading-none    // 1.0  - Tight headings
leading-tight   // 1.25 - Page titles
leading-snug    // 1.375 - Subheadings
leading-normal  // 1.5  - Body text
leading-relaxed // 1.625 - Comfortable reading
```

---

## 📱 Responsive Breakpoints

### Grid Patterns
```tsx
// 4-column KPI cards
grid gap-4 md:grid-cols-2 lg:grid-cols-4

// 3-column content
grid gap-4 md:grid-cols-2 lg:grid-cols-3

// 2-column forms
grid gap-4 md:grid-cols-2

// Full-width mobile, 2-col tablet+
grid gap-4 sm:grid-cols-2
```

### Visibility Classes
```tsx
hidden md:block      // Hide on mobile, show on tablet+
md:hidden            // Show on mobile, hide on tablet+
lg:flex              // Flex on large screens
```

---

## 🎭 Animation Standards

### Transitions
```tsx
// Default (buttons, hover states)
transition-colors duration-200

// Smooth (custom utility)
transition-smooth  // 300ms cubic-bezier(0.4, 0, 0.2, 1)

// Spring (custom utility)
transition-spring  // 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Hover Effects
```tsx
// Cards
hover:shadow-md transition-shadow

// Buttons
hover:bg-primary/90 transition-colors

// Links
hover:underline transition-all
```

---

## ✅ Quality Checklist

### Before Committing
- [ ] Page uses `gap-6` for main container
- [ ] Search bar is `w-[300px]`
- [ ] All buttons have `gap-2` for icon spacing
- [ ] Action buttons (primary) are `h-10`
- [ ] Table action buttons are `h-8 w-8`
- [ ] Cards use `rounded-2xl`
- [ ] Typography follows scale
- [ ] Colors match status meanings
- [ ] Spacing is consistent
- [ ] Responsive on all screens
- [ ] Accessible (keyboard, screen readers)

---

## 🎯 Common Patterns

### Empty State
```tsx
<TableRow>
  <TableCell colSpan={columns} className="text-center py-8 text-muted-foreground">
    No items found
  </TableCell>
</TableRow>
```

### Loading State
```tsx
<div className="flex items-center justify-center py-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
</div>
```

### Error State
```tsx
<div className="flex items-center gap-2 text-destructive">
  <AlertCircle className="h-4 w-4" />
  <span className="text-sm">Error message here</span>
</div>
```

---

## 📖 References

- **Design System**: `/UI_DESIGN_SYSTEM.md`
- **Consistency Report**: `/UI_CONSISTENCY_REPORT.md`
- **Tailwind Config**: `/tailwind.config.ts`
- **Global Styles**: `/app/globals.css`

---

*This guide ensures pixel-perfect consistency across the entire EYECARE CRM application.*
