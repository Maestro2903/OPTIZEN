"use client"

import * as React from "react"
import { X, Printer } from "lucide-react"
import "@/styles/print.css"

interface PrintModalShellProps {
  children: React.ReactNode
  onClose: () => void
  title?: string // Optional document title for the browser tab/filename
  isOpen: boolean
}

export function PrintModalShell({ children, onClose, title, isOpen }: PrintModalShellProps) {
  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handlePrint = () => {
    if (title) {
      document.title = title // Sets filename when saving as PDF
    }
    window.print()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Fixed Overlay - Dark Background */}
      <div 
        className="print-modal-overlay fixed inset-0 bg-gray-900/80 z-50 flex justify-center overflow-y-auto py-10 print:hidden"
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        {/* Floating Controls (Screen Only) */}
        <div className="fixed top-6 right-6 flex gap-3 print:hidden z-50">
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg font-medium shadow-lg hover:bg-gray-50 transition-all"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:bg-blue-700 transition-all shadow-blue-900/20"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        {/* A4 Paper (The Document) */}
        <div className="relative bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[20mm] mx-auto print:shadow-none print:w-full print:min-h-0 print:p-0 print:mx-0 print-modal-paper">
          {children}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Print modal overlay - make visible for print */
          .print-modal-overlay {
            position: static !important;
            background: transparent !important;
            display: block !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            min-height: auto !important;
          }
          
          /* Hide control buttons */
          .print\\:hidden,
          button.print\\:hidden,
          [class*="print:hidden"],
          button[class*="fixed"] {
            display: none !important;
          }
          
          /* Print modal paper - always visible */
          .print-modal-paper {
            width: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            page-break-after: always;
            position: relative !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: white !important;
          }
          
          /* Ensure all content inside paper is visible */
          .print-modal-paper,
          .print-modal-paper * {
            visibility: visible !important;
            opacity: 1 !important;
            display: revert !important;
          }
          
          /* Force color printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Page setup */
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </>
  )
}


