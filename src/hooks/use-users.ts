'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin'
import type { AdminUserSearchParams } from '@/types/admin'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: AdminUserSearchParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export function useUsers(params?: AdminUserSearchParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => adminApi.users.list(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => adminApi.users.get(userId),
    enabled: !!userId,
  })
}

export function useSuspendUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, reason, notes }: { userId: string; reason: string; notes?: string }) =>
      adminApi.users.suspend(userId, reason, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      toast.success('User suspended successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to suspend user')
    },
  })
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => adminApi.users.unsuspend(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
      toast.success('User unsuspended successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unsuspend user')
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) => adminApi.users.resetPassword(userId),
    onSuccess: () => {
      toast.success('Password reset email sent')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset password')
    },
  })
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: ({ userId, reason, readOnly = true }: { userId: string; reason: string; readOnly?: boolean }) =>
      adminApi.users.impersonate(userId, reason, readOnly),
    onSuccess: (data) => {
      toast.success('Impersonation session started')
      // Open impersonation URL in new tab
      window.open(data.url, '_blank')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start impersonation')
    },
  })
}

export function useEndImpersonation() {
  return useMutation({
    mutationFn: (userId: string) => adminApi.users.endImpersonation(userId),
    onSuccess: () => {
      toast.success('Impersonation session ended')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to end impersonation')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      reason,
      gdprRequest,
      confirmed,
    }: {
      userId: string
      reason: string
      gdprRequest: boolean
      confirmed: boolean
    }) => adminApi.users.delete(userId, reason, gdprRequest, confirmed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('User deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user')
    },
  })
}
