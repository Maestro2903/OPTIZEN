"use client"

import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:flex-col sm:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
            "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
            "data-[swipe=cancel]:translate-x-0",
            "data-[swipe=end]:animate-out data-[swipe=end]:fade-out-80",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
            toast.variant === "destructive"
              ? "bg-red-600 text-white border-red-600"
              : "bg-white border-gray-200"
          )}
          style={{ marginBottom: "0.5rem" }}
        >
          <div className="flex gap-3 items-start">
            {toast.variant === "destructive" ? (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
            )}
            <div className="grid gap-1">
              {toast.title && (
                <div className="text-sm font-semibold">{toast.title}</div>
              )}
              {toast.description && (
                <div className={cn(
                  "text-sm opacity-90",
                  toast.variant === "destructive" ? "text-white" : "text-muted-foreground"
                )}>
                  {toast.description}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100",
              toast.variant === "destructive" ? "text-white" : "text-gray-500"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
