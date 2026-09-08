'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminSupportApi, type SupportTicketStatus } from '@/lib/api/support'

export const supportTicketKeys = {
  all: ['support-tickets'] as const,
  lists: () => [...supportTicketKeys.all, 'list'] as const,
  list: (status?: SupportTicketStatus) => [...supportTicketKeys.lists(), status] as const,
  details: () => [...supportTicketKeys.all, 'detail'] as const,
  detail: (id: string) => [...supportTicketKeys.details(), id] as const,
}

export function useSupportTickets(status?: SupportTicketStatus) {
  return useQuery({
    queryKey: supportTicketKeys.list(status),
    queryFn: () => adminSupportApi.list({ status, pageSize: 100 }),
    placeholderData: (previousData) => previousData,
    refetchInterval: 60_000, // keep the queue fresh while the tab is open
  })
}

export function useSupportTicketDetail(ticketId: string) {
  return useQuery({
    queryKey: supportTicketKeys.detail(ticketId),
    queryFn: () => adminSupportApi.get(ticketId),
    enabled: !!ticketId,
  })
}

export function useReplyToTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      adminSupportApi.reply(ticketId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.detail(variables.ticketId) })
      toast.success('Reply sent')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reply')
    },
  })
}

export function useSetTicketStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: SupportTicketStatus }) =>
      adminSupportApi.setStatus(ticketId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.detail(variables.ticketId) })
      toast.success('Status updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status')
    },
  })
}
