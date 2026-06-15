import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  auditKeys,
  useAuditLogs,
  useAuditStats,
  useAuditActionTypes,
  useAuditTargetTypes,
  useExportAudit,
} from '@/hooks/use-audit'

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    audit: {
      search: jest.fn(),
      getStats: jest.fn(),
      getActionTypes: jest.fn(),
      getTargetTypes: jest.fn(),
      export: jest.fn(),
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

describe('auditKeys', () => {
  it('should generate correct query keys', () => {
    expect(auditKeys.all).toEqual(['audit'])
    expect(auditKeys.search({ page: 1 })).toEqual(['audit', 'search', { page: 1 }])
    expect(auditKeys.stats('24h')).toEqual(['audit', 'stats', '24h'])
    expect(auditKeys.actionTypes()).toEqual(['audit', 'action-types'])
    expect(auditKeys.targetTypes()).toEqual(['audit', 'target-types'])
    expect(auditKeys.detail('123')).toEqual(['audit', 'detail', '123'])
  })
})

describe('useAuditLogs', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch audit logs', async () => {
    const mockData = {
      items: [{ id: '1', action: 'user_created' }],
      totalCount: 1,
    };
    (adminApi.audit.search as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useAuditLogs({ page: 1, pageSize: 25 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })
})

describe('useAuditStats', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch audit stats', async () => {
    const mockStats = {
      totalActions: 100,
      failedActions: 5,
    };
    (adminApi.audit.getStats as jest.Mock).mockResolvedValue(mockStats)

    const { result } = renderHook(() => useAuditStats('24h'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockStats)
  })
})

describe('useAuditActionTypes', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch action types', async () => {
    const mockTypes = ['user_created', 'user_deleted'];
    (adminApi.audit.getActionTypes as jest.Mock).mockResolvedValue(mockTypes)

    const { result } = renderHook(() => useAuditActionTypes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTypes)
  })
})

describe('useAuditTargetTypes', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch target types', async () => {
    const mockTypes = ['user', 'organization'];
    (adminApi.audit.getTargetTypes as jest.Mock).mockResolvedValue(mockTypes)

    const { result } = renderHook(() => useAuditTargetTypes(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTypes)
  })
})

describe('useExportAudit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock URL APIs
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:test')
    global.URL.revokeObjectURL = jest.fn()
  })

  it('should export audit logs', async () => {
    const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
    (adminApi.audit.export as jest.Mock).mockResolvedValue(mockBlob)

    // Store original createElement
    const originalCreateElement = document.createElement.bind(document)
    const mockClick = jest.fn()

    // Mock createElement only for 'a' tags
    document.createElement = jest.fn((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        element.click = mockClick
      }
      return element
    }) as typeof document.createElement

    const { result } = renderHook(() => useExportAudit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({})

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Audit log exported successfully')
    expect(mockClick).toHaveBeenCalled()

    // Restore
    document.createElement = originalCreateElement
  })

  it('should handle export error', async () => {
    (adminApi.audit.export as jest.Mock).mockRejectedValue(new Error('Export failed'))

    const { result } = renderHook(() => useExportAudit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({})

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Export failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.audit.export as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useExportAudit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({})

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to export audit log')
  })
})
