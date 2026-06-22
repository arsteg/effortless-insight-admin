import { adminClient, extractData, adminTokens } from './client'
import type {
  AdminLoginRequest, AdminLoginResponse, AdminMfaRequiredResponse, AdminMfaVerifyRequest,
  AdminMfaSetupResponse, AdminChangePasswordRequest, DashboardMetrics, SystemHealth,
  SystemAlert, AdminActivity, AdminUserListItem, AdminUserSearchParams, AdminUserDetailResponse,
  AdminOrganizationListItem, AdminOrganizationSearchParams, AdminOrganizationDetail,
  AdminCreditInfo, BillingOverview, AdminSubscriptionListItem, AdminSubscriptionSearchParams,
  AdminSubscriptionDetail, AdminInvoiceListItem, AuditSearchParams, AuditSearchResult,
  AuditStats, PaginatedResponse, AdminUser, AdminUserDetail,
} from '@/types/admin'

export const adminAuthApi = {
  login: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse | AdminMfaRequiredResponse> => {
    const response = await adminClient.post('/admin/auth/login', credentials)
    return extractData(response)
  },
  verifyMfa: async (request: AdminMfaVerifyRequest): Promise<AdminLoginResponse> => {
    const response = await adminClient.post('/admin/auth/mfa/verify', request)
    return extractData(response)
  },
  logout: async (): Promise<void> => {
    try { await adminClient.post('/admin/auth/logout') } finally { adminTokens.clearTokens() }
  },
  refreshToken: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = adminTokens.getRefreshToken()
    const response = await adminClient.post('/admin/auth/refresh', { refreshToken })
    return extractData(response)
  },
  me: async (): Promise<AdminUser> => {
    const response = await adminClient.get('/admin/auth/me')
    return extractData(response)
  },
  changePassword: async (request: AdminChangePasswordRequest): Promise<void> => {
    await adminClient.post('/admin/auth/change-password', request)
  },
  setupMfa: async (): Promise<AdminMfaSetupResponse> => {
    const response = await adminClient.post('/admin/auth/mfa/setup')
    return extractData(response)
  },
  confirmMfa: async (code: string): Promise<{ backupCodes: string[] }> => {
    const response = await adminClient.post('/admin/auth/mfa/confirm', { code })
    return extractData(response)
  },
  disableMfa: async (password: string, code: string): Promise<void> => {
    await adminClient.post('/admin/auth/mfa/disable', { password, code })
  },
}

export const adminDashboardApi = {
  getMetrics: async (period?: string): Promise<DashboardMetrics> => {
    const response = await adminClient.get('/admin/dashboard/metrics', { params: { period } })
    return extractData(response)
  },
  getHealth: async (): Promise<SystemHealth> => {
    const response = await adminClient.get('/admin/dashboard/health')
    return extractData(response)
  },
  getAlerts: async (status?: string, priority?: string): Promise<{ alerts: SystemAlert[]; totalCount: number }> => {
    const response = await adminClient.get('/admin/dashboard/alerts', { params: { status, priority } })
    return extractData(response)
  },
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await adminClient.post(`/admin/dashboard/alerts/${alertId}/acknowledge`)
  },
  resolveAlert: async (alertId: string): Promise<void> => {
    await adminClient.post(`/admin/dashboard/alerts/${alertId}/resolve`)
  },
  getRecentActivity: async (limit?: number): Promise<AdminActivity[]> => {
    const response = await adminClient.get('/admin/dashboard/activity', { params: { limit } })
    return extractData(response)
  },
}

