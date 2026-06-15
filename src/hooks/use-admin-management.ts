'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin'
import type { AdminUser, AdminUserDetail } from '@/types/admin'

export const adminManagementKeys = {
  all: ['admin-management'] as const,
  lists: () => [...adminManagementKeys.all, 'list'] as const,
  list: (params?: object) => [...adminManagementKeys.lists(), params] as const,
  details: () => [...adminManagementKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminManagementKeys.details(), id] as const,
  roles: () => [...adminManagementKeys.all, 'roles'] as const,
}

export function useAdminUsers(params?: {
  search?: string
  role?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: adminManagementKeys.list(params),
    queryFn: () => adminApi.management.list(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useAdminUserDetail(adminId: string) {
  return useQuery({
    queryKey: adminManagementKeys.detail(adminId),
    queryFn: () => adminApi.management.get(adminId),
    enabled: !!adminId,
  })
}

export function useAdminRoles() {
  return useQuery({
    queryKey: adminManagementKeys.roles(),
    queryFn: () => adminApi.management.getRoles(),
    staleTime: 300000, // 5 minutes
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      email: string
      name: string
      password: string
      role: string
      permissions?: string[]
      ipWhitelist?: string[]
    }) => adminApi.management.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminManagementKeys.lists() })
      toast.success('Admin user created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create admin user')
    },
  })
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      adminId,
      data,
    }: {
      adminId: string
      data: {
        name?: string
        role?: string
        permissions?: string[]
        ipWhitelist?: string[]
        isActive?: boolean
      }
    }) => adminApi.management.update(adminId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminManagementKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminManagementKeys.detail(variables.adminId) })
      toast.success('Admin user updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update admin user')
    },
  })
}

export function useSuspendAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ adminId, reason }: { adminId: string; reason: string }) =>
      adminApi.management.suspend(adminId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminManagementKeys.lists() })
      toast.success('Admin user suspended')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to suspend admin user')
    },
  })
}

export function useReactivateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adminId: string) => adminApi.management.reactivate(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminManagementKeys.lists() })
      toast.success('Admin user reactivated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reactivate admin user')
    },
  })
}

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: (adminId: string) => adminApi.management.resetPassword(adminId),
    onSuccess: (data) => {
      toast.success(`Password reset. Temporary password: ${data.temporaryPassword}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset password')
    },
  })
}

export function useDisableAdminMfa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ adminId, reason }: { adminId: string; reason: string }) =>
      adminApi.management.disableMfa(adminId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminManagementKeys.lists() })
      toast.success('MFA disabled for admin user')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disable MFA')
    },
  })
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adminId: string) => adminApi.management.delete(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminManagementKeys.lists() })
      toast.success('Admin user deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete admin user')
    },
  })
}
