import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const goToFirstPage = () => onPageChange(1)
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1))
  const goToNextPage = () => {
    if (totalPages > 0) {
      onPageChange(Math.min(totalPages, currentPage + 1))
    }
  }
  const goToLastPage = () => {
    if (totalPages > 0) {
      onPageChange(totalPages)
    }
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4", className)}>
      {/* Left side - Showing text and Rows per page */}
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{startItem}</span> to{" "}
          <span className="font-medium text-gray-900">{endItem}</span> of{" "}
          <span className="font-medium text-gray-900">{totalItems}</span>
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">Rows per page:</p>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-md border-gray-300 bg-white text-sm">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Right side - Pagination controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white border-gray-300 rounded-md hover:bg-gray-50"
          onClick={goToFirstPage}
          disabled={!canGoPrevious}
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white border-gray-300 rounded-md hover:bg-gray-50"
          onClick={goToPreviousPage}
          disabled={!canGoPrevious}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center px-3">
          <p className="text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white border-gray-300 rounded-md hover:bg-gray-50"
          onClick={goToNextPage}
          disabled={!canGoNext}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white border-gray-300 rounded-md hover:bg-gray-50"
          onClick={goToLastPage}
          disabled={!canGoNext}
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