export const adminUsersApi = {
  list: async (params?: AdminUserSearchParams): Promise<PaginatedResponse<AdminUserListItem>> => {
    const response = await adminClient.get('/admin/users', { params })
    return extractData(response)
  },
  get: async (userId: string): Promise<AdminUserDetailResponse> => {
    const response = await adminClient.get(`/admin/users/${userId}`)
    return extractData(response)
  },
  suspend: async (userId: string, reason: string, notes?: string): Promise<void> => {
    await adminClient.post(`/admin/users/${userId}/suspend`, { reason, notes })
  },
  unsuspend: async (userId: string): Promise<void> => {
    await adminClient.post(`/admin/users/${userId}/unsuspend`)
  },
  resetPassword: async (userId: string): Promise<void> => {
    await adminClient.post(`/admin/users/${userId}/reset-password`)
  },
  impersonate: async (userId: string, reason: string, readOnly?: boolean): Promise<{ impersonationToken: string; expiresAt: string; url: string }> => {
    const response = await adminClient.post(`/admin/users/${userId}/impersonate`, { reason, readOnly: readOnly ?? true })
    return extractData(response)
  },
  endImpersonation: async (userId: string): Promise<void> => {
    await adminClient.post(`/admin/users/${userId}/impersonate/end`)
  },
  delete: async (userId: string, reason: string, gdprRequest: boolean, confirmed: boolean): Promise<void> => {
    await adminClient.delete(`/admin/users/${userId}`, { data: { reason, gdprRequest, confirmed } })
  },
}

export const adminOrganizationsApi = {
  list: async (params?: AdminOrganizationSearchParams): Promise<PaginatedResponse<AdminOrganizationListItem>> => {
    const response = await adminClient.get('/admin/organizations', { params })
    return extractData(response)
  },
  get: async (orgId: string): Promise<AdminOrganizationDetail> => {
    const response = await adminClient.get(`/admin/organizations/${orgId}`)
    return extractData(response)
  },
  update: async (orgId: string, data: { name?: string; industry?: string; website?: string }): Promise<void> => {
    await adminClient.patch(`/admin/organizations/${orgId}`, data)
  },
  suspend: async (orgId: string, reason: string, notes?: string): Promise<void> => {
    await adminClient.post(`/admin/organizations/${orgId}/suspend`, { reason, notes })
  },
  unsuspend: async (orgId: string): Promise<void> => {
    await adminClient.post(`/admin/organizations/${orgId}/unsuspend`)
  },
  applyCredit: async (orgId: string, amount: number, reason: string, type?: string, expiresAt?: string): Promise<{ creditId: string; amount: number; expiresAt?: string }> => {
    const response = await adminClient.post(`/admin/organizations/${orgId}/credits`, { amount, reason, type, expiresAt })
    return extractData(response)
  },
  getCredits: async (orgId: string): Promise<AdminCreditInfo[]> => {
    const response = await adminClient.get(`/admin/organizations/${orgId}/credits`)
    return extractData(response)
  },
  delete: async (orgId: string, reason: string, gdprRequest: boolean, confirmed: boolean): Promise<void> => {
    await adminClient.delete(`/admin/organizations/${orgId}`, { data: { reason, gdprRequest, confirmed } })
  },
}

