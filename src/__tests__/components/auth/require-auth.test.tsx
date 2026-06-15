import { render, screen, waitFor } from '@testing-library/react'
import { act } from '@testing-library/react'
import {
  RequireAuth,
  RequirePermission,
  RequireAnyPermission,
  RequireRole,
} from '@/components/auth/require-auth'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import type { AdminUser } from '@/types/admin'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockSuperAdmin: AdminUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Super Admin',
  role: 'super_admin',
  permissions: [],
  mfaEnabled: true,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-01T00:00:00Z',
}

const mockOperationsAdmin: AdminUser = {
  ...mockSuperAdmin,
  id: '2',
  role: 'operations_admin',
  permissions: ['users:read', 'users:write'],
}

// Helper to set store state
const setStoreState = (state: Partial<ReturnType<typeof useAdminAuthStore.getState>>) => {
  const fullState = {
    adminUser: null,
    isAuthenticated: false,
    isMfaVerified: false,
    isLoading: false,
    mfaSessionToken: null,
    error: null,
    login: jest.fn(),
    verifyMfa: jest.fn(),
    logout: jest.fn(),
    loadUser: jest.fn(),
    clearError: jest.fn(),
    hasPermission: (permission: string) => {
      const admin = state.adminUser
      if (!admin) return false
      if (admin.role === 'super_admin') return true
      return admin.permissions.includes(permission)
    },
    hasAnyPermission: (permissions: string[]) => {
      const admin = state.adminUser
      if (!admin) return false
      if (admin.role === 'super_admin') return true
      return permissions.some((p) => admin.permissions.includes(p))
    },
    isRole: (role: string) => state.adminUser?.role === role,
    ...state,
  }
  useAdminAuthStore.setState(fullState)
}

