"use client"

import * as React from "react"
import { Plus, Database, Trash2, Search, Filter, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MasterDataForm } from "@/components/master-data-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { masterDataApi, type MasterDataItem, type MasterDataFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

// Helper component for rendering a category tab
function CategoryTab({
  category,
  title,
  items,
  onAdd,
  onUpdate,
  onDelete,
  loading
}: {
  category: string
  title: string
  items: MasterDataItem[]
  onAdd: (data: any) => void
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
  loading: boolean
}) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [editingItem, setEditingItem] = React.useState<MasterDataItem | null>(null)
  const [editingName, setEditingName] = React.useState("")

  const filteredItems = React.useMemo(() => {
    if (!searchTerm.trim()) return items
    const q = searchTerm.trim().toLowerCase()
    return items.filter(item => item.name.toLowerCase().includes(q))
  }, [items, searchTerm])

  const handleEdit = (item: MasterDataItem) => {
    // Cancel any existing edit first to ensure only one item is edited at a time
    if (editingItem && editingItem.id !== item.id) {
      handleCancelEdit()
    }
    setEditingItem(item)
    setEditingName(item.name)
  }

  const handleSaveEdit = () => {
    if (!editingItem || !editingName.trim()) return

    const trimmedName = editingName.trim()
    
    // Validate name length
    if (trimmedName.length < 2) {
      // TODO: Show validation error toast/message
      console.error("Name must be at least 2 characters")
      return
    }
    
    if (trimmedName.length > 100) {
      // TODO: Show validation error toast/message
      console.error("Name must not exceed 100 characters")
      return
    }
    
    // Validate allowed characters (alphanumeric, spaces, hyphens, underscores)
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/
    if (!nameRegex.test(trimmedName)) {
      // TODO: Show validation error toast/message
      console.error("Name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed")
      return
    }
    
    // Check for duplicates (case-insensitive)
    const isDuplicate = items.some(item => 
      item.id !== editingItem.id && 
      item.name.toLowerCase() === trimmedName.toLowerCase()
    )
    
    if (isDuplicate) {
      // TODO: Show validation error toast/message
      console.error("An item with this name already exists")
      return
    }
    
    // All validations passed, update the item
    onUpdate(editingItem.id, {
      name: trimmedName,
      description: editingItem.description
    })
    setEditingItem(null)
    setEditingName("")
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditingName("")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Filter current page...`}
              className="pl-8 max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              aria-label="Filter items on current page"
              title="Filter items shown on this page only"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {filteredItems.length} items
          </div>
        </div>
        <MasterDataForm
          title={title}
          fieldLabel={`${title} Name`}
          onSubmit={(data) => onAdd({
            category,
            name: data.name,
            description: data.description,
            is_active: true,
            // Backend computes sort_order = MAX(sort_order) + 1 for correct ordering
            metadata: {}
          })}
        >
          <Button size="sm" className="gap-2" disabled={loading}>
            <Plus className="h-4 w-4" />
            Add {title}
          </Button>
        </MasterDataForm>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SR. NO.</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>SORT ORDER</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading {title.toLowerCase()}...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No {title.toLowerCase()} found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {editingItem?.id === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                        />
                        <Button size="sm" onClick={handleSaveEdit} disabled={!editingName.trim()}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-6 w-6 p-0"
                          title="Edit item"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.sort_order}</TableCell>
                  <TableCell>
                    <DeleteConfirmDialog
                      title={`Delete ${title}`}
                      description={`Are you sure you want to delete "${item.name}"? This action cannot be undone.`}
                      onConfirm={() => onDelete(item.id)}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeleteConfirmDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function MasterDataPage() {
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(50)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("complaints")
  const [categories, setCategories] = React.useState<Record<string, number>>({})

  // API hooks
  const {
    data: items,
    loading,
    error,
    pagination,
    search,
    filter,
    changePage,
    changePageSize,
    addItem: addMasterItem,
    updateItem: updateMasterItem,
    removeItem: removeMasterItem,
    refresh
  } = useApiList<MasterDataItem>(masterDataApi.list, {
    page: currentPage,
    limit: pageSize,
    category: activeCategory,
    active_only: false
  })

  const { submitForm: createItem, loading: createLoading } = useApiForm<MasterDataItem>()
  const { submitForm: updateItem, loading: updateLoading } = useApiForm<MasterDataItem>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  // Load categories on mount
  React.useEffect(() => {
    const loadCategories = async () => {
      const response = await masterDataApi.getCategories()
      if (response.success && response.data) {
        setCategories(response.data)
      }
    }
    loadCategories()
  }, [])

  // Handle category change
  React.useEffect(() => {
    filter({ category: activeCategory })
  }, [activeCategory, filter])

  // Handle search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm.trim())
      } else {
        search("")
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, search])

  // Handle page changes
  React.useEffect(() => {
    changePage(currentPage)
  }, [currentPage, changePage])

  React.useEffect(() => {
    changePageSize(pageSize)
  }, [pageSize, changePageSize])

  const handleAdd = async (data: any) => {
    try {
      const result = await createItem(
        () => masterDataApi.create(data),
        {
          successMessage: `${data.name} has been added successfully.`,
          onSuccess: (newItem) => {
            addMasterItem(newItem)
            // Refresh categories count
            setCategories(prev => ({
              ...prev,
              [data.category]: (prev[data.category] || 0) + 1
            }))
          }
        }
      )
    } catch (error) {
      console.error('Error creating master data item:', error)
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      const result = await updateItem(
        () => masterDataApi.update(id, data),
        {
          successMessage: "Item updated successfully.",
          onSuccess: (updatedItem) => {
            updateMasterItem(id, updatedItem)
          }
        }
      )
    } catch (error) {
      console.error('Error updating master data item:', error)
    }
  }

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    const success = await deleteItem(
      () => masterDataApi.delete(id),
      {
        successMessage: `${item.name} has been deleted successfully.`,
        onSuccess: () => {
          removeMasterItem(id)
          // Refresh categories count
          setCategories(prev => ({
            ...prev,
            [item.category]: Math.max((prev[item.category] || 0) - 1, 0)
          }))
        }
      }
    )
  }

  // Category configurations
  const categoryConfigs = [
    { key: 'complaints', label: 'Complaints', title: 'Complaint' },
    { key: 'treatments', label: 'Treatments', title: 'Treatment' },
    { key: 'medicines', label: 'Medicines', title: 'Medicine' },
    { key: 'surgeries', label: 'Surgeries', title: 'Surgery' },
    { key: 'surgery_types', label: 'Surgery Types', title: 'Surgery Type' },
    { key: 'diagnostic_tests', label: 'Tests', title: 'Test' },
    { key: 'eye_conditions', label: 'Conditions', title: 'Eye Condition' },
    { key: 'visual_acuity', label: 'Vision', title: 'Visual Acuity' },
    { key: 'blood_tests', label: 'Blood Tests', title: 'Blood Test' },
    { key: 'diagnosis', label: 'Diagnosis', title: 'Diagnosis' },
    { key: 'dosages', label: 'Dosages', title: 'Dosage' },
    { key: 'routes', label: 'Routes', title: 'Route' },
    { key: 'eye_selection', label: 'Eye Options', title: 'Eye Option' },
    { key: 'visit_types', label: 'Visit Types', title: 'Visit Type' },
    { key: 'sac_status', label: 'SAC Status', title: 'SAC Status' },
    { key: 'iop_ranges', label: 'IOP Ranges', title: 'IOP Range' },
    { key: 'iop_methods', label: 'IOP Methods', title: 'IOP Method' },
    { key: 'fundus_findings', label: 'Fundus Findings', title: 'Fundus Finding' },
    { key: 'cornea_findings', label: 'Cornea Findings', title: 'Cornea Finding' },
    { key: 'conjunctiva_findings', label: 'Conjunctiva', title: 'Conjunctiva Finding' },
    { key: 'iris_findings', label: 'Iris Findings', title: 'Iris Finding' },
    { key: 'anterior_segment_findings', label: 'Anterior Segment', title: 'Anterior Segment Finding' },
    { key: 'lens_options', label: 'Lens', title: 'Lens Option' },
    { key: 'payment_methods', label: 'Payment', title: 'Payment Method' },
    { key: 'insurance_providers', label: 'Insurance', title: 'Insurance Provider' },
    { key: 'roles', label: 'Roles', title: 'Role' },
    { key: 'room_types', label: 'Room Types', title: 'Room Type' },
    { key: 'expense_categories', label: 'Expense Categories', title: 'Expense Category' },
  ]

  const currentCategoryConfig = categoryConfigs.find(cat => cat.key === activeCategory) || categoryConfigs[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
          <p className="text-muted-foreground">
            Manage all dropdown options for the system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Master Data Management</CardTitle>
              <CardDescription>{categoryConfigs.length} categories for all case form dropdowns</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search all items..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                  aria-label="Search all items across pages"
                  title="Search across all master data items"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
              {categoryConfigs.slice(0, 6).map(cat => (
                <TabsTrigger key={cat.key} value={cat.key}>
                  {cat.label}
                  {categories[cat.key] && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {categories[cat.key]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 mt-2">
              {categoryConfigs.slice(6, 12).map(cat => (
                <TabsTrigger key={cat.key} value={cat.key}>
                  {cat.label}
                  {categories[cat.key] && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {categories[cat.key]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 mt-2">
              {categoryConfigs.slice(12, 18).map(cat => (
                <TabsTrigger key={cat.key} value={cat.key}>
                  {cat.label}
                  {categories[cat.key] && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {categories[cat.key]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 mt-2">
              {categoryConfigs.slice(18, 24).map(cat => (
                <TabsTrigger key={cat.key} value={cat.key}>
                  {cat.label}
                  {categories[cat.key] && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {categories[cat.key]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {categoryConfigs.length > 24 && (
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 mt-2">
                {categoryConfigs.slice(24).map(cat => (
                  <TabsTrigger key={cat.key} value={cat.key}>
                    {cat.label}
                    {categories[cat.key] && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {categories[cat.key]}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            {categoryConfigs.map(cat => (
              <TabsContent key={cat.key} value={cat.key}>
                <CategoryTab
                  category={cat.key}
                  title={cat.title}
                  items={items || []}
                  onAdd={handleAdd}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  loading={loading}
                />
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-6">
            <Pagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 0}
              pageSize={pagination?.limit || 50}
              totalItems={pagination?.total || 0}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
