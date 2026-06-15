import axios from 'axios'

// Mock axios before importing admin APIs
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockAxios,
    ...mockAxios,
  }
})

// Mock localStorage
const mockStorage: Record<string, string> = {}
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value },
    removeItem: (key: string) => { delete mockStorage[key] },
    clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]) },
  },
  writable: true,
})

import {
  adminAuthApi,
  adminDashboardApi,
  adminUsersApi,
  adminOrganizationsApi,
  adminBillingApi,
  adminAuditApi,
  adminManagementApi,
  adminAiOpsApi,
  adminApi,
} from '@/lib/api/admin'
import { adminClient, adminTokens } from '@/lib/api/client'

describe('adminAuthApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  })

  describe('login', () => {
    it('should call login endpoint with credentials', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { accessToken: 'token', refreshToken: 'refresh', user: { id: '1' } },
        },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuthApi.login({ email: 'test@example.com', password: 'password' })

      expect(adminClient.post).toHaveBeenCalledWith('/admin/auth/login', {
        email: 'test@example.com',
        password: 'password',
      })
      expect(result).toEqual({ accessToken: 'token', refreshToken: 'refresh', user: { id: '1' } })
    })
  })

  describe('verifyMfa', () => {
    it('should call MFA verify endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { accessToken: 'token', refreshToken: 'refresh', user: { id: '1' } },
        },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuthApi.verifyMfa({ sessionToken: 'session', code: '123456' })

      expect(adminClient.post).toHaveBeenCalledWith('/admin/auth/mfa/verify', {
        sessionToken: 'session',
        code: '123456',
      })
      expect(result).toBeDefined()
    })
  })

  describe('logout', () => {
    it('should call logout and clear tokens', async () => {
      mockStorage['admin_access_token'] = 'token';
      (adminClient.post as jest.Mock).mockResolvedValue({})

      await adminAuthApi.logout()

      expect(adminClient.post).toHaveBeenCalledWith('/admin/auth/logout')
    })
  })

  describe('me', () => {
    it('should fetch current user', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: '1', email: 'admin@test.com', name: 'Admin' },
        },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuthApi.me()

      expect(adminClient.get).toHaveBeenCalledWith('/admin/auth/me')
      expect(result).toEqual({ id: '1', email: 'admin@test.com', name: 'Admin' })
    })
  })

  describe('changePassword', () => {
    it('should call change password endpoint', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminAuthApi.changePassword({
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      })

      expect(adminClient.post).toHaveBeenCalledWith('/admin/auth/change-password', {
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      })
    })
  })

  describe('setupMfa', () => {
    it('should call MFA setup endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { secret: 'secret', qrCode: 'qr-code' },
        },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuthApi.setupMfa()

      expect(adminClient.post).toHaveBeenCalledWith('/admin/auth/mfa/setup')
      expect(result).toEqual({ secret: 'secret', qrCode: 'qr-code' })
    })
  })

  describe('confirmMfa', () => {
    it('should confirm MFA with code', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { backupCodes: ['code1', 'code2'] },
        },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuthApi.confirmMfa('123456')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/auth/mfa/confirm', { code: '123456' })
      expect(result).toEqual({ backupCodes: ['code1', 'code2'] })
    })
  })

  describe('disableMfa', () => {
    it('should disable MFA', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminAuthApi.disableMfa('password', '123456')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/auth/mfa/disable', {
        password: 'password',
        code: '123456',
      })
    })
  })
})

describe('adminDashboardApi', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getMetrics', () => {
    it('should fetch dashboard metrics', async () => {
      const mockResponse = {
        data: { success: true, data: { totalUsers: 100 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminDashboardApi.getMetrics('30d')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/dashboard/metrics', { params: { period: '30d' } })
      expect(result).toEqual({ totalUsers: 100 })
    })
  })

  describe('getHealth', () => {
    it('should fetch system health', async () => {
      const mockResponse = {
        data: { success: true, data: { status: 'healthy' } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminDashboardApi.getHealth()

      expect(adminClient.get).toHaveBeenCalledWith('/admin/dashboard/health')
      expect(result).toEqual({ status: 'healthy' })
    })
  })

  describe('getAlerts', () => {
    it('should fetch system alerts', async () => {
      const mockResponse = {
        data: { success: true, data: { alerts: [], totalCount: 0 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminDashboardApi.getAlerts('active', 'high')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/dashboard/alerts', {
        params: { status: 'active', priority: 'high' },
      })
      expect(result).toEqual({ alerts: [], totalCount: 0 })
    })
  })

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminDashboardApi.acknowledgeAlert('alert-1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/dashboard/alerts/alert-1/acknowledge')
    })
  })

  describe('resolveAlert', () => {
    it('should resolve alert', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminDashboardApi.resolveAlert('alert-1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/dashboard/alerts/alert-1/resolve')
    })
  })

  describe('getRecentActivity', () => {
    it('should fetch recent activity', async () => {
      const mockResponse = {
        data: { success: true, data: [{ id: '1', action: 'login' }] },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminDashboardApi.getRecentActivity(10)

      expect(adminClient.get).toHaveBeenCalledWith('/admin/dashboard/activity', { params: { limit: 10 } })
      expect(result).toEqual([{ id: '1', action: 'login' }])
    })
  })
})

