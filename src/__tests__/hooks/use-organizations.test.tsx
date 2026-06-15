import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  organizationKeys,
  useOrganizations,
  useOrganizationDetail,
  useOrganizationCredits,
  useUpdateOrganization,
  useSuspendOrganization,
  useUnsuspendOrganization,
  useApplyCredit,
  useDeleteOrganization,
} from '@/hooks/use-organizations'

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    organizations: {
      list: jest.fn(),
      get: jest.fn(),
      getCredits: jest.fn(),
      update: jest.fn(),
      suspend: jest.fn(),
      unsuspend: jest.fn(),
      applyCredit: jest.fn(),
      delete: jest.fn(),
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

describe('organizationKeys', () => {
  it('should generate correct query keys', () => {
    expect(organizationKeys.all).toEqual(['organizations'])
    expect(organizationKeys.lists()).toEqual(['organizations', 'list'])
    expect(organizationKeys.list({ search: 'test' })).toEqual(['organizations', 'list', { search: 'test' }])
    expect(organizationKeys.details()).toEqual(['organizations', 'detail'])
    expect(organizationKeys.detail('123')).toEqual(['organizations', 'detail', '123'])
    expect(organizationKeys.credits('org-1')).toEqual(['organizations', 'credits', 'org-1'])
  })
})

describe('useOrganizations', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch organizations', async () => {
    const mockData = { items: [{ id: '1', name: 'Org 1' }], totalCount: 1 };
    (adminApi.organizations.list as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useOrganizations({ search: 'test' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })
})

describe('useOrganizationDetail', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch organization detail', async () => {
    const mockOrg = { id: '1', name: 'Test Org' };
    (adminApi.organizations.get as jest.Mock).mockResolvedValue(mockOrg)

    const { result } = renderHook(() => useOrganizationDetail('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockOrg)
  })

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useOrganizationDetail(''), {
      wrapper: createWrapper(),
    })
    expect(adminApi.organizations.get).not.toHaveBeenCalled()
  })
})

describe('useOrganizationCredits', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch organization credits', async () => {
    const mockCredits = [{ id: 'c1', amount: 100, type: 'promotional' }];
    (adminApi.organizations.getCredits as jest.Mock).mockResolvedValue(mockCredits)

    const { result } = renderHook(() => useOrganizationCredits('org-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCredits)
  })

  it('should not fetch when orgId is empty', () => {
    const { result } = renderHook(() => useOrganizationCredits(''), {
      wrapper: createWrapper(),
    })
    expect(adminApi.organizations.getCredits).not.toHaveBeenCalled()
  })
})

describe('useUpdateOrganization', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should update organization', async () => {
    (adminApi.organizations.update as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useUpdateOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      orgId: '1',
      data: { name: 'Updated Org', industry: 'Tech' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Organization updated successfully')
  })

  it('should handle error', async () => {
    (adminApi.organizations.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      orgId: '1',
      data: { name: 'Updated Org' },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Update failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.organizations.update as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useUpdateOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      orgId: '1',
      data: { name: 'Updated Org' },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to update organization')
  })
})

describe('useSuspendOrganization', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should suspend organization', async () => {
    (adminApi.organizations.suspend as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useSuspendOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ orgId: '1', reason: 'Test reason' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Organization suspended successfully')
  })

  it('should handle error', async () => {
    (adminApi.organizations.suspend as jest.Mock).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useSuspendOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ orgId: '1', reason: 'Test' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.organizations.suspend as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useSuspendOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ orgId: '1', reason: 'Test' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to suspend organization')
  })
})

describe('useUnsuspendOrganization', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should unsuspend organization', async () => {
    (adminApi.organizations.unsuspend as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useUnsuspendOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Organization unsuspended successfully')
  })

  it('should handle error', async () => {
    (adminApi.organizations.unsuspend as jest.Mock).mockRejectedValue(new Error('Unsuspend failed'))

    const { result } = renderHook(() => useUnsuspendOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Unsuspend failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.organizations.unsuspend as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useUnsuspendOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to unsuspend organization')
  })
})

describe('useApplyCredit', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should apply credit', async () => {
    (adminApi.organizations.applyCredit as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useApplyCredit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      orgId: '1',
      amount: 100,
      reason: 'Promotion',
      type: 'promotional',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Credit applied successfully')
  })

  it('should handle error', async () => {
    (adminApi.organizations.applyCredit as jest.Mock).mockRejectedValue(new Error('Credit failed'))

    const { result } = renderHook(() => useApplyCredit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      orgId: '1',
      amount: 100,
      reason: 'Test',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Credit failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.organizations.applyCredit as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useApplyCredit(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      orgId: '1',
      amount: 100,
      reason: 'Test',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to apply credit')
  })
})

describe('useDeleteOrganization', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should delete organization', async () => {
    (adminApi.organizations.delete as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ orgId: '1', reason: 'GDPR request', gdprRequest: true, confirmed: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Organization deleted successfully')
  })

  it('should handle error', async () => {
    (adminApi.organizations.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ orgId: '1', reason: 'Test', gdprRequest: false, confirmed: true })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Delete failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.organizations.delete as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useDeleteOrganization(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ orgId: '1', reason: 'Test', gdprRequest: false, confirmed: true })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to delete organization')
  })
})
