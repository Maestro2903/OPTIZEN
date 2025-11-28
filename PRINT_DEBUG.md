# Print Feature - Debugging Guide

## Issue: Browser Print Dialog Shows Blank Pages

### Root Cause
The print modal's scrollable container was preventing the browser from seeing all content. The modal's overflow and fixed positioning clipped the A4 paper from the printer's perspective.

### Solution Applied

#### 1. **PrintModalShell.tsx** - Enhanced Structure
- Changed main container class to `print-overlay`
- Added print-specific Tailwind utilities
- Removed duplicate print styles (moved to global CSS)

Key classes:
```html
<div className="print-overlay ... print:p-0 print:fixed print:inset-0 print:bg-white">
  <div className="print-modal-paper ... print:absolute print:top-0 print:left-0">
```

#### 2. **styles/print.css** - Critical Global Rules
Added at the top of `@media print`:

```css
/* Reset browser defaults */
html, body {
  height: auto !important;
  overflow: visible !important;
  margin: 0 !important;
  padding: 0 !important;
  background: white !important;
}

/* Hide all content except print overlay */
body > * {
  display: none !important;
}

/* Make print overlay visible */
.print-overlay,
.print-overlay * {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
```

#### 3. **Overlay Selector Exclusions**
Updated generic overlay hiding rules to exclude print overlays:

```css
/* These now exclude .print-overlay */
[class*="overlay"]:not(.certificate-print-overlay):not(.print-overlay) {
  display: none !important;
}
```

---

## Testing the Print Feature

### Step 1: Open Case Print Modal
1. Navigate to Cases page
2. Click "Print Case" on any case
3. Print modal appears with blue "Print" button

### Step 2: Test Print Dialog
1. Click the **Print** button
2. Browser print dialog opens
3. **Check**: Can you see the document preview?

### If Still Blank:

#### A. Check Browser Console (F12)
```javascript
// In console, verify the overlay exists:
console.log(document.querySelector('.print-overlay'))
console.log(document.querySelector('.print-modal-paper'))
```

#### B. Inspect CSS (DevTools)
1. Open Print Preview (Ctrl+Shift+P → "Print Preview")
2. Right-click → Inspect Element
3. Look for `.print-overlay` and `.print-modal-paper`
4. Check "Computed Styles" for:
   - `display: block`
   - `visibility: visible`
   - `opacity: 1`

#### C. Verify CSS File
```bash
# Check if print.css is loaded
grep -n "print-overlay" styles/print.css
grep -n "CRITICAL" styles/print.css
```

---

## CSS Debugging Checklist

- [ ] `.print-overlay` has `display: block !important`
- [ ] `.print-modal-paper` has `display: block !important`
- [ ] `body > *` is hidden (except .print-overlay)
- [ ] No conflicting `[class*="overlay"]:not(...` rules include `.print-overlay`
- [ ] `print.css` is imported in the main layout
- [ ] No `overflow: hidden` on body/html

---

## Print CSS Rule Hierarchy

The global `print.css` is prioritized in this order:

1. **Global resets** (html, body)
2. **Hide all content** (body > *)
3. **Show print overlay** (.print-overlay)
4. **Exclude from generic hiding** (:not(.print-overlay))
5. **Failsafe rules** (at end of @media print)

Each rule uses `!important` to override Tailwind utilities and other styles.

---

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Content still blank | Clear browser cache (Ctrl+Shift+Delete) |
| Only header visible | Check if `.print-modal-paper` has `overflow: hidden` |
| Content cut off | Verify `break-inside-avoid` on sections |
| Buttons still visible | Ensure `print:hidden` utilities are on buttons |
| Wrong background | Verify `background: white !important` in CSS |

---

## Files Modified

1. ✅ `components/print/print-modal-shell.tsx`
   - Updated container class names
   - Removed duplicate print styles
   - Simplified to let global CSS handle it

2. ✅ `styles/print.css`
   - Added global body resets
   - Added print-overlay visibility rules
   - Updated overlay exclusion selectors
   - Added failsafe rules at end

3. ✅ `components/print/case-print.tsx`
   - Added `break-inside-avoid` to all major sections (density pass)
   - Fixed UUID display (patient_name instead of patient_id)
   - Loaded `sacStatus` master data

---

## Next Steps if Still Not Working

1. **Hard refresh browser**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear Next.js cache**: Delete `.next` folder
3. **Restart dev server**: Kill and restart `npm run dev`
4. **Check browser compatibility**: 
   - Chrome/Chromium: Best support
   - Firefox: Good support
   - Safari: Limited CSS media query support
5. **Contact support** with:
   - Browser/version
   - Screenshot of print dialog
   - Browser console errors (F12)
