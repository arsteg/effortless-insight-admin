import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  adminManagementKeys,
  useAdminUsers,
  useAdminUserDetail,
  useAdminRoles,
  useCreateAdmin,
  useUpdateAdmin,
  useSuspendAdmin,
  useReactivateAdmin,
  useResetAdminPassword,
  useDisableAdminMfa,
  useDeleteAdmin,
} from '@/hooks/use-admin-management'

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    management: {
      list: jest.fn(),
      get: jest.fn(),
      getRoles: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      suspend: jest.fn(),
      reactivate: jest.fn(),
      resetPassword: jest.fn(),
      disableMfa: jest.fn(),
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

describe('adminManagementKeys', () => {
  it('should generate correct query keys', () => {
    expect(adminManagementKeys.all).toEqual(['admin-management'])
    expect(adminManagementKeys.lists()).toEqual(['admin-management', 'list'])
    expect(adminManagementKeys.list({ search: 'test' })).toEqual(['admin-management', 'list', { search: 'test' }])
    expect(adminManagementKeys.details()).toEqual(['admin-management', 'detail'])
    expect(adminManagementKeys.detail('123')).toEqual(['admin-management', 'detail', '123'])
    expect(adminManagementKeys.roles()).toEqual(['admin-management', 'roles'])
  })
})

describe('useAdminUsers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch admin users', async () => {
    const mockData = {
      items: [{ id: '1', name: 'Admin 1', email: 'admin@test.com' }],
      totalCount: 1,
    };
    (adminApi.management.list as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useAdminUsers({ search: 'admin' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })
})

describe('useAdminUserDetail', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch admin user detail', async () => {
    const mockAdmin = { id: '1', name: 'Admin 1', email: 'admin@test.com' };
    (adminApi.management.get as jest.Mock).mockResolvedValue(mockAdmin)

    const { result } = renderHook(() => useAdminUserDetail('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockAdmin)
  })

  it('should not fetch when adminId is empty', () => {
    const { result } = renderHook(() => useAdminUserDetail(''), {
      wrapper: createWrapper(),
    })

    expect(adminApi.management.get).not.toHaveBeenCalled()
  })
})

describe('useAdminRoles', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch admin roles', async () => {
    const mockRoles = ['super_admin', 'operations_admin', 'support_admin'];
    (adminApi.management.getRoles as jest.Mock).mockResolvedValue(mockRoles)

    const { result } = renderHook(() => useAdminRoles(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockRoles)
  })
})

describe('useCreateAdmin', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should create admin user', async () => {
    (adminApi.management.create as jest.Mock).mockResolvedValue({ id: '1' })

    const { result } = renderHook(() => useCreateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      email: 'new@test.com',
      name: 'New Admin',
      password: 'password123',
      role: 'operations_admin',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Admin user created successfully')
  })

  it('should handle error', async () => {
    (adminApi.management.create as jest.Mock).mockRejectedValue(new Error('Creation failed'))

    const { result } = renderHook(() => useCreateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      email: 'new@test.com',
      name: 'New Admin',
      password: 'password123',
      role: 'operations_admin',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Creation failed')
  })

  it('should use default error message when message is empty', async () => {
    const error = new Error()
    error.message = '';
    (adminApi.management.create as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useCreateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      email: 'new@test.com',
      name: 'New Admin',
      password: 'password123',
      role: 'operations_admin',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to create admin user')
  })
})

describe('useUpdateAdmin', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should update admin user', async () => {
    (adminApi.management.update as jest.Mock).mockResolvedValue({ id: '1' })

    const { result } = renderHook(() => useUpdateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      adminId: '1',
      data: { name: 'Updated Admin', role: 'super_admin' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Admin user updated successfully')
  })

  it('should handle error', async () => {
    (adminApi.management.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      adminId: '1',
      data: { name: 'Updated Admin' },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Update failed')
  })

  it('should use default error message when message is empty', async () => {
    const error = new Error()
    error.message = '';
    (adminApi.management.update as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useUpdateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      adminId: '1',
      data: { name: 'Updated Admin' },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to update admin user')
  })
})

describe('useSuspendAdmin', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should suspend admin user', async () => {
    (adminApi.management.suspend as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useSuspendAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ adminId: '1', reason: 'Policy violation' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Admin user suspended')
  })

  it('should handle error', async () => {
    (adminApi.management.suspend as jest.Mock).mockRejectedValue(new Error('Suspend failed'))

    const { result } = renderHook(() => useSuspendAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ adminId: '1', reason: 'Test' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Suspend failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.management.suspend as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useSuspendAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ adminId: '1', reason: 'Test' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to suspend admin user')
  })
})

describe('useReactivateAdmin', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should reactivate admin user', async () => {
    (adminApi.management.reactivate as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useReactivateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Admin user reactivated')
  })

  it('should handle error', async () => {
    (adminApi.management.reactivate as jest.Mock).mockRejectedValue(new Error('Reactivate failed'))

    const { result } = renderHook(() => useReactivateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Reactivate failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.management.reactivate as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useReactivateAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to reactivate admin user')
  })
})

describe('useResetAdminPassword', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should reset admin password', async () => {
    (adminApi.management.resetPassword as jest.Mock).mockResolvedValue({ temporaryPassword: 'temp123' })

    const { result } = renderHook(() => useResetAdminPassword(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Password reset. Temporary password: temp123')
  })

  it('should handle error', async () => {
    (adminApi.management.resetPassword as jest.Mock).mockRejectedValue(new Error('Reset failed'))

    const { result } = renderHook(() => useResetAdminPassword(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Reset failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.management.resetPassword as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useResetAdminPassword(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to reset password')
  })
})

describe('useDisableAdminMfa', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should disable MFA', async () => {
    (adminApi.management.disableMfa as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDisableAdminMfa(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ adminId: '1', reason: 'Lost device' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('MFA disabled for admin user')
  })

  it('should handle error', async () => {
    (adminApi.management.disableMfa as jest.Mock).mockRejectedValue(new Error('Disable MFA failed'))

    const { result } = renderHook(() => useDisableAdminMfa(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ adminId: '1', reason: 'Test' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Disable MFA failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.management.disableMfa as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useDisableAdminMfa(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ adminId: '1', reason: 'Test' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to disable MFA')
  })
})

describe('useDeleteAdmin', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should delete admin user', async () => {
    (adminApi.management.delete as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Admin user deleted')
  })

  it('should handle error', async () => {
    (adminApi.management.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Delete failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.management.delete as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useDeleteAdmin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to delete admin user')
  })
})
