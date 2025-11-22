"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader, PrintSection, PrintFooter } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"

interface PharmacyPrintProps {
  pharmacy: {
    id: string
    name: string
    generic_name?: string
    manufacturer?: string
    category: string
    unit_price: number
    mrp: number
    stock_quantity: number
    reorder_level: number
    batch_number?: string
    expiry_date?: string
    description?: string
    storage_instructions?: string
    hsn_code?: string
    supplier?: string
  }
  children: React.ReactNode
}

export function PharmacyPrint({ pharmacy, children }: PharmacyPrintProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Calculate total stock value
  const totalStockValue = pharmacy.stock_quantity * pharmacy.unit_price

  // Check if expiry is near (within 30 days)
  const isExpiringSoon = pharmacy.expiry_date && 
    new Date(pharmacy.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const stockTitle = `Stock_Report_${pharmacy.name.replace(/\s+/g, '_')}`

  const modalContent = (
    <PrintModalShell
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={stockTitle}
    >
      {/* Header */}
      <PrintHeader />
      
      {/* Document Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide">PHARMACY STOCK REPORT</h1>
      </div>

      <div className="space-y-6">
        {/* Product Identity (The 'Hero' Block) */}
        <PrintSection title="PRODUCT DETAILS">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xl font-bold mb-2">
                {pharmacy.name}
              </div>
              {pharmacy.generic_name && (
                <div className="text-sm italic text-gray-600">
                  {pharmacy.generic_name}
                </div>
              )}
            </div>
            <div className="text-right space-y-2">
              {pharmacy.manufacturer && (
                <div>
                  <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Manufacturer</div>
                  <div className="text-sm font-medium">{pharmacy.manufacturer}</div>
                </div>
              )}
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Category</div>
                <div className="text-sm font-medium">{pharmacy.category}</div>
              </div>
            </div>
          </div>
        </PrintSection>

        {/* Inventory Status (The 'Metrics' Block) */}
        <PrintSection title="INVENTORY STATUS">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 py-2 px-3 text-left text-xs font-bold uppercase">Current Stock</th>
                <th className="border border-gray-300 py-2 px-3 text-left text-xs font-bold uppercase">Reorder Level</th>
                <th className="border border-gray-300 py-2 px-3 text-left text-xs font-bold uppercase">Batch No</th>
                <th className="border border-gray-300 py-2 px-3 text-left text-xs font-bold uppercase">Expiry</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 py-3 px-3 font-bold text-lg">
                  {pharmacy.stock_quantity}
                </td>
                <td className="border border-gray-300 py-3 px-3">
                  {pharmacy.reorder_level}
                </td>
                <td className="border border-gray-300 py-3 px-3 font-mono text-sm">
                  {pharmacy.batch_number || 'N/A'}
                </td>
                <td className={`border border-gray-300 py-3 px-3 font-bold ${isExpiringSoon ? 'text-red-600' : ''}`}>
                  {formatDate(pharmacy.expiry_date)}
                </td>
              </tr>
            </tbody>
          </table>
        </PrintSection>

        {/* Financials (The 'Cost' Block) */}
        <PrintSection title="PRICING INFORMATION">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Unit Price (Cost)</div>
              <div className="text-lg font-bold tabular-nums">
                {formatCurrency(pharmacy.unit_price)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400 font-semibold mb-1">MRP (Retail)</div>
              <div className="text-lg font-bold tabular-nums">
                {formatCurrency(pharmacy.mrp)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Total Stock Value</div>
              <div className="text-lg font-bold tabular-nums text-blue-600">
                {formatCurrency(totalStockValue)}
              </div>
            </div>
          </div>
        </PrintSection>

        {/* Shelf/Storage Info */}
        <PrintSection title="STORAGE & HANDLING">
          <div className="space-y-3">
            <div>
              <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Location</div>
              <div className="text-sm font-medium">Main Pharmacy</div>
            </div>
            {pharmacy.storage_instructions && (
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Storage Instructions</div>
                <div className="text-sm">{pharmacy.storage_instructions}</div>
              </div>
            )}
            {pharmacy.description && (
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Description / Notes</div>
                <div className="text-sm whitespace-pre-wrap">{pharmacy.description}</div>
              </div>
            )}
            {pharmacy.supplier && (
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Supplier</div>
                <div className="text-sm">{pharmacy.supplier}</div>
              </div>
            )}
            {pharmacy.hsn_code && (
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-1">HSN Code</div>
                <div className="text-sm font-mono">{pharmacy.hsn_code}</div>
              </div>
            )}
          </div>
        </PrintSection>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-end">
            <div className="text-xs text-gray-600">
              Generated by: Inventory Manager
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 mb-1">Verified By:</div>
              <div className="h-12 border-b border-black w-48"></div>
            </div>
          </div>
        </div>

        {/* Print Footer with Timestamp */}
        <PrintFooter showTimestamp={true} />
      </div>
    </PrintModalShell>
  )

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}