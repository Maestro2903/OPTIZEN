"use client"

import * as React from "react"
import { Upload, X, File, Image as ImageIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  maxSizePerFile?: number // in bytes
  acceptedTypes?: string[]
  disabled?: boolean
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 50,
  maxSizePerFile = 10 * 1024 * 1024, // 10MB default
  acceptedTypes,
  disabled = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return ImageIcon
    }
    if (file.type === 'application/pdf') {
      return FileText
    }
    return File
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizePerFile) {
      return `File size exceeds ${formatFileSize(maxSizePerFile)}`
    }

    // Check file type if specified
    if (acceptedTypes && acceptedTypes.length > 0) {
      if (!acceptedTypes.includes(file.type)) {
        return `File type ${file.type} is not allowed`
      }
    }

    return null
  }

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles: File[] = []
    const errors: string[] = []

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      // Still process files up to the limit
      fileArray.slice(0, maxFiles - files.length).forEach(file => {
        const error = validateFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
        } else {
          validFiles.push(file)
        }
      })
    } else {
      fileArray.forEach(file => {
        const error = validateFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
        } else {
          validFiles.push(file)
        }
      })
    }

    if (errors.length > 0) {
      console.warn('File validation errors:', errors)
      // You could show a toast here
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary hover:bg-gray-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes?.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className={cn(
            "h-10 w-10",
            isDragging ? "text-primary" : "text-gray-400"
          )} />
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes ? `Accepted: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}` : "All file types"}
              {" "}• Max {formatFileSize(maxSizePerFile)} per file • Max {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Selected Files ({files.length})
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilesChange([])}
                  disabled={disabled}
                >
                  Clear All
                </Button>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {files.map((file, index) => {
                    const Icon = getFileIcon(file)
                    return (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50"
                      >
                        <Icon className="h-5 w-5 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(index)
                          }}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



