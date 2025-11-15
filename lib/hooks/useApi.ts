/**
 * Custom React hooks for API integration
 *
 * These hooks provide a clean interface for components to interact with the API
 * and handle loading states, errors, and data management.
 */

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { ApiResponse, PaginationParams } from '@/lib/services/api'

// Generic hook for API operations
export function useApi<T>() {
  const [data, setData] = useState<T | T[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const execute = useCallback(async <R>(
    apiCall: () => Promise<ApiResponse<R>>,
    options: {
      onSuccess?: (data: R) => void
      onError?: (error: string) => void
      showSuccessToast?: boolean
      showErrorToast?: boolean
      successMessage?: string
    } = {}
  ): Promise<R | null> => {
    const {
      onSuccess,
      onError,
      showSuccessToast = false,
      showErrorToast = true,
      successMessage
    } = options

    setLoading(true)
    setError(null)

    try {
      const response = await apiCall()

      if (response.success && response.data) {
        setData(response.data as any)

        if (showSuccessToast || successMessage) {
          toast({
            title: 'Success',
            description: successMessage || response.message || 'Operation completed successfully',
          })
        }

        onSuccess?.(response.data)
        return response.data
      } else {
        const errorMsg = response.error || 'Operation failed'
        setError(errorMsg)

        if (showErrorToast) {
          toast({
            title: 'Error',
            description: errorMsg,
            variant: 'destructive',
          })
        }

        onError?.(errorMsg)
        return null
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMsg)

      if (showErrorToast) {
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })
      }

      onError?.(errorMsg)
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError,
  }
}

// Hook for list operations with pagination
export function useApiList<T>(
  apiFunction: (params?: any) => Promise<ApiResponse<T[]>>,
  initialParams: PaginationParams & Record<string, any> = {}
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [meta, setMeta] = useState<Record<string, any> | null>(null)
  const [params, setParams] = useState(initialParams)
  const { toast } = useToast()

  const fetchData = useCallback(async (newParams?: any) => {
    setLoading(true)
    setError(null)

    try {
      const mergedParams = { ...params, ...newParams }
      const response = await apiFunction(mergedParams)

      if (response.success && response.data) {
        setData(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
        // Capture any additional metadata from response
        const { success, data, pagination: pag, error: err, message, ...rest } = response as any
        if (Object.keys(rest).length > 0) {
          setMeta(rest)
        }
      } else {
        const errorMsg = response.error || 'Failed to fetch data'
        setError(errorMsg)
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [apiFunction, params, toast])

  // Fetch data on mount and when params change
  useEffect(() => {
    fetchData(params)
  }, [fetchData, params])

  const updateParams = useCallback((newParams: Partial<typeof params>) => {
    setParams(prev => ({ ...prev, ...newParams }))
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const changePage = useCallback((page: number) => {
    updateParams({ page })
  }, [updateParams])

  const changePageSize = useCallback((limit: number) => {
    updateParams({ page: 1, limit })
  }, [updateParams])

  const search = useCallback((searchTerm: string) => {
    updateParams({ page: 1, search: searchTerm })
  }, [updateParams])

  const sort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    updateParams({ sortBy, sortOrder })
  }, [updateParams])

  const filter = useCallback((filters: Record<string, any>) => {
    updateParams({ page: 1, ...filters })
  }, [updateParams])

  // Update local data after CRUD operations
  const addItem = useCallback((newItem: T) => {
    setData(prev => [newItem, ...prev])
  }, [])

  const updateItem = useCallback((id: string, updatedItem: Partial<T>) => {
    setData(prev => prev.map(item =>
      (item as any).id === id ? { ...item, ...updatedItem } : item
    ))
  }, [])

  const removeItem = useCallback((id: string) => {
    setData(prev => prev.filter(item => (item as any).id !== id))
  }, [])

  return {
    data,
    loading,
    error,
    pagination,
    meta,
    params,
    fetchData,
    updateParams,
    refresh,
    changePage,
    changePageSize,
    search,
    sort,
    filter,
    addItem,
    updateItem,
    removeItem,
  }
}

// Hook for single item operations
export function useApiItem<T>(
  apiFunction: (id: string) => Promise<ApiResponse<T>>
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchItem = useCallback(async (id: string) => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiFunction(id)

      if (response.success && response.data) {
        setData(response.data)
      } else {
        const errorMsg = response.error || 'Failed to fetch item'
        setError(errorMsg)
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [apiFunction, toast])

  return {
    data,
    loading,
    error,
    fetchItem,
    setData,
  }
}

// Hook for form operations (create/update)
export function useApiForm<T>() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const submitForm = useCallback(async (
    apiCall: () => Promise<ApiResponse<T>>,
    options: {
      onSuccess?: (data: T) => void
      onError?: (error: string) => void
      successMessage?: string
    } = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, successMessage } = options

    setLoading(true)

    try {
      const response = await apiCall()

      if (response.success && response.data) {
        if (successMessage) {
          toast({
            title: 'Success',
            description: successMessage || response.message || 'Operation completed successfully',
          })
        }

        onSuccess?.(response.data)
        return response.data
      } else {
        const errorMsg = response.error || 'Operation failed'
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })

        onError?.(errorMsg)
        // Throw error so calling code knows it failed
        throw new Error(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })

      onError?.(errorMsg)
      // Re-throw so calling code can handle it
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    loading,
    submitForm,
  }
}

// Hook for delete operations
export function useApiDelete() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const deleteItem = useCallback(async (
    apiCall: () => Promise<ApiResponse<any>>,
    options: {
      onSuccess?: () => void
      onError?: (error: string) => void
      successMessage?: string
    } = {}
  ): Promise<boolean> => {
    const { onSuccess, onError, successMessage } = options

    setLoading(true)

    try {
      const response = await apiCall()

      if (response.success) {
        toast({
          title: 'Deleted',
          description: successMessage || response.message || 'Item deleted successfully',
        })

        onSuccess?.()
        return true
      } else {
        const errorMsg = response.error || 'Delete operation failed'
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })

        onError?.(errorMsg)
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred'
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })

      onError?.(errorMsg)
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    loading,
    deleteItem,
  }
}