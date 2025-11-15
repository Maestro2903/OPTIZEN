"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  Stethoscope,
  Pill,
  Eye,
  Users,
  Building2,
  DollarSign,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SidebarNav, type SidebarNavGroup } from "@/components/ui/sidebar-nav"
import { DataGrid } from "@/components/ui/data-grid"
import { MasterDataForm } from "@/components/master-data-form"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { masterDataApi, type MasterDataItem, type MasterDataFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { type UserRole, hasPermission } from "@/lib/rbac-client"

export default function MasterDataPage() {
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(100) // Increased default to show more items
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("complaints")
  const [categories, setCategories] = React.useState<Record<string, number>>({})
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [userRole, setUserRole] = React.useState<UserRole | null>(null)
  
  // Fetch user role for permission checks
  React.useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (user) {
          setUserRole(user.role as UserRole)
        }
      }
    }
    
    fetchUserRole()
  }, [])

  // API hooks
  const {
    data: rawItems,
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

  // Flatten hierarchical complaints data if needed
  const items = React.useMemo(() => {
    if (activeCategory === 'complaints' && rawItems) {
      // Check if data is hierarchical (has children property)
      const isHierarchical = rawItems.some((item: any) => 'children' in item)
      
      if (isHierarchical) {
        // Flatten: extract all complaint items from categories
        const flattened: MasterDataItem[] = []
        rawItems.forEach((categoryItem: any) => {
          if (categoryItem.children && Array.isArray(categoryItem.children)) {
            categoryItem.children.forEach((child: any, index: number) => {
              flattened.push({
                id: child.id,
                name: child.name,
                description: child.description || '',
                category: 'complaints',
                is_active: child.is_active !== undefined ? child.is_active : true,
                sort_order: child.sort_order || (flattened.length + 1),
                metadata: {
                  parent_category_id: categoryItem.id,
                  parent_category_name: categoryItem.name,
                  ...(child.metadata || {})
                },
                created_at: child.created_at || new Date().toISOString(),
                updated_at: child.updated_at || new Date().toISOString()
              } as MasterDataItem)
            })
          }
        })
        return flattened
      }
    }
    return rawItems
  }, [rawItems, activeCategory])

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
    setCurrentPage(1) // Reset to first page when category changes
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
            // Refresh the list to show the new item
            refresh()
          }
        }
      )
    } catch (error) {
      console.error('Error creating master data item:', error)
      // Error toast is already shown by useApiForm hook
    }
  }

  const handleUpdate = async (item: MasterDataItem) => {
    try {
      const result = await updateItem(
        () => masterDataApi.update(item.id, {
          name: item.name,
          description: item.description
        }),
        {
          successMessage: "Item updated successfully.",
          onSuccess: (updatedItem) => {
            updateMasterItem(item.id, updatedItem)
            // Refresh to ensure data consistency
            refresh()
          }
        }
      )
    } catch (error) {
      console.error('Error updating master data item:', error)
      // Error toast is already shown by useApiForm hook
    }
  }

  const handleDelete = async (item: MasterDataItem) => {
    const success = await deleteItem(
      () => masterDataApi.delete(item.id),
      {
        successMessage: `${item.name} has been deleted successfully.`,
        onSuccess: () => {
          removeMasterItem(item.id)
          // Refresh categories count
          setCategories(prev => ({
            ...prev,
            [item.category]: Math.max((prev[item.category] || 0) - 1, 0)
          }))
          // Refresh the list to reflect the deletion
          refresh()
        }
      }
    )
    
    if (!success) {
      console.error('Delete operation failed for item:', item.name)
    }
  }

  // Category groups configuration
  const categoryGroups: SidebarNavGroup[] = [
    {
      key: 'medical',
      label: 'Medical & Treatment',
      icon: Stethoscope,
      description: 'Core medical treatments and procedures',
      categories: [
        { key: 'treatments', label: 'Treatments', title: 'Treatment', count: categories['treatments'] },
        { key: 'medicines', label: 'Medicines', title: 'Medicine', count: categories['medicines'] },
        { key: 'surgeries', label: 'Surgeries', title: 'Surgery', count: categories['surgeries'] },
        { key: 'surgery_types', label: 'Surgery Types', title: 'Surgery Type', count: categories['surgery_types'] },
        { key: 'diagnostic_tests', label: 'Tests', title: 'Test', count: categories['diagnostic_tests'] },
        { key: 'eye_conditions', label: 'Conditions', title: 'Eye Condition', count: categories['eye_conditions'] },
        { key: 'visual_acuity', label: 'Vision', title: 'Visual Acuity', count: categories['visual_acuity'] },
        { key: 'blood_tests', label: 'Blood Tests', title: 'Blood Test', count: categories['blood_tests'] },
        { key: 'diagnosis', label: 'Diagnosis', title: 'Diagnosis', count: categories['diagnosis'] },
      ]
    },
    {
      key: 'medication',
      label: 'Medication Details',
      icon: Pill,
      description: 'Dosages, routes, and anesthesia',
      categories: [
        { key: 'dosages', label: 'Dosages', title: 'Dosage', count: categories['dosages'] },
        { key: 'routes', label: 'Routes', title: 'Route', count: categories['routes'] },
        { key: 'anesthesia_types', label: 'Anesthesia', title: 'Anesthesia Type', count: categories['anesthesia_types'] },
      ]
    },
    {
      key: 'examination',
      label: 'Eye Examination',
      icon: Eye,
      description: 'Examination findings and assessments',
      categories: [
        { key: 'fundus_findings', label: 'Fundus', title: 'Fundus Finding', count: categories['fundus_findings'] },
        { key: 'cornea_findings', label: 'Cornea', title: 'Cornea Finding', count: categories['cornea_findings'] },
        { key: 'conjunctiva_findings', label: 'Conjunctiva', title: 'Conjunctiva Finding', count: categories['conjunctiva_findings'] },
        { key: 'iris_findings', label: 'Iris', title: 'Iris Finding', count: categories['iris_findings'] },
        { key: 'anterior_segment_findings', label: 'Anterior Segment', title: 'Anterior Segment Finding', count: categories['anterior_segment_findings'] },
        { key: 'lens_options', label: 'Lens', title: 'Lens Option', count: categories['lens_options'] },
      ]
    },
    {
      key: 'patient',
      label: 'Patient Management',
      icon: Users,
      description: 'Complaints, visits, and patient data',
      categories: [
        { key: 'complaints', label: 'Complaints', title: 'Complaint', count: categories['complaints'] },
        { key: 'complaint_categories', label: 'Complaint Categories', title: 'Complaint Category', count: categories['complaint_categories'] },
        { key: 'eye_selection', label: 'Eye Options', title: 'Eye Option', count: categories['eye_selection'] },
        { key: 'visit_types', label: 'Visit Types', title: 'Visit Type', count: categories['visit_types'] },
        { key: 'sac_status', label: 'SAC Status', title: 'SAC Status', count: categories['sac_status'] },
        { key: 'iop_ranges', label: 'IOP Ranges', title: 'IOP Range', count: categories['iop_ranges'] },
        { key: 'iop_methods', label: 'IOP Methods', title: 'IOP Method', count: categories['iop_methods'] },
        { key: 'insurance_providers', label: 'Insurance', title: 'Insurance Provider', count: categories['insurance_providers'] },
      ]
    },
    {
      key: 'facility',
      label: 'Facility & Operations',
      icon: Building2,
      description: 'Beds, rooms, and staff roles',
      categories: [
        { key: 'beds', label: 'Beds', title: 'Bed', count: categories['beds'] },
        { key: 'room_types', label: 'Room Types', title: 'Room Type', count: categories['room_types'] },
        { key: 'roles', label: 'Roles', title: 'Role', count: categories['roles'] },
      ]
    },
    {
      key: 'financial',
      label: 'Financial',
      icon: DollarSign,
      description: 'Payments, revenue, and expenses',
      categories: [
        { key: 'payment_methods', label: 'Payment Methods', title: 'Payment Method', count: categories['payment_methods'] },
        { key: 'payment_statuses', label: 'Payment Status', title: 'Payment Status', count: categories['payment_statuses'] },
        { key: 'revenue_types', label: 'Revenue Types', title: 'Revenue Type', count: categories['revenue_types'] },
        { key: 'expense_categories', label: 'Expense Categories', title: 'Expense Category', count: categories['expense_categories'] },
        { key: 'pharmacy_categories', label: 'Pharmacy Categories', title: 'Pharmacy Category', count: categories['pharmacy_categories'] },
        { key: 'color_vision_types', label: 'Color Vision', title: 'Color Vision Type', count: categories['color_vision_types'] },
        { key: 'driving_fitness_types', label: 'Driving Fitness', title: 'Driving Fitness Type', count: categories['driving_fitness_types'] },
      ]
    }
  ]

  // Get current category config
  const allCategories = React.useMemo(() => 
    categoryGroups.flatMap(group => group.categories),
    [categoryGroups]
  )

  const currentCategoryConfig = allCategories.find(cat => cat.key === activeCategory)
  
  // Check user permissions
  const canCreate = userRole ? hasPermission(userRole, 'master_data', 'create') : false
  const canEdit = userRole ? hasPermission(userRole, 'master_data', 'edit') : false
  const canDelete = userRole ? hasPermission(userRole, 'master_data', 'delete') : false

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-4 py-4 border-b lg:hidden">
          <h2 className="font-semibold">Categories</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarNav
          groups={categoryGroups}
          activeCategory={activeCategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat)
            setSidebarOpen(false)
          }}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 px-6 py-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {currentCategoryConfig?.title || "Master Data"}
                </h1>
                {currentCategoryConfig?.count !== undefined && (
                  <Badge variant="secondary" className="text-sm">
                    {currentCategoryConfig.count} items
                  </Badge>
                )}
      </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manage {currentCategoryConfig?.label?.toLowerCase() || "master data"} for the system
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search items..."
                  className="pl-9 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </div>

              {canCreate && (
                <MasterDataForm
                  title={currentCategoryConfig?.title || "Item"}
                  fieldLabel={`${currentCategoryConfig?.title || "Item"} Name`}
                  category={activeCategory}
                  onSubmit={(data) => handleAdd({
                    category: activeCategory,
                    name: data.name,
                    description: data.description,
                    bed_number: data.bed_number,
                    is_active: true,
                    metadata: {}
                  })}
                >
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add {currentCategoryConfig?.title || "Item"}
                  </Button>
                </MasterDataForm>
              )}
              {!canCreate && (
                <div className="text-sm text-muted-foreground">
                  View only access
                </div>
              )}
            </div>
                      </div>
                    </div>

        {/* Data Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DataGrid
            data={items || []}
            columns={[]}
            loading={loading}
            emptyMessage={`No ${currentCategoryConfig?.label?.toLowerCase() || "items"} found`}
            emptyDescription={`Get started by adding a new ${currentCategoryConfig?.title?.toLowerCase() || "item"}`}
            onEdit={canEdit ? handleUpdate : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        </div>

        {/* Footer with Pagination */}
        {!loading && items && items.length > 0 && (
          <div className="border-t bg-background px-6 py-3">
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
        )}
      </main>
    </div>
  )
}
