import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  aiOpsKeys,
  useAIQueueStats,
  useAIJobs,
  useRetryAIJob,
  useCancelAIJob,
  useAIPrompts,
  useUpdateAIPrompt,
} from '@/hooks/use-ai-ops'

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    aiOps: {
      getQueueStats: jest.fn(),
      listJobs: jest.fn(),
      retryJob: jest.fn(),
      cancelJob: jest.fn(),
      listPrompts: jest.fn(),
      updatePrompt: jest.fn(),
    },
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { adminApi } from '@/lib/api/admin'
import { toast } from 'sonner'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('aiOpsKeys', () => {
  it('should generate correct query keys', () => {
    expect(aiOpsKeys.all).toEqual(['ai-ops'])
    expect(aiOpsKeys.queueStats()).toEqual(['ai-ops', 'queue-stats'])
    expect(aiOpsKeys.jobs()).toEqual(['ai-ops', 'jobs'])
    expect(aiOpsKeys.jobList({ status: 'pending' })).toEqual(['ai-ops', 'jobs', 'list', { status: 'pending' }])
    expect(aiOpsKeys.jobDetail('123')).toEqual(['ai-ops', 'jobs', 'detail', '123'])
    expect(aiOpsKeys.prompts()).toEqual(['ai-ops', 'prompts'])
    expect(aiOpsKeys.promptDetail('456')).toEqual(['ai-ops', 'prompts', 'detail', '456'])
  })
})

describe('useAIQueueStats', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch queue stats', async () => {
    const mockStats = {
      totalPending: 10,
      totalProcessing: 5,
      totalCompleted: 100,
      totalFailed: 2,
      successRate: 98,
      avgProcessingTimeMs: 1500,
    };
    (adminApi.aiOps.getQueueStats as jest.Mock).mockResolvedValue(mockStats)

    const { result } = renderHook(() => useAIQueueStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockStats)
  })
})

describe('useAIJobs', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch AI jobs', async () => {
    const mockData = {
      items: [{ id: '1', jobType: 'classification', status: 'pending' }],
      totalCount: 1,
    };
    (adminApi.aiOps.listJobs as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useAIJobs({ status: 'pending' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })
})

describe('useRetryAIJob', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should retry job', async () => {
    (adminApi.aiOps.retryJob as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useRetryAIJob(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('job-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Job queued for retry')
  })

  it('should handle error', async () => {
    (adminApi.aiOps.retryJob as jest.Mock).mockRejectedValue(new Error('Retry failed'))

    const { result } = renderHook(() => useRetryAIJob(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('job-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Retry failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.aiOps.retryJob as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useRetryAIJob(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('job-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to retry job')
  })
})

describe('useCancelAIJob', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should cancel job', async () => {
    (adminApi.aiOps.cancelJob as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useCancelAIJob(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('job-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Job cancelled')
  })

  it('should handle error', async () => {
    (adminApi.aiOps.cancelJob as jest.Mock).mockRejectedValue(new Error('Cancel failed'))

    const { result } = renderHook(() => useCancelAIJob(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('job-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Cancel failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.aiOps.cancelJob as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useCancelAIJob(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('job-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to cancel job')
  })
})

describe('useAIPrompts', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch prompts', async () => {
    const mockPrompts = [
      { id: '1', name: 'Classification', version: 1, isActive: true },
    ];
    (adminApi.aiOps.listPrompts as jest.Mock).mockResolvedValue(mockPrompts)

    const { result } = renderHook(() => useAIPrompts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPrompts)
  })
})

describe('useUpdateAIPrompt', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should update prompt', async () => {
    (adminApi.aiOps.updatePrompt as jest.Mock).mockResolvedValue({ id: '1' })

    const { result } = renderHook(() => useUpdateAIPrompt(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ promptId: '1', template: 'New template' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Prompt updated successfully')
  })

  it('should handle error', async () => {
    (adminApi.aiOps.updatePrompt as jest.Mock).mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateAIPrompt(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ promptId: '1', template: 'New template' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Update failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.aiOps.updatePrompt as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useUpdateAIPrompt(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ promptId: '1', template: 'New template' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to update prompt')
  })
})
