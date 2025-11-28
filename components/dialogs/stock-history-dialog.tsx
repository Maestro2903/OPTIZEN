"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { stockMovementsApi, type StockMovement } from "@/lib/services/api"
import { useApiList } from "@/lib/hooks/useApi"
import { History, ArrowUp, ArrowDown, Package, Calendar, User, FileText } from "lucide-react"
import { format } from "date-fns"

interface StockHistoryDialogProps {
  itemType: 'pharmacy' | 'optical'
  itemId: string
  itemName: string
  children: React.ReactNode
}

const movementTypeLabels = {
  purchase: 'Purchase',
  sale: 'Sale',
  adjustment: 'Adjustment',
  return: 'Return',
  expired: 'Expired',
  damaged: 'Damaged',
}

const movementTypeColors = {
  purchase: 'bg-green-50 text-green-700 border-green-200',
  sale: 'bg-blue-50 text-blue-700 border-blue-200',
  adjustment: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  return: 'bg-purple-50 text-purple-700 border-purple-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  damaged: 'bg-orange-50 text-orange-700 border-orange-200',
}

export function StockHistoryDialog({ itemType, itemId, itemName, children }: StockHistoryDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const {
    data: movements,
    loading,
    error,
    pagination,
    refresh
  } = useApiList<StockMovement>(stockMovementsApi.list, {
    item_type: itemType,
    item_id: itemId,
    limit: 100,
    sortBy: 'movement_date',
    sortOrder: 'desc'
  })

  React.useEffect(() => {
    if (isOpen) {
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Stock History: {itemName}
          </DialogTitle>
          <DialogDescription>
            Complete audit trail of all stock movements for this item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading stock history...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">
              Error loading stock history: {error}
            </div>
          ) : movements.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No stock movements recorded yet
            </div>
          ) : (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      DATE
                    </TableHead>
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      TYPE
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      QUANTITY
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      PRICE
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      STOCK BEFORE
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      STOCK AFTER
                    </TableHead>
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      REFERENCE
                    </TableHead>
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      NOTES
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const isIncrease = movement.movement_type === 'purchase' || 
                                      movement.movement_type === 'return' ||
                                      (movement.movement_type === 'adjustment' && movement.quantity > 0)
                    const isDecrease = movement.movement_type === 'sale' ||
                                      movement.movement_type === 'expired' ||
                                      movement.movement_type === 'damaged' ||
                                      (movement.movement_type === 'adjustment' && movement.quantity < 0)

                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(movement.movement_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              movementTypeColors[movement.movement_type] ||
                              "bg-gray-50 text-gray-700 border border-gray-100"
                            }`}
                          >
                            {movementTypeLabels[movement.movement_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isIncrease ? (
                              <ArrowUp className="h-4 w-4 text-green-600" />
                            ) : isDecrease ? (
                              <ArrowDown className="h-4 w-4 text-red-600" />
                            ) : null}
                            <span className={`text-sm font-bold ${
                              isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {isIncrease ? '+' : ''}{movement.quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-gray-900">
                          {movement.unit_price ? `₹${movement.unit_price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-gray-500">
                          {movement.previous_stock !== null ? movement.previous_stock : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-gray-900 font-bold">
                          {movement.new_stock !== null ? movement.new_stock : '-'}
                        </TableCell>
                        <TableCell>
                          {movement.invoice_id ? (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">Invoice</span>
                            </div>
                          ) : movement.reference_number ? (
                            <span className="text-xs font-mono text-gray-600">{movement.reference_number}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {movement.notes ? (
                            <span className="text-xs text-gray-600">{movement.notes}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

