"use client"

import * as React from "react"
import { Plus, Database, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { useMasterData } from "@/contexts/master-data-context"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

// Helper component for rendering a category tab
function CategoryTab({ 
  category, 
  title, 
  data, 
  onAdd, 
  onDelete 
}: { 
  category: string
  title: string
  data: string[]
  onAdd: (value: string) => void
  onDelete: (value: string) => void
}) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(50)
  
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return data
    const q = searchTerm.trim().toLowerCase()
    return data.filter(item => item.toLowerCase().includes(q))
  }, [data, searchTerm])

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input 
            placeholder={`Search ${title.toLowerCase()}...`} 
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="text-sm text-muted-foreground">
            Total: {filteredData.length} items
          </div>
        </div>
        <MasterDataForm 
          title={title} 
          fieldLabel={`${title} Name`}
          onSubmit={onAdd}
        >
          <Button size="sm" className="gap-2">
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
              <TableHead>ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No {title.toLowerCase()} found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow key={`${category}-${index}`}>
                  <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell className="font-medium">{item}</TableCell>
                  <TableCell>
                    <DeleteConfirmDialog
                      title={`Delete ${title}`}
                      description={`Are you sure you want to delete "${item}"? This action cannot be undone.`}
                      onConfirm={() => onDelete(item)}
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredData.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setCurrentPage(1)
        }}
      />
    </div>
  )
}

export default function MasterDataPage() {
  const { masterData, addItem, deleteItem } = useMasterData()
  const { toast } = useToast()

  const handleAdd = (category: keyof typeof masterData, value: string) => {
    addItem(category, value)
    toast({
      title: "Item Added",
      description: `${value} has been added successfully.`,
    })
  }

  const handleDelete = (category: keyof typeof masterData, value: string) => {
    deleteItem(category, value)
    toast({
      title: "Item Deleted",
      description: `${value} has been deleted successfully.`,
      variant: "destructive",
    })
  }

  // Category configurations
  const categories = [
    { key: 'complaints' as const, label: 'Complaints', title: 'Complaint' },
    { key: 'treatments' as const, label: 'Treatments', title: 'Treatment' },
    { key: 'medicines' as const, label: 'Medicines', title: 'Medicine' },
    { key: 'surgeries' as const, label: 'Surgeries', title: 'Surgery' },
    { key: 'diagnosticTests' as const, label: 'Tests', title: 'Test' },
    { key: 'eyeConditions' as const, label: 'Conditions', title: 'Eye Condition' },
    { key: 'visualAcuity' as const, label: 'Vision', title: 'Visual Acuity' },
    { key: 'bloodTests' as const, label: 'Blood Tests', title: 'Blood Test' },
    { key: 'diagnosis' as const, label: 'Diagnosis', title: 'Diagnosis' },
    { key: 'dosages' as const, label: 'Dosages', title: 'Dosage' },
    { key: 'routes' as const, label: 'Routes', title: 'Route' },
    { key: 'eyeSelection' as const, label: 'Eye Options', title: 'Eye Option' },
    { key: 'visitTypes' as const, label: 'Visit Types', title: 'Visit Type' },
    { key: 'sacStatus' as const, label: 'SAC Status', title: 'SAC Status' },
    { key: 'iopRanges' as const, label: 'IOP Ranges', title: 'IOP Range' },
    { key: 'lensOptions' as const, label: 'Lens', title: 'Lens Option' },
    { key: 'paymentMethods' as const, label: 'Payment', title: 'Payment Method' },
    { key: 'insuranceProviders' as const, label: 'Insurance', title: 'Insurance Provider' },
  ]

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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{masterData.complaints.length}</div>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medicines</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{masterData.medicines.length}</div>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surgeries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{masterData.surgeries.length}</div>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">categories</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Data Management</CardTitle>
          <CardDescription>{categories.length} categories for all case form dropdowns</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="complaints" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
              {categories.slice(0, 6).map(cat => (
                <TabsTrigger key={cat.key} value={cat.key}>{cat.label}</TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 mt-2">
              {categories.slice(6, 12).map(cat => (
                <TabsTrigger key={cat.key} value={cat.key}>{cat.label}</TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 mt-2">
              {categories.slice(12).map(cat => (
                <TabsTrigger key={cat.key} value={cat.key}>{cat.label}</TabsTrigger>
              ))}
            </TabsList>

            {categories.map(cat => (
              <TabsContent key={cat.key} value={cat.key}>
                <CategoryTab
                  category={cat.key}
                  title={cat.title}
                  data={masterData[cat.key]}
                  onAdd={(value) => handleAdd(cat.key, value)}
                  onDelete={(value) => handleDelete(cat.key, value)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