describe('adminUsersApi', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('list', () => {
    it('should list users', async () => {
      const mockResponse = {
        data: { success: true, data: { items: [], totalCount: 0 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminUsersApi.list({ search: 'test' })

      expect(adminClient.get).toHaveBeenCalledWith('/admin/users', { params: { search: 'test' } })
      expect(result).toEqual({ items: [], totalCount: 0 })
    })
  })

  describe('get', () => {
    it('should get user by id', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '1', email: 'test@test.com' } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminUsersApi.get('1')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/users/1')
      expect(result).toEqual({ id: '1', email: 'test@test.com' })
    })
  })

  describe('suspend', () => {
    it('should suspend user', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminUsersApi.suspend('1', 'Policy violation', 'Additional notes')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/users/1/suspend', {
        reason: 'Policy violation',
        notes: 'Additional notes',
      })
    })
  })

  describe('unsuspend', () => {
    it('should unsuspend user', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminUsersApi.unsuspend('1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/users/1/unsuspend')
    })
  })

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminUsersApi.resetPassword('1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/users/1/reset-password')
    })
  })

  describe('impersonate', () => {
    it('should create impersonation session', async () => {
      const mockResponse = {
        data: { success: true, data: { impersonationToken: 'token', expiresAt: '2024-01-01', url: '/app' } },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminUsersApi.impersonate('1', 'Support request', true)

      expect(adminClient.post).toHaveBeenCalledWith('/admin/users/1/impersonate', {
        reason: 'Support request',
        readOnly: true,
      })
      expect(result).toEqual({ impersonationToken: 'token', expiresAt: '2024-01-01', url: '/app' })
    })

    it('should default to readOnly true', async () => {
      const mockResponse = {
        data: { success: true, data: { impersonationToken: 'token', expiresAt: '2024-01-01', url: '/app' } },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      await adminUsersApi.impersonate('1', 'Support request')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/users/1/impersonate', {
        reason: 'Support request',
        readOnly: true,
      })
    })
  })

  describe('endImpersonation', () => {
    it('should end impersonation session', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminUsersApi.endImpersonation('1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/users/1/impersonate/end')
    })
  })

  describe('delete', () => {
    it('should delete user', async () => {
      (adminClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminUsersApi.delete('1', 'GDPR request', true, true)

      expect(adminClient.delete).toHaveBeenCalledWith('/admin/users/1', {
        data: { reason: 'GDPR request', gdprRequest: true, confirmed: true },
      })
    })
  })
})

