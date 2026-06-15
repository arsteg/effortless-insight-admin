'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin'
import type { AdminOrganizationSearchParams } from '@/types/admin'

export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (params?: AdminOrganizationSearchParams) => [...organizationKeys.lists(), params] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  credits: (orgId: string) => [...organizationKeys.all, 'credits', orgId] as const,
}

export function useOrganizations(params?: AdminOrganizationSearchParams) {
  return useQuery({
    queryKey: organizationKeys.list(params),
    queryFn: () => adminApi.organizations.list(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useOrganizationDetail(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.detail(orgId),
    queryFn: () => adminApi.organizations.get(orgId),
    enabled: !!orgId,
  })
}

export function useOrganizationCredits(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.credits(orgId),
    queryFn: () => adminApi.organizations.getCredits(orgId),
    enabled: !!orgId,
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orgId,
      data,
    }: {
      orgId: string
      data: { name?: string; industry?: string; website?: string }
    }) => adminApi.organizations.update(orgId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.orgId) })
      toast.success('Organization updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update organization')
    },
  })
}

export function useSuspendOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orgId, reason, notes }: { orgId: string; reason: string; notes?: string }) =>
      adminApi.organizations.suspend(orgId, reason, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.orgId) })
      toast.success('Organization suspended successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to suspend organization')
    },
  })
}

export function useUnsuspendOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orgId: string) => adminApi.organizations.unsuspend(orgId),
    onSuccess: (_, orgId) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(orgId) })
      toast.success('Organization unsuspended successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unsuspend organization')
    },
  })
}

export function useApplyCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orgId,
      amount,
      reason,
      type,
      expiresAt,
    }: {
      orgId: string
      amount: number
      reason: string
      type?: string
      expiresAt?: string
    }) => adminApi.organizations.applyCredit(orgId, amount, reason, type, expiresAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.orgId) })
      queryClient.invalidateQueries({ queryKey: organizationKeys.credits(variables.orgId) })
      toast.success('Credit applied successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to apply credit')
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orgId,
      reason,
      gdprRequest,
      confirmed,
    }: {
      orgId: string
      reason: string
      gdprRequest: boolean
      confirmed: boolean
    }) => adminApi.organizations.delete(orgId, reason, gdprRequest, confirmed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
      toast.success('Organization deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete organization')
    },
  })
}
