# Import Conventions

This document outlines the standard import order and conventions for the EYECARE codebase.

## Import Order

Imports should be organized in the following order:

1. **React and Next.js imports**
   ```typescript
   import * as React from "react"
   import { useRouter } from "next/navigation"
   import Link from "next/link"
   ```

2. **Third-party libraries**
   ```typescript
   import { useForm } from "react-hook-form"
   import { zodResolver } from "@hookform/resolvers/zod"
   import * as z from "zod"
   import { Button } from "lucide-react"
   ```

3. **Internal utilities and types**
   ```typescript
   import { cn } from "@/lib/utils"
   import { useToast } from "@/hooks/use-toast"
   import { type Patient } from "@/lib/services/api"
   ```

4. **Components**
   ```typescript
   import { Button } from "@/components/ui/button"
   import { CaseForm } from "@/components/forms/case-form"
   import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
   ```

5. **Styles (if any)**
   ```typescript
   import "@/styles/print.css"
   ```

## Component Import Paths

With the new component organization, use these paths:

- **Forms**: `@/components/forms/[component-name]`
- **Dialogs**: `@/components/dialogs/[component-name]`
- **Print**: `@/components/print/[component-name]`
- **Features**: `@/components/features/[feature]/[component-name]`
- **Shared**: `@/components/shared/[component-name]`
- **UI**: `@/components/ui/[component-name]`
- **Layout**: `@/components/layout/[component-name]`

## Barrel Exports

You can also use the barrel export for cleaner imports:

```typescript
import { CaseForm, DeleteConfirmDialog, CasePrint } from "@/components"
```

## Best Practices

1. Use absolute imports with `@/` alias
2. Group imports by category with blank lines between groups
3. Sort imports alphabetically within each group
4. Use type imports when importing only types: `import { type Patient } from "..."`
5. Prefer named exports over default exports for better tree-shaking

## ESLint Configuration

Consider adding an ESLint plugin like `eslint-plugin-import` to enforce these conventions automatically:

```json
{
  "extends": ["plugin:import/recommended", "plugin:import/typescript"],
  "rules": {
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ]
  }
}
```




