describe('adminOrganizationsApi', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('list', () => {
    it('should list organizations', async () => {
      const mockResponse = {
        data: { success: true, data: { items: [], totalCount: 0 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminOrganizationsApi.list()

      expect(adminClient.get).toHaveBeenCalledWith('/admin/organizations', { params: undefined })
      expect(result).toEqual({ items: [], totalCount: 0 })
    })
  })

  describe('get', () => {
    it('should get organization by id', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '1', name: 'Test Org' } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminOrganizationsApi.get('1')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/organizations/1')
      expect(result).toEqual({ id: '1', name: 'Test Org' })
    })
  })

  describe('update', () => {
    it('should update organization', async () => {
      (adminClient.patch as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminOrganizationsApi.update('1', { name: 'Updated Org' })

      expect(adminClient.patch).toHaveBeenCalledWith('/admin/organizations/1', { name: 'Updated Org' })
    })
  })

  describe('suspend', () => {
    it('should suspend organization', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminOrganizationsApi.suspend('1', 'Policy violation', 'Notes here')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/organizations/1/suspend', {
        reason: 'Policy violation',
        notes: 'Notes here',
      })
    })
  })

  describe('unsuspend', () => {
    it('should unsuspend organization', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminOrganizationsApi.unsuspend('1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/organizations/1/unsuspend')
    })
  })

  describe('applyCredit', () => {
    it('should apply credit to organization', async () => {
      const mockResponse = {
        data: { success: true, data: { creditId: 'c1', amount: 100 } },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminOrganizationsApi.applyCredit('1', 100, 'Promotion', 'promotional')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/organizations/1/credits', {
        amount: 100,
        reason: 'Promotion',
        type: 'promotional',
        expiresAt: undefined,
      })
      expect(result).toEqual({ creditId: 'c1', amount: 100 })
    })

    it('should apply credit with expiration', async () => {
      const mockResponse = {
        data: { success: true, data: { creditId: 'c1', amount: 100, expiresAt: '2025-01-01' } },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminOrganizationsApi.applyCredit('1', 100, 'Promotion', 'promotional', '2025-01-01')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/organizations/1/credits', {
        amount: 100,
        reason: 'Promotion',
        type: 'promotional',
        expiresAt: '2025-01-01',
      })
      expect(result).toEqual({ creditId: 'c1', amount: 100, expiresAt: '2025-01-01' })
    })
  })

  describe('getCredits', () => {
    it('should get organization credits', async () => {
      const mockResponse = {
        data: { success: true, data: [{ id: 'c1', amount: 100 }] },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminOrganizationsApi.getCredits('1')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/organizations/1/credits')
      expect(result).toEqual([{ id: 'c1', amount: 100 }])
    })
  })

  describe('delete', () => {
    it('should delete organization', async () => {
      (adminClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminOrganizationsApi.delete('1', 'GDPR request', true, true)

      expect(adminClient.delete).toHaveBeenCalledWith('/admin/organizations/1', {
        data: { reason: 'GDPR request', gdprRequest: true, confirmed: true },
      })
    })
  })
})

