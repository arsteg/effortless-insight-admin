'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin'
import type {
  AdminCaSearchParams,
  AdminCaRelationshipSearchParams,
  AdminCaInvitationSearchParams,
  AdminVerifyCaRequest,
  AdminSuspendCaRequest,
} from '@/types/admin'

// ============================================================================
// CA Profile Hooks
// ============================================================================

export const caKeys = {
  all: ['cas'] as const,
  lists: () => [...caKeys.all, 'list'] as const,
  list: (params?: AdminCaSearchParams) => [...caKeys.lists(), params] as const,
  details: () => [...caKeys.all, 'detail'] as const,
  detail: (id: string) => [...caKeys.details(), id] as const,
}

export function useCas(params?: AdminCaSearchParams) {
  return useQuery({
    queryKey: caKeys.list(params),
    queryFn: () => adminApi.cas.list(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useCaDetail(caProfileId: string) {
  return useQuery({
    queryKey: caKeys.detail(caProfileId),
    queryFn: () => adminApi.cas.get(caProfileId),
    enabled: !!caProfileId,
  })
}

export function useVerifyCa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ caProfileId, request }: { caProfileId: string; request: AdminVerifyCaRequest }) =>
      adminApi.cas.verify(caProfileId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: caKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caKeys.detail(variables.caProfileId) })
      toast.success('CA verified successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify CA')
    },
  })
}

export function useRevokeVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ caProfileId, reason }: { caProfileId: string; reason?: string }) =>
      adminApi.cas.revokeVerification(caProfileId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: caKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caKeys.detail(variables.caProfileId) })
      toast.success('CA verification revoked')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke verification')
    },
  })
}

export function useGrantCaFreePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ caProfileId, notes }: { caProfileId: string; notes?: string }) =>
      adminApi.cas.grantFreePlan(caProfileId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: caKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caKeys.detail(variables.caProfileId) })
      toast.success('Free plan enabled for this CA')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to enable free plan')
    },
  })
}

export function useRevokeCaFreePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ caProfileId, reason }: { caProfileId: string; reason?: string }) =>
      adminApi.cas.revokeFreePlan(caProfileId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: caKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caKeys.detail(variables.caProfileId) })
      toast.success('Free plan revoked for this CA')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke free plan')
    },
  })
}

export function useSuspendCa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ caProfileId, request }: { caProfileId: string; request: AdminSuspendCaRequest }) =>
      adminApi.cas.suspend(caProfileId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: caKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caKeys.detail(variables.caProfileId) })
      toast.success('CA suspended successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to suspend CA')
    },
  })
}

export function useUnsuspendCa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (caProfileId: string) => adminApi.cas.unsuspend(caProfileId),
    onSuccess: (_, caProfileId) => {
      queryClient.invalidateQueries({ queryKey: caKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caKeys.detail(caProfileId) })
      toast.success('CA unsuspended successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unsuspend CA')
    },
  })
}

// ============================================================================
// CA Relationship Hooks
// ============================================================================

export const caRelationshipKeys = {
  all: ['ca-relationships'] as const,
  lists: () => [...caRelationshipKeys.all, 'list'] as const,
  list: (params?: AdminCaRelationshipSearchParams) => [...caRelationshipKeys.lists(), params] as const,
  details: () => [...caRelationshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...caRelationshipKeys.details(), id] as const,
}

export function useCaRelationships(params?: AdminCaRelationshipSearchParams) {
  return useQuery({
    queryKey: caRelationshipKeys.list(params),
    queryFn: () => adminApi.caRelationships.list(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useCaRelationshipDetail(relationshipId: string) {
  return useQuery({
    queryKey: caRelationshipKeys.detail(relationshipId),
    queryFn: () => adminApi.caRelationships.get(relationshipId),
    enabled: !!relationshipId,
  })
}

export function useRevokeCaRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ relationshipId, reason }: { relationshipId: string; reason: string }) =>
      adminApi.caRelationships.revoke(relationshipId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: caRelationshipKeys.lists() })
      queryClient.invalidateQueries({ queryKey: caRelationshipKeys.detail(variables.relationshipId) })
      queryClient.invalidateQueries({ queryKey: caKeys.lists() })
      toast.success('Relationship revoked successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke relationship')
    },
  })
}

// ============================================================================
// CA Invitation Hooks
// ============================================================================

export const caInvitationKeys = {
  all: ['ca-invitations'] as const,
  lists: () => [...caInvitationKeys.all, 'list'] as const,
  list: (params?: AdminCaInvitationSearchParams) => [...caInvitationKeys.lists(), params] as const,
}

export function useCaInvitations(params?: AdminCaInvitationSearchParams) {
  return useQuery({
    queryKey: caInvitationKeys.list(params),
    queryFn: () => adminApi.caInvitations.list(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useCancelCaInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invitationId, reason }: { invitationId: string; reason: string }) =>
      adminApi.caInvitations.cancel(invitationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caInvitationKeys.lists() })
      toast.success('Invitation cancelled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invitation')
    },
  })
}
