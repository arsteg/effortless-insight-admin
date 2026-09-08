'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminSignupsApi } from '@/lib/api/signups'

export const signupAttemptKeys = {
  all: ['signup-attempts'] as const,
  lists: () => [...signupAttemptKeys.all, 'list'] as const,
  list: (contacted?: boolean, search?: string) =>
    [...signupAttemptKeys.lists(), contacted, search] as const,
}

export function useSignupAttempts(contacted?: boolean, search?: string) {
  return useQuery({
    queryKey: signupAttemptKeys.list(contacted, search),
    queryFn: () => adminSignupsApi.list({ contacted, search, pageSize: 100 }),
    placeholderData: (previousData) => previousData,
    refetchInterval: 60_000, // keep the call list fresh while the tab is open
  })
}

export function useSetSignupAttemptContacted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, contacted, notes }: { id: string; contacted: boolean; notes?: string }) =>
      adminSignupsApi.setContacted(id, contacted, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: signupAttemptKeys.lists() })
      toast.success(variables.contacted ? 'Marked as contacted' : 'Marked as not contacted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update')
    },
  })
}

export function useDeleteSignupAttempt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminSignupsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signupAttemptKeys.lists() })
      toast.success('Entry removed')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove entry')
    },
  })
}