describe('adminBillingApi', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getOverview', () => {
    it('should get billing overview', async () => {
      const mockResponse = {
        data: { success: true, data: { mrr: 10000 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminBillingApi.getOverview('30d')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/billing/overview', { params: { period: '30d' } })
      expect(result).toEqual({ mrr: 10000 })
    })
  })

  describe('listSubscriptions', () => {
    it('should list subscriptions', async () => {
      const mockResponse = {
        data: { success: true, data: { items: [], totalCount: 0 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminBillingApi.listSubscriptions({ status: 'active' })

      expect(adminClient.get).toHaveBeenCalledWith('/admin/billing/subscriptions', { params: { status: 'active' } })
      expect(result).toEqual({ items: [], totalCount: 0 })
    })
  })

  describe('getSubscription', () => {
    it('should get subscription by id', async () => {
      const mockResponse = {
        data: { success: true, data: { id: 'sub-1', status: 'active' } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminBillingApi.getSubscription('sub-1')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/billing/subscriptions/sub-1')
      expect(result).toEqual({ id: 'sub-1', status: 'active' })
    })
  })

  describe('overridePlan', () => {
    it('should override subscription plan', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminBillingApi.overridePlan('sub-1', 'enterprise', 'Customer request', true)

      expect(adminClient.post).toHaveBeenCalledWith('/admin/billing/subscriptions/sub-1/override-plan', {
        planCode: 'enterprise',
        reason: 'Customer request',
        prorate: true,
      })
    })

    it('should default prorate to true', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminBillingApi.overridePlan('sub-1', 'enterprise', 'Customer request')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/billing/subscriptions/sub-1/override-plan', {
        planCode: 'enterprise',
        reason: 'Customer request',
        prorate: true,
      })
    })
  })

  describe('processRefund', () => {
    it('should process refund', async () => {
      const mockResponse = {
        data: { success: true, data: { refundId: 'r1', amount: 50, status: 'processed' } },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminBillingApi.processRefund('pay-1', 50, 'Customer complaint')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/billing/payments/pay-1/refund', {
        amount: 50,
        reason: 'Customer complaint',
      })
      expect(result).toEqual({ refundId: 'r1', amount: 50, status: 'processed' })
    })
  })

  describe('listInvoices', () => {
    it('should list invoices', async () => {
      const mockResponse = {
        data: { success: true, data: { items: [], totalCount: 0 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminBillingApi.listInvoices({ status: 'paid' })

      expect(adminClient.get).toHaveBeenCalledWith('/admin/billing/invoices', { params: { status: 'paid' } })
      expect(result).toEqual({ items: [], totalCount: 0 })
    })
  })
})

describe('adminAuditApi', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('search', () => {
    it('should search audit logs', async () => {
      const mockResponse = {
        data: { success: true, data: { items: [], totalCount: 0 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuditApi.search({ page: 1 })

      expect(adminClient.get).toHaveBeenCalledWith('/admin/audit', { params: { page: 1 } })
      expect(result).toEqual({ items: [], totalCount: 0 })
    })
  })

  describe('get', () => {
    it('should get audit log by id', async () => {
      const mockResponse = {
        data: { success: true, data: { id: 'a1', action: 'login' } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuditApi.get('a1')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/audit/a1')
      expect(result).toEqual({ id: 'a1', action: 'login' })
    })
  })

  describe('export', () => {
    it('should export audit logs', async () => {
      const mockBlob = new Blob(['csv']);
      (adminClient.post as jest.Mock).mockResolvedValue({ data: mockBlob })

      const result = await adminAuditApi.export({ action: 'login' })

      expect(adminClient.post).toHaveBeenCalledWith('/admin/audit/export', { action: 'login' }, { responseType: 'blob' })
      expect(result).toBe(mockBlob)
    })
  })

  describe('getActionTypes', () => {
    it('should get action types', async () => {
      const mockResponse = {
        data: { success: true, data: ['login', 'logout', 'create'] },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuditApi.getActionTypes()

      expect(adminClient.get).toHaveBeenCalledWith('/admin/audit/actions')
      expect(result).toEqual(['login', 'logout', 'create'])
    })
  })

  describe('getTargetTypes', () => {
    it('should get target types', async () => {
      const mockResponse = {
        data: { success: true, data: ['user', 'organization'] },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuditApi.getTargetTypes()

      expect(adminClient.get).toHaveBeenCalledWith('/admin/audit/target-types')
      expect(result).toEqual(['user', 'organization'])
    })
  })

  describe('getStats', () => {
    it('should get audit stats', async () => {
      const mockResponse = {
        data: { success: true, data: { totalActions: 100 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAuditApi.getStats('30d')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/audit/stats', { params: { period: '30d' } })
      expect(result).toEqual({ totalActions: 100 })
    })
  })
})

describe('adminManagementApi', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('list', () => {
    it('should list admin users', async () => {
      const mockResponse = {
        data: { success: true, data: { items: [], totalCount: 0 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminManagementApi.list({ search: 'admin' })

      expect(adminClient.get).toHaveBeenCalledWith('/admin/admins', { params: { search: 'admin' } })
      expect(result).toEqual({ items: [], totalCount: 0 })
    })
  })

  describe('get', () => {
    it('should get admin by id', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '1', email: 'admin@test.com' } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminManagementApi.get('1')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/admins/1')
      expect(result).toEqual({ id: '1', email: 'admin@test.com' })
    })
  })

  describe('create', () => {
    it('should create admin user', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '1', email: 'new@admin.com' } },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminManagementApi.create({
        email: 'new@admin.com',
        name: 'New Admin',
        password: 'password',
        role: 'operations_admin',
      })

      expect(adminClient.post).toHaveBeenCalledWith('/admin/admins', {
        email: 'new@admin.com',
        name: 'New Admin',
        password: 'password',
        role: 'operations_admin',
      })
      expect(result).toEqual({ id: '1', email: 'new@admin.com' })
    })
  })

  describe('update', () => {
    it('should update admin user', async () => {
      (adminClient.patch as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminManagementApi.update('1', { name: 'Updated Name', role: 'super_admin' })

      expect(adminClient.patch).toHaveBeenCalledWith('/admin/admins/1', {
        name: 'Updated Name',
        role: 'super_admin',
      })
    })
  })

  describe('suspend', () => {
    it('should suspend admin', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminManagementApi.suspend('1', 'Policy violation')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/admins/1/suspend', { reason: 'Policy violation' })
    })
  })

  describe('reactivate', () => {
    it('should reactivate admin', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminManagementApi.reactivate('1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/admins/1/reactivate')
    })
  })

  describe('resetPassword', () => {
    it('should reset admin password', async () => {
      const mockResponse = {
        data: { success: true, data: { temporaryPassword: 'temp123', message: 'Password reset' } },
      };
      (adminClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminManagementApi.resetPassword('1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/admins/1/reset-password')
      expect(result).toEqual({ temporaryPassword: 'temp123', message: 'Password reset' })
    })
  })

  describe('disableMfa', () => {
    it('should disable MFA', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminManagementApi.disableMfa('1', 'Lost device')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/admins/1/disable-mfa', { reason: 'Lost device' })
    })
  })

  describe('delete', () => {
    it('should delete admin', async () => {
      (adminClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminManagementApi.delete('1')

      expect(adminClient.delete).toHaveBeenCalledWith('/admin/admins/1')
    })
  })

  describe('getRoles', () => {
    it('should get available roles', async () => {
      const mockResponse = {
        data: { success: true, data: [{ code: 'super_admin', name: 'Super Admin', defaultPermissions: [] }] },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminManagementApi.getRoles()

      expect(adminClient.get).toHaveBeenCalledWith('/admin/admins/roles')
      expect(result).toEqual([{ code: 'super_admin', name: 'Super Admin', defaultPermissions: [] }])
    })
  })
})

describe('adminAiOpsApi', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getQueueStats', () => {
    it('should get AI queue stats', async () => {
      const mockResponse = {
        data: { success: true, data: { totalPending: 10 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAiOpsApi.getQueueStats()

      expect(adminClient.get).toHaveBeenCalledWith('/admin/ai/queue/stats')
      expect(result).toEqual({ totalPending: 10 })
    })
  })

  describe('listJobs', () => {
    it('should list AI jobs', async () => {
      const mockResponse = {
        data: { success: true, data: { items: [], totalCount: 0 } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAiOpsApi.listJobs({ status: 'pending' })

      expect(adminClient.get).toHaveBeenCalledWith('/admin/ai/jobs', { params: { status: 'pending' } })
      expect(result).toEqual({ items: [], totalCount: 0 })
    })
  })

  describe('getJob', () => {
    it('should get AI job by id', async () => {
      const mockResponse = {
        data: { success: true, data: { id: 'job-1', status: 'pending' } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAiOpsApi.getJob('job-1')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/ai/jobs/job-1')
      expect(result).toEqual({ id: 'job-1', status: 'pending' })
    })
  })

  describe('retryJob', () => {
    it('should retry AI job', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminAiOpsApi.retryJob('job-1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/ai/jobs/job-1/retry')
    })
  })

  describe('cancelJob', () => {
    it('should cancel AI job', async () => {
      (adminClient.post as jest.Mock).mockResolvedValue({ data: { success: true } })

      await adminAiOpsApi.cancelJob('job-1')

      expect(adminClient.post).toHaveBeenCalledWith('/admin/ai/jobs/job-1/cancel')
    })
  })

  describe('listPrompts', () => {
    it('should list AI prompts', async () => {
      const mockResponse = {
        data: { success: true, data: [{ id: 'p1', name: 'Classification' }] },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAiOpsApi.listPrompts()

      expect(adminClient.get).toHaveBeenCalledWith('/admin/ai/prompts')
      expect(result).toEqual([{ id: 'p1', name: 'Classification' }])
    })
  })

  describe('getPrompt', () => {
    it('should get AI prompt by id', async () => {
      const mockResponse = {
        data: { success: true, data: { id: 'p1', name: 'Classification', template: 'content' } },
      };
      (adminClient.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAiOpsApi.getPrompt('p1')

      expect(adminClient.get).toHaveBeenCalledWith('/admin/ai/prompts/p1')
      expect(result).toEqual({ id: 'p1', name: 'Classification', template: 'content' })
    })
  })

  describe('updatePrompt', () => {
    it('should update AI prompt', async () => {
      const mockResponse = {
        data: { success: true, data: { id: 'p1', template: 'new template' } },
      };
      (adminClient.put as jest.Mock).mockResolvedValue(mockResponse)

      const result = await adminAiOpsApi.updatePrompt('p1', 'new template')

      expect(adminClient.put).toHaveBeenCalledWith('/admin/ai/prompts/p1', { template: 'new template' })
      expect(result).toEqual({ id: 'p1', template: 'new template' })
    })
  })
})

describe('adminApi', () => {
  it('should export all API namespaces', () => {
    expect(adminApi.auth).toBe(adminAuthApi)
    expect(adminApi.dashboard).toBe(adminDashboardApi)
    expect(adminApi.users).toBe(adminUsersApi)
    expect(adminApi.organizations).toBe(adminOrganizationsApi)
    expect(adminApi.billing).toBe(adminBillingApi)
    expect(adminApi.audit).toBe(adminAuditApi)
    expect(adminApi.management).toBe(adminManagementApi)
    expect(adminApi.aiOps).toBe(adminAiOpsApi)
    expect(adminApi.tokens).toBe(adminTokens)
  })
})
