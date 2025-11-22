"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

interface DeleteConfirmDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void | Promise<void>
}

export const DeleteConfirmDialog = React.forwardRef<HTMLDivElement, DeleteConfirmDialogProps>(
  function DeleteConfirmDialog({
    children,
    open: controlledOpen,
    onOpenChange,
    title,
    description,
    onConfirm,
  }, ref) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await onConfirm()
      // Only close dialog on success
      setOpen(false)
    } catch (err) {
      // Keep dialog open on error so user can see the error message
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Reset error state when dialog closes
    if (!newOpen) {
      setError(null)
      setIsLoading(false)
    }
    setOpen(newOpen)
  }
  
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {error && (
            <div className="mt-2 text-sm text-destructive font-medium">
              {error}
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
  }
)

