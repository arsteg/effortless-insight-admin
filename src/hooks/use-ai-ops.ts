'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi, type AIJob, type AIQueueStats, type AIPrompt } from '@/lib/api/admin'

export const aiOpsKeys = {
  all: ['ai-ops'] as const,
  queueStats: () => [...aiOpsKeys.all, 'queue-stats'] as const,
  jobs: () => [...aiOpsKeys.all, 'jobs'] as const,
  jobList: (params?: object) => [...aiOpsKeys.jobs(), 'list', params] as const,
  jobDetail: (id: string) => [...aiOpsKeys.jobs(), 'detail', id] as const,
  prompts: () => [...aiOpsKeys.all, 'prompts'] as const,
  promptDetail: (id: string) => [...aiOpsKeys.prompts(), 'detail', id] as const,
}

export function useAIQueueStats() {
  return useQuery({
    queryKey: aiOpsKeys.queueStats(),
    queryFn: () => adminApi.aiOps.getQueueStats(),
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000,
  })
}

export function useAIJobs(params?: {
  status?: string
  jobType?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: aiOpsKeys.jobList(params),
    queryFn: () => adminApi.aiOps.listJobs(params),
    placeholderData: (previousData) => previousData,
    refetchInterval: 10000,
  })
}

export function useAIJobDetail(jobId: string) {
  return useQuery({
    queryKey: aiOpsKeys.jobDetail(jobId),
    queryFn: () => adminApi.aiOps.getJob(jobId),
    enabled: !!jobId,
  })
}

export function useRetryAIJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => adminApi.aiOps.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiOpsKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: aiOpsKeys.queueStats() })
      toast.success('Job queued for retry')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to retry job')
    },
  })
}

export function useCancelAIJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => adminApi.aiOps.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiOpsKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: aiOpsKeys.queueStats() })
      toast.success('Job cancelled')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel job')
    },
  })
}

export function useAIPrompts() {
  return useQuery({
    queryKey: aiOpsKeys.prompts(),
    queryFn: () => adminApi.aiOps.listPrompts(),
    staleTime: 60000,
  })
}

export function useAIPromptDetail(promptId: string) {
  return useQuery({
    queryKey: aiOpsKeys.promptDetail(promptId),
    queryFn: () => adminApi.aiOps.getPrompt(promptId),
    enabled: !!promptId,
  })
}

export function useUpdateAIPrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ promptId, template }: { promptId: string; template: string }) =>
      adminApi.aiOps.updatePrompt(promptId, template),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aiOpsKeys.prompts() })
      queryClient.invalidateQueries({ queryKey: aiOpsKeys.promptDetail(variables.promptId) })
      toast.success('Prompt updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update prompt')
    },
  })
}
