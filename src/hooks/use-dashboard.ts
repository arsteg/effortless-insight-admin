'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: (period?: string) => [...dashboardKeys.all, 'metrics', period] as const,
  health: () => [...dashboardKeys.all, 'health'] as const,
  alerts: (status?: string, priority?: string) => [...dashboardKeys.all, 'alerts', status, priority] as const,
  activity: (limit?: number) => [...dashboardKeys.all, 'activity', limit] as const,
}

export function useDashboardMetrics(period?: string) {
  return useQuery({
    queryKey: dashboardKeys.metrics(period),
    queryFn: () => adminApi.dashboard.getMetrics(period),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: dashboardKeys.health(),
    queryFn: () => adminApi.dashboard.getHealth(),
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000,
  })
}

export function useSystemAlerts(status?: string, priority?: string) {
  return useQuery({
    queryKey: dashboardKeys.alerts(status, priority),
    queryFn: () => adminApi.dashboard.getAlerts(status, priority),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => adminApi.dashboard.getRecentActivity(limit),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) => adminApi.dashboard.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.alerts() })
      toast.success('Alert acknowledged')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to acknowledge alert')
    },
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) => adminApi.dashboard.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.alerts() })
      toast.success('Alert resolved')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resolve alert')
    },
  })
}
