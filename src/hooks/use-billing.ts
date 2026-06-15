'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/admin'
import type { AdminSubscriptionSearchParams } from '@/types/admin'

export const billingKeys = {
  all: ['billing'] as const,
  overview: (period?: string) => [...billingKeys.all, 'overview', period] as const,
  subscriptions: () => [...billingKeys.all, 'subscriptions'] as const,
  subscriptionList: (params?: AdminSubscriptionSearchParams) => [...billingKeys.subscriptions(), 'list', params] as const,
  subscriptionDetail: (id: string) => [...billingKeys.subscriptions(), 'detail', id] as const,
  invoices: () => [...billingKeys.all, 'invoices'] as const,
  invoiceList: (params?: object) => [...billingKeys.invoices(), 'list', params] as const,
}

export function useBillingOverview(period?: string) {
  return useQuery({
    queryKey: billingKeys.overview(period),
    queryFn: () => adminApi.billing.getOverview(period),
    staleTime: 60000,
  })
}

export function useSubscriptions(params?: AdminSubscriptionSearchParams) {
  return useQuery({
    queryKey: billingKeys.subscriptionList(params),
    queryFn: () => adminApi.billing.listSubscriptions(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useSubscriptionDetail(subscriptionId: string) {
  return useQuery({
    queryKey: billingKeys.subscriptionDetail(subscriptionId),
    queryFn: () => adminApi.billing.getSubscription(subscriptionId),
    enabled: !!subscriptionId,
  })
}

export function useInvoices(params?: {
  search?: string
  status?: string
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: billingKeys.invoiceList(params),
    queryFn: () => adminApi.billing.listInvoices(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useOverridePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      subscriptionId,
      planCode,
      reason,
      prorate,
    }: {
      subscriptionId: string
      planCode: string
      reason: string
      prorate?: boolean
    }) => adminApi.billing.overridePlan(subscriptionId, planCode, reason, prorate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions() })
      queryClient.invalidateQueries({ queryKey: billingKeys.subscriptionDetail(variables.subscriptionId) })
      toast.success('Plan override applied successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to override plan')
    },
  })
}

export function useProcessRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      paymentId,
      amount,
      reason,
    }: {
      paymentId: string
      amount: number | null
      reason: string
    }) => adminApi.billing.processRefund(paymentId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all })
      toast.success('Refund processed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process refund')
    },
  })
}