describe('RequireAuth', () => {
  beforeEach(() => {
    mockPush.mockClear()
    setStoreState({
      adminUser: null,
      isAuthenticated: false,
      isMfaVerified: false,
      isLoading: false,
    })
  })

  it('should show loading state', () => {
    setStoreState({ isLoading: true })

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', async () => {
    setStoreState({ isAuthenticated: false, isLoading: false })

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should render children when authenticated', () => {
    setStoreState({
      adminUser: mockSuperAdmin,
      isAuthenticated: true,
      isMfaVerified: true,
      isLoading: false,
    })

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should return null when authenticated but MFA not verified', () => {
    setStoreState({
      adminUser: mockSuperAdmin,
      isAuthenticated: true,
      isMfaVerified: false,
      isLoading: false,
    })

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should check permissions with requireAll false (any permission)', () => {
    setStoreState({
      adminUser: mockOperationsAdmin,
      isAuthenticated: true,
      isMfaVerified: true,
      isLoading: false,
    })

    render(
      <RequireAuth permissions={['users:read', 'billing:read']} requireAll={false}>
        <div>Protected Content</div>
      </RequireAuth>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should check permissions with requireAll true', () => {
    setStoreState({
      adminUser: mockOperationsAdmin,
      isAuthenticated: true,
      isMfaVerified: true,
      isLoading: false,
    })

    render(
      <RequireAuth permissions={['users:read', 'billing:read']} requireAll={true}>
        <div>Protected Content</div>
      </RequireAuth>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('should show access denied when permission check fails', () => {
    setStoreState({
      adminUser: mockOperationsAdmin,
      isAuthenticated: true,
      isMfaVerified: true,
      isLoading: false,
    })

    render(
      <RequireAuth permissions={['billing:manage']}>
        <div>Protected Content</div>
      </RequireAuth>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('should show fallback when provided and access denied', () => {
    setStoreState({
      adminUser: mockOperationsAdmin,
      isAuthenticated: true,
      isMfaVerified: true,
      isLoading: false,
    })

    render(
      <RequireAuth permissions={['billing:manage']} fallback={<div>Custom Fallback</div>}>
        <div>Protected Content</div>
      </RequireAuth>
    )

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })
})

describe('RequirePermission', () => {
  beforeEach(() => {
    setStoreState({
      adminUser: mockOperationsAdmin,
      isAuthenticated: true,
      isMfaVerified: true,
      isLoading: false,
    })
  })

  it('should render children when user has permission', () => {
    render(
      <RequirePermission permission="users:read">
        <div>Has Permission</div>
      </RequirePermission>
    )

    expect(screen.getByText('Has Permission')).toBeInTheDocument()
  })

  it('should return null when user lacks permission', () => {
    render(
      <RequirePermission permission="billing:manage">
        <div>Has Permission</div>
      </RequirePermission>
    )

    expect(screen.queryByText('Has Permission')).not.toBeInTheDocument()
  })

  it('should render fallback when provided and lacks permission', () => {
    render(
      <RequirePermission permission="billing:manage" fallback={<div>No Access</div>}>
        <div>Has Permission</div>
      </RequirePermission>
    )

    expect(screen.getByText('No Access')).toBeInTheDocument()
  })

  it('should allow super_admin to access all permissions', () => {
    setStoreState({ adminUser: mockSuperAdmin })

    render(
      <RequirePermission permission="any:permission">
        <div>Super Admin Access</div>
      </RequirePermission>
    )

    expect(screen.getByText('Super Admin Access')).toBeInTheDocument()
  })
})

describe('RequireAnyPermission', () => {
  beforeEach(() => {
    setStoreState({
      adminUser: mockOperationsAdmin,
      isAuthenticated: true,
      isMfaVerified: true,
      isLoading: false,
    })
  })

  it('should render when user has any of the permissions', () => {
    render(
      <RequireAnyPermission permissions={['users:read', 'billing:read']}>
        <div>Has Any Permission</div>
      </RequireAnyPermission>
    )

    expect(screen.getByText('Has Any Permission')).toBeInTheDocument()
  })

  it('should return null when user has none of the permissions', () => {
    render(
      <RequireAnyPermission permissions={['billing:read', 'billing:manage']}>
        <div>Has Any Permission</div>
      </RequireAnyPermission>
    )

    expect(screen.queryByText('Has Any Permission')).not.toBeInTheDocument()
  })

  it('should render fallback when provided and lacks all permissions', () => {
    render(
      <RequireAnyPermission
        permissions={['billing:read', 'billing:manage']}
        fallback={<div>Fallback Content</div>}
      >
        <div>Has Any Permission</div>
      </RequireAnyPermission>
    )

    expect(screen.getByText('Fallback Content')).toBeInTheDocument()
  })
})

describe('RequireRole', () => {
  beforeEach(() => {
    setStoreState({
      adminUser: mockOperationsAdmin,
      isAuthenticated: true,
      isMfaVerified: true,
      isLoading: false,
    })
  })

  it('should render when user has the role (string)', () => {
    render(
      <RequireRole role="operations_admin">
        <div>Has Role</div>
      </RequireRole>
    )

    expect(screen.getByText('Has Role')).toBeInTheDocument()
  })

  it('should render when user has any of the roles (array)', () => {
    render(
      <RequireRole role={['super_admin', 'operations_admin']}>
        <div>Has Role</div>
      </RequireRole>
    )

    expect(screen.getByText('Has Role')).toBeInTheDocument()
  })

  it('should return null when user lacks the role', () => {
    render(
      <RequireRole role="super_admin">
        <div>Has Role</div>
      </RequireRole>
    )

    expect(screen.queryByText('Has Role')).not.toBeInTheDocument()
  })

  it('should render fallback when provided and lacks role', () => {
    render(
      <RequireRole role="super_admin" fallback={<div>Not Authorized</div>}>
        <div>Has Role</div>
      </RequireRole>
    )

    expect(screen.getByText('Not Authorized')).toBeInTheDocument()
  })

  it('should handle array of roles when user lacks all', () => {
    render(
      <RequireRole role={['super_admin', 'finance_admin']}>
        <div>Has Role</div>
      </RequireRole>
    )

    expect(screen.queryByText('Has Role')).not.toBeInTheDocument()
  })
})