export const adminBillingApi = {
  getOverview: async (period?: string): Promise<BillingOverview> => {
    const response = await adminClient.get('/admin/billing/overview', { params: { period } })
    return extractData(response)
  },
  listSubscriptions: async (params?: AdminSubscriptionSearchParams): Promise<PaginatedResponse<AdminSubscriptionListItem>> => {
    const response = await adminClient.get('/admin/billing/subscriptions', { params })
    return extractData(response)
  },
  getSubscription: async (subscriptionId: string): Promise<AdminSubscriptionDetail> => {
    const response = await adminClient.get(`/admin/billing/subscriptions/${subscriptionId}`)
    return extractData(response)
  },
  overridePlan: async (subscriptionId: string, planCode: string, reason: string, prorate?: boolean): Promise<void> => {
    await adminClient.post(`/admin/billing/subscriptions/${subscriptionId}/override-plan`, { planCode, reason, prorate: prorate ?? true })
  },
  processRefund: async (paymentId: string, amount: number | null, reason: string): Promise<{ refundId: string; amount: number; status: string }> => {
    const response = await adminClient.post(`/admin/billing/payments/${paymentId}/refund`, { amount, reason })
    return extractData(response)
  },
  listInvoices: async (params?: { search?: string; status?: string; fromDate?: string; toDate?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<AdminInvoiceListItem>> => {
    const response = await adminClient.get('/admin/billing/invoices', { params })
    return extractData(response)
  },
}

export const adminAuditApi = {
  search: async (params?: AuditSearchParams): Promise<AuditSearchResult> => {
    const response = await adminClient.get('/admin/audit', { params })
    return extractData(response)
  },
  get: async (auditId: string): Promise<unknown> => {
    const response = await adminClient.get(`/admin/audit/${auditId}`)
    return extractData(response)
  },
  export: async (params: { adminUserId?: string; action?: string; targetType?: string; startDate?: string; endDate?: string }): Promise<Blob> => {
    const response = await adminClient.post('/admin/audit/export', params, { responseType: 'blob' })
    return response.data
  },
  getActionTypes: async (): Promise<string[]> => {
    const response = await adminClient.get('/admin/audit/actions')
    return extractData(response)
  },
  getTargetTypes: async (): Promise<string[]> => {
    const response = await adminClient.get('/admin/audit/target-types')
    return extractData(response)
  },
  getStats: async (period?: string): Promise<AuditStats> => {
    const response = await adminClient.get('/admin/audit/stats', { params: { period } })
    return extractData(response)
  },
}

export const adminManagementApi = {
  list: async (params?: { search?: string; role?: string; isActive?: boolean; page?: number; pageSize?: number }): Promise<PaginatedResponse<AdminUser>> => {
    const response = await adminClient.get('/admin/admins', { params })
    return extractData(response)
  },
  get: async (adminId: string): Promise<AdminUserDetail> => {
    const response = await adminClient.get(`/admin/admins/${adminId}`)
    return extractData(response)
  },
  create: async (data: { email: string; name: string; password: string; role: string; permissions?: string[]; ipWhitelist?: string[] }): Promise<AdminUser> => {
    const response = await adminClient.post('/admin/admins', data)
    return extractData(response)
  },
  update: async (adminId: string, data: { name?: string; role?: string; permissions?: string[]; ipWhitelist?: string[]; isActive?: boolean }): Promise<void> => {
    await adminClient.patch(`/admin/admins/${adminId}`, data)
  },
  suspend: async (adminId: string, reason: string): Promise<void> => {
    await adminClient.post(`/admin/admins/${adminId}/suspend`, { reason })
  },
  reactivate: async (adminId: string): Promise<void> => {
    await adminClient.post(`/admin/admins/${adminId}/reactivate`)
  },
  resetPassword: async (adminId: string): Promise<{ temporaryPassword: string; message: string }> => {
    const response = await adminClient.post(`/admin/admins/${adminId}/reset-password`)
    return extractData(response)
  },
  disableMfa: async (adminId: string, reason: string): Promise<void> => {
    await adminClient.post(`/admin/admins/${adminId}/disable-mfa`, { reason })
  },
  delete: async (adminId: string): Promise<void> => {
    await adminClient.delete(`/admin/admins/${adminId}`)
  },
  getRoles: async (): Promise<Array<{ code: string; name: string; defaultPermissions: string[] }>> => {
    const response = await adminClient.get('/admin/admins/roles')
    return extractData(response)
  },
}

// AI Operations types
export interface AIJob {
  id: string
  noticeId: string
  organizationId: string
  organizationName: string
  jobType: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  attempts: number
  maxAttempts: number
  errorMessage?: string
  processingTimeMs?: number
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface AIQueueStats {
  totalPending: number
  totalProcessing: number
  totalCompleted: number
  totalFailed: number
  avgProcessingTimeMs: number
  successRate: number
  jobsByType: { type: string; count: number }[]
}

export interface AIPrompt {
  id: string
  name: string
  description: string
  template: string
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const adminAiOpsApi = {
  getQueueStats: async (): Promise<AIQueueStats> => {
    const response = await adminClient.get('/admin/ai/queue/stats')
    return extractData(response)
  },
  listJobs: async (params?: {
    status?: string
    jobType?: string
    page?: number
    pageSize?: number
  }): Promise<PaginatedResponse<AIJob>> => {
    const response = await adminClient.get('/admin/ai/jobs', { params })
    return extractData(response)
  },
  getJob: async (jobId: string): Promise<AIJob> => {
    const response = await adminClient.get(`/admin/ai/jobs/${jobId}`)
    return extractData(response)
  },
  retryJob: async (jobId: string): Promise<void> => {
    await adminClient.post(`/admin/ai/jobs/${jobId}/retry`)
  },
  cancelJob: async (jobId: string): Promise<void> => {
    await adminClient.post(`/admin/ai/jobs/${jobId}/cancel`)
  },
  listPrompts: async (): Promise<AIPrompt[]> => {
    const response = await adminClient.get('/admin/ai/prompts')
    return extractData(response)
  },
  getPrompt: async (promptId: string): Promise<AIPrompt> => {
    const response = await adminClient.get(`/admin/ai/prompts/${promptId}`)
    return extractData(response)
  },
  updatePrompt: async (promptId: string, template: string): Promise<AIPrompt> => {
    const response = await adminClient.put(`/admin/ai/prompts/${promptId}`, { template })
    return extractData(response)
  },
}

// Content Management types
export interface ContentPage {
  id: string
  contentType: string
  slug: string
  title: string
  excerpt?: string
  content?: string
  contentFormat?: string
  category?: string
  tags?: string[]
  status: string
  version: number
  displayOrder: number
  isFeatured: boolean
  allowFeedback?: boolean
  viewCount: number
  helpfulCount: number
  notHelpfulCount: number
  metaTitle?: string
  metaDescription?: string
  language?: string
  publishedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface CreateContentRequest {
  contentType: string
  slug: string
  title: string
  excerpt?: string
  content: string
  contentFormat?: string
  category?: string
  tags?: string[]
  displayOrder?: number
  isFeatured?: boolean
  allowFeedback?: boolean
  metaTitle?: string
  metaDescription?: string
  language?: string
}

export interface UpdateContentRequest {
  slug?: string
  title?: string
  excerpt?: string
  content?: string
  contentFormat?: string
  category?: string
  tags?: string[]
  displayOrder?: number
  isFeatured?: boolean
  allowFeedback?: boolean
  metaTitle?: string
  metaDescription?: string
}

export const adminContentApi = {
  list: async (params?: {
    contentType?: string
    status?: string
    category?: string
    search?: string
    page?: number
    pageSize?: number
  }): Promise<PaginatedResponse<ContentPage>> => {
    const response = await adminClient.get('/admin/v1/content', { params })
    return extractData(response)
  },
  get: async (id: string): Promise<ContentPage> => {
    const response = await adminClient.get(`/admin/v1/content/${id}`)
    return extractData(response)
  },
  create: async (data: CreateContentRequest): Promise<ContentPage> => {
    const response = await adminClient.post('/admin/v1/content', data)
    return extractData(response)
  },
  update: async (id: string, data: UpdateContentRequest): Promise<ContentPage> => {
    const response = await adminClient.put(`/admin/v1/content/${id}`, data)
    return extractData(response)
  },
  publish: async (id: string): Promise<ContentPage> => {
    const response = await adminClient.post(`/admin/v1/content/${id}/publish`)
    return extractData(response)
  },
  archive: async (id: string): Promise<ContentPage> => {
    const response = await adminClient.post(`/admin/v1/content/${id}/archive`)
    return extractData(response)
  },
  delete: async (id: string): Promise<void> => {
    await adminClient.delete(`/admin/v1/content/${id}`)
  },
  getCategories: async (contentType?: string): Promise<string[]> => {
    const response = await adminClient.get('/admin/v1/content/categories', { params: { contentType } })
    return extractData(response)
  },
}

export const adminApi = {
  auth: adminAuthApi,
  dashboard: adminDashboardApi,
  users: adminUsersApi,
  organizations: adminOrganizationsApi,
  billing: adminBillingApi,
  audit: adminAuditApi,
  management: adminManagementApi,
  aiOps: adminAiOpsApi,
  content: adminContentApi,
  tokens: adminTokens,
}

export default adminApi
