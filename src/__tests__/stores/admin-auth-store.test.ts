import { act } from '@testing-library/react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import type { AdminUser } from '@/types/admin'

// Mock the API module
jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    auth: {
      login: jest.fn(),
      verifyMfa: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    },
  },
}))

// Mock the tokens module
jest.mock('@/lib/api/client', () => ({
  adminTokens: {
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
    getAccessToken: jest.fn(),
  },
}))

import { adminApi } from '@/lib/api/admin'
import { adminTokens } from '@/lib/api/client'

const mockAdminUser: AdminUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'super_admin',
  permissions: ['users:read', 'users:write'],
  mfaEnabled: true,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-01T00:00:00Z',
}

describe('useAdminAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useAdminAuthStore.setState({
        adminUser: null,
        isAuthenticated: false,
        isMfaVerified: false,
        isLoading: false,
        mfaSessionToken: null,
        error: null,
      })
    })
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAdminAuthStore.getState()
      expect(state.adminUser).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isMfaVerified).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.mfaSessionToken).toBeNull()
      expect(state.error).toBeNull()
    })
  })

  describe('login', () => {
    it('should login successfully without MFA', async () => {
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockAdminUser,
      };
      (adminApi.auth.login as jest.Mock).mockResolvedValue(mockResponse)

      const result = await act(async () => {
        return useAdminAuthStore.getState().login('admin@example.com', 'password')
      })

      expect(result.requiresMfa).toBe(false)
      expect(adminTokens.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token')
      const state = useAdminAuthStore.getState()
      expect(state.adminUser).toEqual(mockAdminUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isMfaVerified).toBe(true)
    })

    it('should handle MFA required response', async () => {
      (adminApi.auth.login as jest.Mock).mockResolvedValue({
        mfaRequired: true,
        sessionToken: 'mfa-session-token',
      })

      const result = await act(async () => {
        return useAdminAuthStore.getState().login('admin@example.com', 'password')
      })

      expect(result.requiresMfa).toBe(true)
      const state = useAdminAuthStore.getState()
      expect(state.mfaSessionToken).toBe('mfa-session-token')
      expect(state.isAuthenticated).toBe(false)
    })

    it('should handle login error', async () => {
      const error = new Error('Invalid credentials');
      (adminApi.auth.login as jest.Mock).mockRejectedValue(error)

      await expect(
        act(async () => {
          return useAdminAuthStore.getState().login('admin@example.com', 'wrong')
        })
      ).rejects.toThrow('Invalid credentials')

      const state = useAdminAuthStore.getState()
      expect(state.error).toBe('Invalid credentials')
      expect(state.isLoading).toBe(false)
    })
  })

  describe('verifyMfa', () => {
    it('should verify MFA successfully', async () => {
      // Set up MFA session
      act(() => {
        useAdminAuthStore.setState({ mfaSessionToken: 'mfa-session-token' })
      })

      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockAdminUser,
      };
      (adminApi.auth.verifyMfa as jest.Mock).mockResolvedValue(mockResponse)

      await act(async () => {
        await useAdminAuthStore.getState().verifyMfa('123456')
      })

      expect(adminTokens.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token')
      const state = useAdminAuthStore.getState()
      expect(state.adminUser).toEqual(mockAdminUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isMfaVerified).toBe(true)
      expect(state.mfaSessionToken).toBeNull()
    })

    it('should throw error when no MFA session token', async () => {
      await expect(
        act(async () => {
          await useAdminAuthStore.getState().verifyMfa('123456')
        })
      ).rejects.toThrow('No MFA session token')
    })

    it('should handle MFA verification error', async () => {
      act(() => {
        useAdminAuthStore.setState({ mfaSessionToken: 'mfa-session-token' })
      })

      const error = new Error('Invalid code');
      (adminApi.auth.verifyMfa as jest.Mock).mockRejectedValue(error)

      await expect(
        act(async () => {
          await useAdminAuthStore.getState().verifyMfa('000000')
        })
      ).rejects.toThrow('Invalid code')

      const state = useAdminAuthStore.getState()
      expect(state.error).toBe('Invalid code')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      act(() => {
        useAdminAuthStore.setState({
          adminUser: mockAdminUser,
          isAuthenticated: true,
          isMfaVerified: true,
        })
      });
      (adminApi.auth.logout as jest.Mock).mockResolvedValue(undefined)

      await act(async () => {
        await useAdminAuthStore.getState().logout()
      })

      expect(adminTokens.clearTokens).toHaveBeenCalled()
      const state = useAdminAuthStore.getState()
      expect(state.adminUser).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isMfaVerified).toBe(false)
    })

    it('should clear state even if logout API fails', async () => {
      act(() => {
        useAdminAuthStore.setState({
          adminUser: mockAdminUser,
          isAuthenticated: true,
        })
      });
      (adminApi.auth.logout as jest.Mock).mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await useAdminAuthStore.getState().logout()
      })

      expect(adminTokens.clearTokens).toHaveBeenCalled()
      const state = useAdminAuthStore.getState()
      expect(state.adminUser).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('loadUser', () => {
    it('should load user when token exists', async () => {
      (adminTokens.getAccessToken as jest.Mock).mockReturnValue('access-token');
      (adminApi.auth.me as jest.Mock).mockResolvedValue(mockAdminUser)

      await act(async () => {
        await useAdminAuthStore.getState().loadUser()
      })

      const state = useAdminAuthStore.getState()
      expect(state.adminUser).toEqual(mockAdminUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isMfaVerified).toBe(true)
    })

    it('should not load user when no token', async () => {
      (adminTokens.getAccessToken as jest.Mock).mockReturnValue(null)

      await act(async () => {
        await useAdminAuthStore.getState().loadUser()
      })

      const state = useAdminAuthStore.getState()
      expect(state.adminUser).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should clear state on API error', async () => {
      (adminTokens.getAccessToken as jest.Mock).mockReturnValue('invalid-token');
      (adminApi.auth.me as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

      await act(async () => {
        await useAdminAuthStore.getState().loadUser()
      })

      expect(adminTokens.clearTokens).toHaveBeenCalled()
      const state = useAdminAuthStore.getState()
      expect(state.adminUser).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error', () => {
      act(() => {
        useAdminAuthStore.setState({ error: 'Some error' })
      })

      act(() => {
        useAdminAuthStore.getState().clearError()
      })

      expect(useAdminAuthStore.getState().error).toBeNull()
    })
  })

  describe('hasPermission', () => {
    it('should return true for super_admin regardless of permission', () => {
      act(() => {
        useAdminAuthStore.setState({ adminUser: mockAdminUser })
      })

      expect(useAdminAuthStore.getState().hasPermission('any:permission')).toBe(true)
    })

    it('should check permissions for non-super_admin', () => {
      const regularAdmin: AdminUser = {
        ...mockAdminUser,
        role: 'operations_admin',
        permissions: ['users:read'],
      }
      act(() => {
        useAdminAuthStore.setState({ adminUser: regularAdmin })
      })

      expect(useAdminAuthStore.getState().hasPermission('users:read')).toBe(true)
      expect(useAdminAuthStore.getState().hasPermission('users:write')).toBe(false)
    })

    it('should return false when no user', () => {
      expect(useAdminAuthStore.getState().hasPermission('users:read')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', () => {
      const regularAdmin: AdminUser = {
        ...mockAdminUser,
        role: 'operations_admin',
        permissions: ['users:read'],
      }
      act(() => {
        useAdminAuthStore.setState({ adminUser: regularAdmin })
      })

      expect(
        useAdminAuthStore.getState().hasAnyPermission(['users:read', 'users:write'])
      ).toBe(true)
    })

    it('should return false if user has none of the permissions', () => {
      const regularAdmin: AdminUser = {
        ...mockAdminUser,
        role: 'operations_admin',
        permissions: ['billing:read'],
      }
      act(() => {
        useAdminAuthStore.setState({ adminUser: regularAdmin })
      })

      expect(
        useAdminAuthStore.getState().hasAnyPermission(['users:read', 'users:write'])
      ).toBe(false)
    })
  })

  describe('isRole', () => {
    it('should return true for matching role', () => {
      act(() => {
        useAdminAuthStore.setState({ adminUser: mockAdminUser })
      })

      expect(useAdminAuthStore.getState().isRole('super_admin')).toBe(true)
    })

    it('should return false for non-matching role', () => {
      act(() => {
        useAdminAuthStore.setState({ adminUser: mockAdminUser })
      })

      expect(useAdminAuthStore.getState().isRole('operations_admin')).toBe(false)
    })

    it('should return false when no user', () => {
      expect(useAdminAuthStore.getState().isRole('super_admin')).toBe(false)
    })
  })
})
