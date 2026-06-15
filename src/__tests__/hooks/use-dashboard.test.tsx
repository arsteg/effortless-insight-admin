import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  dashboardKeys,
  useDashboardMetrics,
  useSystemHealth,
  useSystemAlerts,
  useRecentActivity,
  useAcknowledgeAlert,
  useResolveAlert,
} from '@/hooks/use-dashboard'

// Mock the API module
jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    dashboard: {
      getMetrics: jest.fn(),
      getHealth: jest.fn(),
      getAlerts: jest.fn(),
      getRecentActivity: jest.fn(),
      acknowledgeAlert: jest.fn(),
      resolveAlert: jest.fn(),
    },
  },
}))

// Mock sonner toast
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

describe('dashboardKeys', () => {
  it('should generate correct query keys', () => {
    expect(dashboardKeys.all).toEqual(['dashboard'])
    expect(dashboardKeys.metrics('24h')).toEqual(['dashboard', 'metrics', '24h'])
    expect(dashboardKeys.health()).toEqual(['dashboard', 'health'])
    expect(dashboardKeys.alerts('active', 'high')).toEqual(['dashboard', 'alerts', 'active', 'high'])
    expect(dashboardKeys.activity(10)).toEqual(['dashboard', 'activity', 10])
  })
})

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch metrics successfully', async () => {
    const mockMetrics = {
      users: { total: 100, active: 80, new: 10, growth: 5 },
      organizations: { total: 50, active: 45, new: 5 },
      notices: { total: 1000, processing: 10, completed: 980, failed: 10, avgProcessingTimeSeconds: 2.5 },
      revenue: { mrr: 50000, arr: 600000, collected: 45000, refunds: 500 },
    };
    (adminApi.dashboard.getMetrics as jest.Mock).mockResolvedValue(mockMetrics)

    const { result } = renderHook(() => useDashboardMetrics('24h'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockMetrics)
    expect(adminApi.dashboard.getMetrics).toHaveBeenCalledWith('24h')
  })

  it('should handle fetch error', async () => {
    (adminApi.dashboard.getMetrics as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Network error')
  })
})

describe('useSystemHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch system health successfully', async () => {
    const mockHealth = {
      status: 'healthy',
      components: [
        { name: 'API', status: 'healthy', latencyMs: 50 },
        { name: 'Database', status: 'healthy', latencyMs: 10 },
      ],
      lastCheckedAt: '2024-01-01T00:00:00Z',
    };
    (adminApi.dashboard.getHealth as jest.Mock).mockResolvedValue(mockHealth)

    const { result } = renderHook(() => useSystemHealth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockHealth)
  })
})

describe('useSystemAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch alerts with filters', async () => {
    const mockAlerts = {
      alerts: [
        { id: '1', title: 'High CPU', status: 'active', priority: 'high', createdAt: '2024-01-01T00:00:00Z' },
      ],
      totalCount: 1,
    };
    (adminApi.dashboard.getAlerts as jest.Mock).mockResolvedValue(mockAlerts)

    const { result } = renderHook(() => useSystemAlerts('active', 'high'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.dashboard.getAlerts).toHaveBeenCalledWith('active', 'high')
    expect(result.current.data).toEqual(mockAlerts)
  })
})

describe('useRecentActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch recent activity with limit', async () => {
    const mockActivity = [
      { id: '1', action: 'user_created', adminUserName: 'Admin', outcome: 'success', createdAt: '2024-01-01T00:00:00Z' },
    ];
    (adminApi.dashboard.getRecentActivity as jest.Mock).mockResolvedValue(mockActivity)

    const { result } = renderHook(() => useRecentActivity(5), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.dashboard.getRecentActivity).toHaveBeenCalledWith(5)
    expect(result.current.data).toEqual(mockActivity)
  })

  it('should use default limit of 10', async () => {
    (adminApi.dashboard.getRecentActivity as jest.Mock).mockResolvedValue([])

    const { result } = renderHook(() => useRecentActivity(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.dashboard.getRecentActivity).toHaveBeenCalledWith(10)
  })
})

describe('useAcknowledgeAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should acknowledge alert successfully', async () => {
    (adminApi.dashboard.acknowledgeAlert as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useAcknowledgeAlert(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('alert-1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.dashboard.acknowledgeAlert).toHaveBeenCalledWith('alert-1')
    expect(toast.success).toHaveBeenCalledWith('Alert acknowledged')
  })

  it('should handle acknowledge error', async () => {
    (adminApi.dashboard.acknowledgeAlert as jest.Mock).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useAcknowledgeAlert(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('alert-1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed')
  })
})

describe('useResolveAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should resolve alert successfully', async () => {
    (adminApi.dashboard.resolveAlert as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useResolveAlert(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('alert-1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.dashboard.resolveAlert).toHaveBeenCalledWith('alert-1')
    expect(toast.success).toHaveBeenCalledWith('Alert resolved')
  })

  it('should handle resolve error', async () => {
    (adminApi.dashboard.resolveAlert as jest.Mock).mockRejectedValue(new Error('Cannot resolve'))

    const { result } = renderHook(() => useResolveAlert(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('alert-1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Cannot resolve')
  })
})
