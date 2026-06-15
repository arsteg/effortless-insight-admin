import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  userKeys,
  useUsers,
  useUserDetail,
  useSuspendUser,
  useUnsuspendUser,
  useResetUserPassword,
  useImpersonateUser,
  useEndImpersonation,
  useDeleteUser,
} from '@/hooks/use-users'

// Mock the API module
jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    users: {
      list: jest.fn(),
      get: jest.fn(),
      suspend: jest.fn(),
      unsuspend: jest.fn(),
      resetPassword: jest.fn(),
      impersonate: jest.fn(),
      endImpersonation: jest.fn(),
      delete: jest.fn(),
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

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
})

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

describe('userKeys', () => {
  it('should generate correct query keys', () => {
    expect(userKeys.all).toEqual(['users'])
    expect(userKeys.lists()).toEqual(['users', 'list'])
    expect(userKeys.list({ search: 'john' })).toEqual(['users', 'list', { search: 'john' }])
    expect(userKeys.details()).toEqual(['users', 'detail'])
    expect(userKeys.detail('123')).toEqual(['users', 'detail', '123'])
  })
})

describe('useUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch users list', async () => {
    const mockUsers = {
      items: [{ id: '1', name: 'John', email: 'john@example.com' }],
      totalCount: 1,
      totalPages: 1,
    };
    (adminApi.users.list as jest.Mock).mockResolvedValue(mockUsers)

    const { result } = renderHook(() => useUsers({ search: 'john' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.list).toHaveBeenCalledWith({ search: 'john' })
    expect(result.current.data).toEqual(mockUsers)
  })

  it('should handle fetch error', async () => {
    (adminApi.users.list as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useUserDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch user detail', async () => {
    const mockUser = { id: '1', name: 'John', email: 'john@example.com' };
    (adminApi.users.get as jest.Mock).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useUserDetail('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.get).toHaveBeenCalledWith('1')
    expect(result.current.data).toEqual(mockUser)
  })

  it('should not fetch when userId is empty', () => {
    const { result } = renderHook(() => useUserDetail(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(adminApi.users.get).not.toHaveBeenCalled()
  })
})

describe('useSuspendUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should suspend user successfully', async () => {
    (adminApi.users.suspend as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useSuspendUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ userId: '1', reason: 'Violation', notes: 'Details' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.suspend).toHaveBeenCalledWith('1', 'Violation', 'Details')
    expect(toast.success).toHaveBeenCalledWith('User suspended successfully')
  })

  it('should handle suspend error', async () => {
    (adminApi.users.suspend as jest.Mock).mockRejectedValue(new Error('Cannot suspend'))

    const { result } = renderHook(() => useSuspendUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ userId: '1', reason: 'Test' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Cannot suspend')
  })

  it('should use default suspend error message', async () => {
    const error = new Error();
    (adminApi.users.suspend as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useSuspendUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ userId: '1', reason: 'Test' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to suspend user')
  })
})

describe('useUnsuspendUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should unsuspend user successfully', async () => {
    (adminApi.users.unsuspend as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useUnsuspendUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.unsuspend).toHaveBeenCalledWith('1')
    expect(toast.success).toHaveBeenCalledWith('User unsuspended successfully')
  })

  it('should handle unsuspend error', async () => {
    (adminApi.users.unsuspend as jest.Mock).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useUnsuspendUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed')
  })

  it('should use default unsuspend error message', async () => {
    const error = new Error();
    (adminApi.users.unsuspend as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useUnsuspendUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to unsuspend user')
  })
})

describe('useResetUserPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reset password successfully', async () => {
    (adminApi.users.resetPassword as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useResetUserPassword(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.resetPassword).toHaveBeenCalledWith('1')
    expect(toast.success).toHaveBeenCalledWith('Password reset email sent')
  })

  it('should handle reset error', async () => {
    (adminApi.users.resetPassword as jest.Mock).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useResetUserPassword(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed')
  })

  it('should use default reset error message', async () => {
    const error = new Error();
    (adminApi.users.resetPassword as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useResetUserPassword(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to reset password')
  })
})

describe('useImpersonateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWindowOpen.mockClear()
  })

  it('should impersonate user successfully', async () => {
    const mockResponse = { url: 'https://app.example.com/impersonate/token123' };
    (adminApi.users.impersonate as jest.Mock).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useImpersonateUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ userId: '1', reason: 'Support request' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.impersonate).toHaveBeenCalledWith('1', 'Support request', true)
    expect(toast.success).toHaveBeenCalledWith('Impersonation session started')
    expect(mockWindowOpen).toHaveBeenCalledWith(mockResponse.url, '_blank')
  })

  it('should handle impersonation with readOnly false', async () => {
    (adminApi.users.impersonate as jest.Mock).mockResolvedValue({ url: 'https://example.com' })

    const { result } = renderHook(() => useImpersonateUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ userId: '1', reason: 'Admin action', readOnly: false })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.impersonate).toHaveBeenCalledWith('1', 'Admin action', false)
  })

  it('should handle impersonation error', async () => {
    (adminApi.users.impersonate as jest.Mock).mockRejectedValue(new Error('Not allowed'))

    const { result } = renderHook(() => useImpersonateUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ userId: '1', reason: 'Test' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Not allowed')
  })

  it('should use default impersonation error message', async () => {
    const error = new Error();
    (adminApi.users.impersonate as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useImpersonateUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ userId: '1', reason: 'Test' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to start impersonation')
  })
})

describe('useEndImpersonation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should end impersonation successfully', async () => {
    (adminApi.users.endImpersonation as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useEndImpersonation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.endImpersonation).toHaveBeenCalledWith('1')
    expect(toast.success).toHaveBeenCalledWith('Impersonation session ended')
  })

  it('should handle end impersonation error', async () => {
    (adminApi.users.endImpersonation as jest.Mock).mockRejectedValue(new Error('Session not found'))

    const { result } = renderHook(() => useEndImpersonation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Session not found')
  })

  it('should use default end impersonation error message', async () => {
    const error = new Error();
    (adminApi.users.endImpersonation as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useEndImpersonation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to end impersonation')
  })
})

describe('useDeleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete user successfully', async () => {
    (adminApi.users.delete as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      userId: '1',
      reason: 'GDPR request',
      gdprRequest: true,
      confirmed: true,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(adminApi.users.delete).toHaveBeenCalledWith('1', 'GDPR request', true, true)
    expect(toast.success).toHaveBeenCalledWith('User deleted successfully')
  })

  it('should handle delete error', async () => {
    (adminApi.users.delete as jest.Mock).mockRejectedValue(new Error('Cannot delete'))

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      userId: '1',
      reason: 'Test',
      gdprRequest: false,
      confirmed: true,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Cannot delete')
  })

  it('should use default delete error message', async () => {
    const error = new Error();
    (adminApi.users.delete as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      userId: '1',
      reason: 'Test',
      gdprRequest: false,
      confirmed: true,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to delete user')
  })
})
