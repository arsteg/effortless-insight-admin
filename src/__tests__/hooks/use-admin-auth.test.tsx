import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAdminAuth, useMfaSetup } from '@/hooks/use-admin-auth'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import type { AdminUser } from '@/types/admin'

// Mock the stores and api
jest.mock('@/stores/admin-auth-store', () => ({
  useAdminAuthStore: jest.fn(),
}))

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    auth: {
      changePassword: jest.fn(),
      setupMfa: jest.fn(),
      confirmMfa: jest.fn(),
      disableMfa: jest.fn(),
    },
  },
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

const mockAdminUser: AdminUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'super_admin',
  permissions: [],
  mfaEnabled: true,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-01T00:00:00Z',
}

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

describe('useAdminAuth', () => {
  const mockStore = {
    adminUser: mockAdminUser,
    isAuthenticated: true,
    isMfaVerified: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    verifyMfa: jest.fn(),
    logout: jest.fn(),
    loadUser: jest.fn(),
    clearError: jest.fn(),
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    isRole: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAdminAuthStore as unknown as jest.Mock).mockReturnValue(mockStore)
    mockPush.mockClear()
  })

  it('should return store values', () => {
    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.adminUser).toEqual(mockAdminUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should handle login mutation', async () => {
    mockStore.login.mockResolvedValue({ requiresMfa: false })

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.login({ email: 'test@example.com', password: 'password' })
    })

    await waitFor(() => {
      expect(mockStore.login).toHaveBeenCalledWith('test@example.com', 'password')
    })
  })

  it('should redirect to dashboard on successful login without MFA', async () => {
    mockStore.login.mockResolvedValue({ requiresMfa: false })

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.loginAsync({ email: 'test@example.com', password: 'password' })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(toast.success).toHaveBeenCalledWith('Login successful')
    })
  })

  it('should not redirect when MFA is required', async () => {
    mockStore.login.mockResolvedValue({ requiresMfa: true })

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.loginAsync({ email: 'test@example.com', password: 'password' })
    })

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle login error', async () => {
    const error = new Error('Invalid credentials')
    mockStore.login.mockRejectedValue(error)

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.login({ email: 'test@example.com', password: 'wrong' })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  it('should use default login error message', async () => {
    const error = new Error()
    mockStore.login.mockRejectedValue(error)

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.login({ email: 'test@example.com', password: 'wrong' })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed')
    })
  })

  it('should handle verify MFA error', async () => {
    mockStore.verifyMfa.mockRejectedValue(new Error('Invalid code'))

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.verifyMfa('000000')
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid code')
    })
  })

  it('should use default verify MFA error message', async () => {
    const error = new Error()
    mockStore.verifyMfa.mockRejectedValue(error)

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.verifyMfa('000000')
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('MFA verification failed')
    })
  })

  it('should handle verify MFA', async () => {
    mockStore.verifyMfa.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.verifyMfa('123456')
    })

    await waitFor(() => {
      expect(mockStore.verifyMfa).toHaveBeenCalledWith('123456')
      expect(toast.success).toHaveBeenCalledWith('MFA verified successfully')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle logout', async () => {
    mockStore.logout.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.logout()
    })

    await waitFor(() => {
      expect(mockStore.logout).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should handle change password', async () => {
    (adminApi.auth.changePassword as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.changePassword({
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      })
    })

    await waitFor(() => {
      expect(adminApi.auth.changePassword).toHaveBeenCalledWith({
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      })
      expect(toast.success).toHaveBeenCalledWith('Password changed successfully')
    })
  })

  it('should handle change password error', async () => {
    (adminApi.auth.changePassword as jest.Mock).mockRejectedValue(new Error('Wrong password'))

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.changePassword({
        currentPassword: 'wrong',
        newPassword: 'new',
        confirmPassword: 'new',
      })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Wrong password')
    })
  })

  it('should use default change password error message', async () => {
    const error = new Error();
    (adminApi.auth.changePassword as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useAdminAuth(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.changePassword({
        currentPassword: 'wrong',
        newPassword: 'new',
        confirmPassword: 'new',
      })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to change password')
    })
  })
})

describe('useMfaSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle MFA setup', async () => {
    const mockSetupResponse = {
      secret: 'JBSWY3DPEHPK3PXP',
      qrCodeUrl: 'data:image/png;base64,...',
    };
    (adminApi.auth.setupMfa as jest.Mock).mockResolvedValue(mockSetupResponse)

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.setupAsync()
    })

    await waitFor(() => {
      expect(adminApi.auth.setupMfa).toHaveBeenCalled()
      expect(result.current.setupData).toEqual(mockSetupResponse)
    })
  })

  it('should handle MFA setup error', async () => {
    (adminApi.auth.setupMfa as jest.Mock).mockRejectedValue(new Error('Setup failed'))

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.setup()
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Setup failed')
    })
  })

  it('should use default MFA setup error message', async () => {
    const error = new Error();
    (adminApi.auth.setupMfa as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.setup()
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to setup MFA')
    })
  })

  it('should handle MFA confirm error', async () => {
    (adminApi.auth.confirmMfa as jest.Mock).mockRejectedValue(new Error('Invalid code'))

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.confirm('000000')
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid code')
    })
  })

  it('should use default MFA confirm error message', async () => {
    const error = new Error();
    (adminApi.auth.confirmMfa as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.confirm('000000')
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to confirm MFA')
    })
  })

  it('should handle MFA confirm', async () => {
    const mockConfirmResponse = {
      backupCodes: ['code1', 'code2', 'code3'],
    };
    (adminApi.auth.confirmMfa as jest.Mock).mockResolvedValue(mockConfirmResponse)

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.confirmAsync('123456')
    })

    await waitFor(() => {
      expect(adminApi.auth.confirmMfa).toHaveBeenCalledWith('123456')
      expect(toast.success).toHaveBeenCalledWith('MFA enabled successfully')
    })
  })

  it('should handle MFA disable', async () => {
    (adminApi.auth.disableMfa as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.disable({ password: 'password', code: '123456' })
    })

    await waitFor(() => {
      expect(adminApi.auth.disableMfa).toHaveBeenCalledWith('password', '123456')
      expect(toast.success).toHaveBeenCalledWith('MFA disabled successfully')
    })
  })

  it('should handle MFA disable error', async () => {
    (adminApi.auth.disableMfa as jest.Mock).mockRejectedValue(new Error('Invalid code'))

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.disable({ password: 'password', code: '000000' })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid code')
    })
  })

  it('should use default MFA disable error message', async () => {
    const error = new Error();
    (adminApi.auth.disableMfa as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useMfaSetup(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.disable({ password: 'password', code: '000000' })
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to disable MFA')
    })
  })
})
