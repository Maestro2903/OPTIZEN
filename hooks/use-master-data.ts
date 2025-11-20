"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"

export interface MasterDataOption {
  value: string
  label: string
}

export interface MasterDataCategories {
  complaints: MasterDataOption[]
  complaintCategories: MasterDataOption[]
  treatments: MasterDataOption[]
  medicines: MasterDataOption[]
  surgeries: MasterDataOption[]
  surgeryTypes: MasterDataOption[]
  diagnosticTests: MasterDataOption[]
  eyeConditions: MasterDataOption[]
  visualAcuity: MasterDataOption[]
  bloodTests: MasterDataOption[]
  diagnosis: MasterDataOption[]
  dosages: MasterDataOption[]
  routes: MasterDataOption[]
  eyeSelection: MasterDataOption[]
  visitTypes: MasterDataOption[]
  sacStatus: MasterDataOption[]
  iopRanges: MasterDataOption[]
  iopMethods: MasterDataOption[]
  fundusFindings: MasterDataOption[]
  corneaFindings: MasterDataOption[]
  conjunctivaFindings: MasterDataOption[]
  irisFindings: MasterDataOption[]
  anteriorSegmentFindings: MasterDataOption[]
  lensOptions: MasterDataOption[]
  paymentMethods: MasterDataOption[]
  insuranceProviders: MasterDataOption[]
  roles: MasterDataOption[]
  roomTypes: MasterDataOption[]
  expenseCategories: MasterDataOption[]
  anesthesiaTypes: MasterDataOption[]
  pharmacyCategories: MasterDataOption[]
  colorVisionTypes: MasterDataOption[]
  drivingFitnessTypes: MasterDataOption[]
  revenueTypes: MasterDataOption[]
  paymentStatuses: MasterDataOption[]
}

type CategoryKey = keyof MasterDataCategories

const SLUG_VALUE_CATEGORIES: CategoryKey[] = [
  'paymentMethods',
  'paymentStatuses',
  'revenueTypes',
  'expenseCategories',
]

const normalizeValue = (value: string): string => {
  if (!value) return ''
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// Mapping between frontend keys and API category names
const CATEGORY_MAP: Record<CategoryKey, string> = {
  complaints: 'complaints',
  complaintCategories: 'complaint_categories',
  treatments: 'treatments',
  medicines: 'medicines',
  surgeries: 'surgeries',
  surgeryTypes: 'surgery_types',
  diagnosticTests: 'diagnostic_tests',
  eyeConditions: 'eye_conditions',
  visualAcuity: 'visual_acuity',
  bloodTests: 'blood_tests',
  diagnosis: 'diagnosis',
  dosages: 'dosages',
  routes: 'routes',
  eyeSelection: 'eye_selection',
  visitTypes: 'visit_types',
  sacStatus: 'sac_status',
  iopRanges: 'iop_ranges',
  iopMethods: 'iop_methods',
  fundusFindings: 'fundus_findings',
  corneaFindings: 'cornea_findings',
  conjunctivaFindings: 'conjunctiva_findings',
  irisFindings: 'iris_findings',
  anteriorSegmentFindings: 'anterior_segment_findings',
  lensOptions: 'lens_options',
  paymentMethods: 'payment_methods',
  insuranceProviders: 'insurance_providers',
  roles: 'roles',
  roomTypes: 'room_types',
  expenseCategories: 'expense_categories',
  anesthesiaTypes: 'anesthesia_types',
  pharmacyCategories: 'pharmacy_categories',
  colorVisionTypes: 'color_vision_types',
  drivingFitnessTypes: 'driving_fitness_types',
  revenueTypes: 'revenue_types',
  paymentStatuses: 'payment_statuses',
}

export function useMasterData() {
  const { toast } = useToast()
  const toastRef = React.useRef(toast)
  
  // Keep toast ref updated without causing re-renders
  React.useEffect(() => {
    toastRef.current = toast
  }, [toast])
  
  const [data, setData] = React.useState<MasterDataCategories>({
    complaints: [],
    complaintCategories: [],
    treatments: [],
    medicines: [],
    surgeries: [],
    surgeryTypes: [],
    diagnosticTests: [],
    eyeConditions: [],
    visualAcuity: [],
    bloodTests: [],
    diagnosis: [],
    dosages: [],
    routes: [],
    eyeSelection: [],
    visitTypes: [],
    sacStatus: [],
    iopRanges: [],
    iopMethods: [],
    fundusFindings: [],
    corneaFindings: [],
    conjunctivaFindings: [],
    irisFindings: [],
    anteriorSegmentFindings: [],
    lensOptions: [],
    paymentMethods: [],
    insuranceProviders: [],
    roles: [],
    roomTypes: [],
    expenseCategories: [],
    anesthesiaTypes: [],
    pharmacyCategories: [],
    colorVisionTypes: [],
    drivingFitnessTypes: [],
    revenueTypes: [],
    paymentStatuses: [],
  })
  const [loading, setLoading] = React.useState<Partial<Record<CategoryKey, boolean>>>({})
  const [errors, setErrors] = React.useState<Partial<Record<CategoryKey, string>>>({})

  const fetchCategory = React.useCallback(async (category: CategoryKey) => {
    const apiCategory = CATEGORY_MAP[category]
    setLoading(prev => ({ ...prev, [category]: true }))
    setErrors(prev => ({ ...prev, [category]: undefined }))

    try {
      const response = await fetch(`/api/master-data?category=${apiCategory}&limit=1000`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category}`)
      }

      const result = await response.json()
      if (result.data) {
        const shouldUseSlugValue = SLUG_VALUE_CATEGORIES.includes(category)
        const options: MasterDataOption[] = result.data.map((item: any) => {
          const metadataValue = typeof item?.metadata?.value === 'string'
            ? item.metadata.value.trim()
            : undefined
          const metadataSlug = typeof item?.metadata?.slug === 'string'
            ? item.metadata.slug.trim()
            : undefined
          const normalizedName = normalizeValue(item.name)

          return {
            value: shouldUseSlugValue
              ? metadataValue || metadataSlug || normalizedName || item.id
              : item.id,     // Use ID (UUID) as value for proper foreign key relationships
            label: item.name,   // Display name as label
          }
        })

        setData(prev => ({ ...prev, [category]: options }))
      }
    } catch (error: any) {
      console.error(`Error fetching ${category}:`, error)
      setErrors(prev => ({ ...prev, [category]: error.message }))
      toastRef.current({
        title: `Failed to load ${category}`,
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, [category]: false }))
    }
  }, []) // No dependencies - stable function

  const fetchMultiple = React.useCallback(async (categories: CategoryKey[]) => {
    await Promise.all(categories.map(category => fetchCategory(category)))
  }, [fetchCategory])

  const refresh = React.useCallback(async (category?: CategoryKey) => {
    if (category) {
      await fetchCategory(category)
    } else {
      // Refresh all categories
      await fetchMultiple(Object.keys(CATEGORY_MAP) as CategoryKey[])
    }
  }, [fetchCategory, fetchMultiple])

  return {
    data,
    loading,
    errors,
    fetchCategory,
    fetchMultiple,
    refresh,
  }
}

