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
      {/* Fixed Overlay - Dark Background - Enhanced Print Support */}
      {/* Added id="print-portal" for CSS targeting */}
      <div 
        id="print-portal"
        className="print-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/90 backdrop-blur-sm p-8 
          print:p-0 print:m-0 print:fixed print:inset-0 print:bg-white print:z-[10000] print:overflow-visible print:h-auto print:flex print:items-start print:justify-start"
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

        {/* A4 Paper (The Document) - Enhanced for printing */}
        <div className="relative bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[20mm] mx-auto print:absolute print:top-0 print:left-0 print:shadow-none print:w-full print:min-h-screen print:p-[20mm] print:mx-0 print:rounded-none print-modal-paper">
          {children}
        </div>
      </div>

      {/* Enhanced Print Styles - Minimal, letting globals.css handle heavy lifting */}
      <style jsx global>{`
        @media screen {
          .print-overlay {
            background: rgba(17, 24, 39, 0.9);
            backdrop-filter: blur(12px);
          }
          
          .print-modal-paper {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </>
  )
}


