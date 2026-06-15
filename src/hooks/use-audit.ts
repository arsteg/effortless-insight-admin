'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin'
import type { AuditSearchParams } from '@/types/admin'

export const auditKeys = {
  all: ['audit'] as const,
  search: (params?: AuditSearchParams) => [...auditKeys.all, 'search', params] as const,
  detail: (id: string) => [...auditKeys.all, 'detail', id] as const,
  stats: (period?: string) => [...auditKeys.all, 'stats', period] as const,
  actionTypes: () => [...auditKeys.all, 'action-types'] as const,
  targetTypes: () => [...auditKeys.all, 'target-types'] as const,
}

export function useAuditLogs(params?: AuditSearchParams) {
  return useQuery({
    queryKey: auditKeys.search(params),
    queryFn: () => adminApi.audit.search(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useAuditDetail(auditId: string) {
  return useQuery({
    queryKey: auditKeys.detail(auditId),
    queryFn: () => adminApi.audit.get(auditId),
    enabled: !!auditId,
  })
}

export function useAuditStats(period?: string) {
  return useQuery({
    queryKey: auditKeys.stats(period),
    queryFn: () => adminApi.audit.getStats(period),
    staleTime: 60000,
  })
}

export function useAuditActionTypes() {
  return useQuery({
    queryKey: auditKeys.actionTypes(),
    queryFn: () => adminApi.audit.getActionTypes(),
    staleTime: 300000, // 5 minutes
  })
}

export function useAuditTargetTypes() {
  return useQuery({
    queryKey: auditKeys.targetTypes(),
    queryFn: () => adminApi.audit.getTargetTypes(),
    staleTime: 300000,
  })
}

export function useExportAudit() {
  return useMutation({
    mutationFn: (params: {
      adminUserId?: string
      action?: string
      targetType?: string
      startDate?: string
      endDate?: string
    }) => adminApi.audit.export(params),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Audit log exported successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export audit log')
    },
  })
}
