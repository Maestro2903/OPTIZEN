"use client"

import * as React from "react"
import { Upload, Search, FileText, Calendar, User, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/features/old-patient-records/file-upload"
import { oldPatientRecordsApi, type OldPatientRecord } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function OldPatientRecordsPage() {
  const { toast } = useToast()
  const [oldPatientId, setOldPatientId] = React.useState("")
  const [patientName, setPatientName] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [files, setFiles] = React.useState<File[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [existingRecords, setExistingRecords] = React.useState<OldPatientRecord[]>([])
  const [loadingRecords, setLoadingRecords] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deletingRecordId, setDeletingRecordId] = React.useState<string | null>(null)
  const [addingFilesToRecordId, setAddingFilesToRecordId] = React.useState<string | null>(null)
  const [filesToAdd, setFilesToAdd] = React.useState<File[]>([])
  const [addingFiles, setAddingFiles] = React.useState(false)

  // Debounced load existing records when old_patient_id changes
  React.useEffect(() => {
    const trimmedId = oldPatientId.trim()
    
    // Clear records if input is empty
    if (!trimmedId) {
      setExistingRecords([])
      return
    }

    // Don't make API calls for very short IDs (less than 2 characters)
    // This prevents excessive API calls while typing
    if (trimmedId.length < 2) {
      setExistingRecords([])
      return
    }

    // Debounce API call - wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      loadExistingRecords(trimmedId)
    }, 500)

    // Cleanup timeout on every change
    return () => clearTimeout(timeoutId)
  }, [oldPatientId])

  const loadExistingRecords = async (patientId: string) => {
    // Validate patient ID before making API call
    if (!patientId || patientId.trim().length < 2) {
      setExistingRecords([])
      return
    }

    setLoadingRecords(true)
    try {
      const response = await oldPatientRecordsApi.getByOldId(patientId)
      if (response.success && response.data) {
        setExistingRecords(response.data)
      } else {
        // Check if this is a 404 (not found) - expected behavior when no records exist
        const isNotFoundError = response.error?.toLowerCase().includes('not found') ||
                               response.error?.includes('404')
        
        if (isNotFoundError) {
          // Silently handle 404s - no records found is expected behavior
          setExistingRecords([])
        } else {
          // Other errors should be logged and shown to user
          console.error("Error loading existing records:", response.error)
          toast({
            title: "Error",
            description: response.error || "Failed to load existing records. Please try again.",
            variant: "destructive"
          })
          setExistingRecords([])
        }
      }
    } catch (error: any) {
      // Catch any unexpected errors
      const errorMessage = error?.message || String(error)
      const isNotFoundError = errorMessage.toLowerCase().includes('not found') ||
                             errorMessage.includes('404')
      
      if (!isNotFoundError) {
        console.error("Error loading existing records:", error)
        toast({
          title: "Error",
          description: "Failed to load existing records. Please try again.",
          variant: "destructive"
        })
      }
      setExistingRecords([])
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPatientId.trim()) {
      toast({
        title: "Validation Error",
        description: "Old Patient ID is required",
        variant: "destructive"
      })
      return
    }

    if (files.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one file to upload",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      const response = await oldPatientRecordsApi.upload({
        old_patient_id: oldPatientId.trim(),
        patient_name: patientName.trim() || undefined,
        notes: notes.trim() || undefined,
        files
      })

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: response.message || "Files uploaded successfully"
        })
        
        // Reset form
        setFiles([])
        setNotes("")
        
        // Reload existing records
        await loadExistingRecords(oldPatientId.trim())
      } else {
        toast({
          title: "Upload Failed",
          description: response.error || "Failed to upload files",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading files",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const response = await oldPatientRecordsApi.deleteRecord(recordId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Record deleted successfully"
        })
        // Reload records
        if (oldPatientId.trim()) {
          await loadExistingRecords(oldPatientId.trim())
        }
      } else {
        toast({
          title: "Delete Failed",
          description: response.error || "Failed to delete record",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the record",
        variant: "destructive"
      })
    } finally {
      setDeletingRecordId(null)
    }
  }

  const handleAddFiles = async (recordId: string) => {
    if (filesToAdd.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one file to add",
        variant: "destructive"
      })
      return
    }

    setAddingFiles(true)
    try {
      const response = await oldPatientRecordsApi.addFiles(recordId, filesToAdd)
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: response.message || "Files added successfully"
        })
        
        // Reset
        setFilesToAdd([])
        setAddingFilesToRecordId(null)
        
        // Reload records
        if (oldPatientId.trim()) {
          await loadExistingRecords(oldPatientId.trim())
        }
      } else {
        toast({
          title: "Upload Failed",
          description: response.error || "Failed to add files",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Add files error:", error)
      toast({
        title: "Upload Failed",
        description: "An error occurred while adding files",
        variant: "destructive"
      })
    } finally {
      setAddingFiles(false)
    }
  }

  // Filter existing records by search query
  const filteredRecords = React.useMemo(() => {
    if (!searchQuery.trim()) return existingRecords
    
    const query = searchQuery.toLowerCase()
    return existingRecords.filter(record => 
      record.patient_name?.toLowerCase().includes(query) ||
      record.notes?.toLowerCase().includes(query) ||
      record.old_patient_id.toLowerCase().includes(query)
    )
  }, [existingRecords, searchQuery])

  return (
    <div className="flex flex-col gap-6 bg-gray-50 -m-4 p-4 min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-jakarta">Old Patient Records</h1>
        <p className="text-gray-500">
          Upload and manage old patient records from printed booklets and paper files
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Old Patient Records
            </CardTitle>
            <CardDescription>
              Enter the old patient ID and upload related files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Old Patient ID */}
              <div className="space-y-2">
                <Label htmlFor="old_patient_id">
                  Old Patient ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="old_patient_id"
                  value={oldPatientId}
                  onChange={(e) => setOldPatientId(e.target.value)}
                  placeholder="Enter old patient ID (e.g., PAT123, OLD-456)"
                  required
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500">
                  The patient ID from the old system (can be any format)
                </p>
              </div>

              {/* Patient Name (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="patient_name">Patient Name (Optional)</Label>
                <Input
                  id="patient_name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name if available"
                  disabled={uploading}
                />
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about these records..."
                  rows={3}
                  disabled={uploading}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Files <span className="text-red-500">*</span></Label>
                <FileUpload
                  files={files}
                  onFilesChange={setFiles}
                  maxFiles={50}
                  maxSizePerFile={10 * 1024 * 1024} // 10MB
                  disabled={uploading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={uploading || files.length === 0 || !oldPatientId.trim()}
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column - Existing Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Existing Records
            </CardTitle>
            <CardDescription>
              {oldPatientId.trim()
                ? `Records for ID: ${oldPatientId}`
                : "Enter an old patient ID to view existing records"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!oldPatientId.trim() ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Enter an old patient ID to view existing records</p>
              </div>
            ) : loadingRecords ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading records...</p>
              </div>
            ) : existingRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No existing records found for this ID</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Records List */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredRecords.map((record) => (
                      <Card key={record.id} className="border">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                {record.patient_name && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{record.patient_name}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {record.old_patient_id}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(record.upload_date)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {record.file_count || record.old_patient_record_files?.length || 0} files
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAddingFilesToRecordId(record.id)}
                                  className="h-8"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Files
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeletingRecordId(record.id)}
                                  className="h-8"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {record.notes && (
                              <p className="text-sm text-muted-foreground">{record.notes}</p>
                            )}

                            {record.old_patient_record_files && record.old_patient_record_files.length > 0 && (
                              <div className="space-y-1 pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground">Files:</p>
                                <div className="space-y-1">
                                  {record.old_patient_record_files.map((file) => (
                                    <div key={file.id} className="flex items-center gap-2 text-xs">
                                      <FileText className="h-3 w-3 text-muted-foreground" />
                                      <span className="truncate flex-1">{file.file_name}</span>
                                      <span className="text-muted-foreground">
                                        {formatFileSize(file.file_size)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingRecordId !== null} onOpenChange={(open) => !open && setDeletingRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record? This action cannot be undone and will delete all associated files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRecordId && handleDeleteRecord(deletingRecordId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Files Dialog */}
      <AlertDialog open={addingFilesToRecordId !== null} onOpenChange={(open) => !open && setAddingFilesToRecordId(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Files to Record</AlertDialogTitle>
            <AlertDialogDescription>
              Select files to add to this patient record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <FileUpload
              files={filesToAdd}
              onFilesChange={setFilesToAdd}
              maxFiles={50}
              maxSizePerFile={10 * 1024 * 1024} // 10MB
              disabled={addingFiles}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFilesToAdd([])}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => addingFilesToRecordId && handleAddFiles(addingFilesToRecordId)}
              disabled={addingFiles || filesToAdd.length === 0}
            >
              {addingFiles ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Files
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

