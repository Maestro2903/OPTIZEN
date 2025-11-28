# Print Feature - Quick Test Guide

## One-Minute Test

```
1. npm run dev (if not already running)
2. Navigate to Cases page
3. Click any case's "Print Case" button
4. Modal appears with "Print" button
5. Click "Print"
6. Browser print dialog opens
7. ✅ SHOULD SEE: Full case document in preview (not blank)
8. Click "Cancel" to close
```

**Result**: 
- ✅ If you see the case content in the preview → WORKING
- ❌ If preview is blank → See troubleshooting below

---

## Troubleshooting (2 Minutes)

### Issue: Print Preview is Blank

**Step 1: Clear Cache**
```bash
# Press in browser:
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)

# Select "All time", check "Cached images and files"
# Click Clear data
```

**Step 2: Hard Refresh**
```bash
# In browser on the page:
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Step 3: Restart Dev Server**
```bash
# In terminal:
Ctrl+C (stop server)
npm run dev (restart)
```

**Step 4: Test Again**
- Go back to Cases
- Click Print Case
- Click Print button
- Check preview

---

## Inspect Element (5 Minutes)

If still blank, open browser DevTools:

```
1. Press F12 (DevTools opens)
2. Click "Print Preview" button in print dialog
3. In DevTools Console tab, run:

// Check if elements exist
console.log('Overlay:', document.querySelector('.print-overlay'))
console.log('Paper:', document.querySelector('.print-modal-paper'))

// Check computed styles
var overlay = document.querySelector('.print-overlay')
console.log('Overlay display:', getComputedStyle(overlay).display)
console.log('Overlay visibility:', getComputedStyle(overlay).visibility)
```

**Expected Output:**
```
Overlay: <div class="print-overlay fixed inset-0 ...">
Paper: <div class="relative bg-white ... print-modal-paper">

Overlay display: block
Overlay visibility: visible
```

If any show `none` or `hidden` → CSS is being overridden

---

## CSS File Check (3 Minutes)

```bash
# From project root:
grep -n "\.print-overlay" styles/print.css

# Should show multiple matches:
# 20:  .print-overlay {
# 35:  .print-overlay * {
# 56:  ... :not(.print-overlay),
# etc.
```

If no matches or very few → CSS file wasn't updated correctly

---

## Key CSS Rules to Verify

Open `styles/print.css` and search for these (Ctrl+F):

1. **`body > * { display: none !important }`**
   - Line ~15, hides all content

2. **`.print-overlay { display: block !important }`**
   - Line ~20, shows our modal

3. **`[class*="overlay"]:not(.print-overlay)`**
   - Lines ~56-64, excludes our modal from generic hiding

4. **`.print-modal-paper { display: block !important }`**
   - Line ~103, shows the A4 paper

All should be inside `@media print { ... }`

---

## Browser Console Commands (for testing)

```javascript
// Test 1: Check if print styles apply
const style = window.getComputedStyle(
  document.querySelector('.print-overlay')
)
console.log('Is visible:', style.display !== 'none' && style.visibility !== 'hidden')

// Test 2: List all CSS rules from print.css
document.styleSheets.forEach(sheet => {
  if(sheet.href?.includes('print.css') || sheet.href?.includes('_app')) {
    console.log('Sheet:', sheet.href)
    try {
      Array.from(sheet.cssRules).slice(0, 5).forEach(rule => {
        console.log(rule.cssText.substring(0, 50))
      })
    } catch(e) { console.log('Cannot access rules') }
  }
})

// Test 3: Manually trigger print preview
window.print()
```

---

## Common Fixes Summary

| Symptom | Fix | Time |
|---------|-----|------|
| Blank preview | Clear cache + hard refresh | 30 sec |
| Only header shows | Check `overflow: visible` on `.print-modal-paper` | 1 min |
| Buttons visible | Add `print:hidden` to button divs | 1 min |
| Content cut off | Add `break-inside-avoid` to sections | 2 min |
| UUID showing | Hard refresh browser | 30 sec |

---

## Browser-Specific Notes

**Chrome/Edge (Recommended)**
```
Works best, full @media print support
→ Use this to test first
```

**Firefox**
```
Good support, may look slightly different
→ Secondary test browser
```

**Safari**
```
May need manual webkit prefixes
→ Test if Chrome/Firefox work first
```

---

## Final Checklist

Before reporting an issue, confirm:

- [ ] Browser cache cleared
- [ ] Page hard-refreshed  
- [ ] Dev server restarted
- [ ] Using Chrome/Chromium (most compatible)
- [ ] Files checked:
  - [ ] `components/print/print-modal-shell.tsx` has `print-overlay` class
  - [ ] `styles/print.css` has print media queries
  - [ ] `components/print/case-print.tsx` has `break-inside-avoid`
- [ ] Browser console shows no errors (F12 → Console tab)
- [ ] Tested multiple times (might need cache to fully clear)

---

## Success Indicators

✅ Print dialog opens
✅ Preview is NOT blank
✅ Document shows case header
✅ Patient name visible
✅ Tables visible with data
✅ No UI buttons visible in preview
✅ All pages visible in preview
✅ Saving to PDF works
✅ Printing to printer works

---

## Need Help?

1. Run through this checklist
2. Check PRINT_DEBUG.md for detailed CSS info
3. See PRINT_FIX_SUMMARY.md for architecture overview
4. Check browser console for errors (F12)
5. If still stuck, provide:
   - Browser + version
   - Screenshot of print preview (blank or showing content)
   - Output of console commands above
