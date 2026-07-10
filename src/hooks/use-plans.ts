import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'
import type {
  PlanSearchParams,
  CreatePlanRequest,
  UpdatePlanRequest,
  AdminPlanListItem,
  AdminPlan,
  PaginatedResponse,
} from '@/types/admin'
import { toast } from 'sonner'

// Query keys
export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (params?: PlanSearchParams) => [...planKeys.lists(), params] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
}

// List plans query
export function usePlans(params?: PlanSearchParams) {
  return useQuery<PaginatedResponse<AdminPlanListItem>>({
    queryKey: planKeys.list(params),
    queryFn: () => adminApi.plans.list(params),
  })
}

// Get plan detail query
export function usePlanDetail(id?: string) {
  return useQuery<AdminPlan>({
    queryKey: planKeys.detail(id!),
    queryFn: () => adminApi.plans.get(id!),
    enabled: !!id,
  })
}

// Create plan mutation
export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlanRequest) => adminApi.plans.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
      toast.success('Plan created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create plan')
    },
  })
}

// Update plan mutation
export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanRequest }) =>
      adminApi.plans.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.id) })
      toast.success('Plan updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update plan')
    },
  })
}

// Delete plan mutation
export function useDeletePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.plans.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
      toast.success('Plan deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete plan')
    },
  })
}

// Activate plan mutation
export function useActivatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.plans.activate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
      queryClient.invalidateQueries({ queryKey: planKeys.detail(id) })
      toast.success('Plan activated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate plan')
    },
  })
}

// Deactivate plan mutation
export function useDeactivatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.plans.deactivate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
      queryClient.invalidateQueries({ queryKey: planKeys.detail(id) })
      toast.success('Plan deactivated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate plan')
    },
  })
}
