"use client"

import * as React from "react"
import { Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

export interface DataGridColumn<T = any> {
  key: string
  header: string
  width?: string
  className?: string
  render?: (item: T, index: number) => React.ReactNode
}

export interface DataGridAction<T = any> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (item: T) => void
  variant?: "default" | "destructive"
}

interface DataGridProps<T = any> {
  data: T[]
  columns: DataGridColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  actions?: DataGridAction<T>[]
  rowKey?: (item: T) => string
  className?: string
}

export function DataGrid<T extends { id: string; name: string; is_active?: boolean; sort_order?: number }>({
  data,
  columns,
  loading,
  emptyMessage = "No data found",
  emptyDescription = "Get started by adding a new item",
  onEdit,
  onDelete,
  actions,
  rowKey = (item) => item.id,
  className
}: DataGridProps<T>) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingValue, setEditingValue] = React.useState("")
  const [deletingItem, setDeletingItem] = React.useState<T | null>(null)

  const handleStartEdit = (item: T) => {
    setEditingId(item.id)
    setEditingValue(item.name)
  }

  const handleSaveEdit = (item: T) => {
    if (editingValue.trim() && onEdit) {
      onEdit({ ...item, name: editingValue.trim() } as T)
    }
    setEditingId(null)
    setEditingValue("")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingValue("")
  }

  const handleDeleteClick = (item: T) => {
    setDeletingItem(item)
  }

  const confirmDelete = () => {
    if (deletingItem && onDelete) {
      onDelete(deletingItem)
      setDeletingItem(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-muted-foreground">{emptyMessage}</h3>
          <p className="text-sm text-muted-foreground/70">{emptyDescription}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="grid grid-cols-[50px_1fr_100px_100px_80px] gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
        <div>No.</div>
        <div>Name</div>
        <div>Status</div>
        <div>Sort Order</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {data.map((item, index) => {
          const isEditing = editingId === item.id

          return (
            <div
              key={rowKey(item)}
              className="grid grid-cols-[50px_1fr_100px_100px_80px] gap-4 px-4 py-3 items-center hover:bg-muted/30 rounded-lg transition-colors group"
            >
              {/* Serial Number */}
              <div className="text-sm text-muted-foreground">
                {index + 1}
              </div>

              {/* Name with inline editing */}
              <div className="flex items-center gap-2 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(item)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(item)}
                      disabled={!editingValue.trim()}
                      className="h-8"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium truncate">{item.name}</span>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(item)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Status */}
              <div>
                {item.is_active !== undefined && (
                  <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                    {item.is_active ? "Active" : "Inactive"}
                  </Badge>
                )}
              </div>

              {/* Sort Order */}
              <div className="text-sm text-muted-foreground">
                {item.sort_order || "-"}
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                {(onDelete || actions) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => handleStartEdit(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {actions?.map((action, i) => {
                        const ActionIcon = action.icon
                        return (
                          <DropdownMenuItem 
                            key={i}
                            onClick={() => action.onClick(item)}
                            className={action.variant === "destructive" ? "text-destructive" : ""}
                          >
                            {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                            {action.label}
                          </DropdownMenuItem>
                        )
                      })}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(item)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete Item"
        description={deletingItem ? `Are you sure you want to delete "${deletingItem.name}"? This action cannot be undone.` : ""}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

