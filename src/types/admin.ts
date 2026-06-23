// Admin Portal Type Definitions

// ============================================================================
// Admin User Types
// ============================================================================

export interface AdminUser {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: AdminRole
  permissions: string[]
  mfaEnabled: boolean
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export type AdminRole =
  | 'super_admin'
  | 'operations_admin'
  | 'finance_admin'
  | 'support_admin'
  | 'content_admin'

export interface AdminUserDetail extends AdminUser {
  ipWhitelist?: string[]
  lastLoginIp?: string
  passwordChangedAt?: string
  mustChangePassword: boolean
  failedLoginAttempts: number
  isLocked: boolean
  lockedUntil?: string
  updatedAt?: string
  recentActivity?: AdminAuditLog[]
  activeSessions?: AdminSession[]
}

export interface AdminSession {
  sessionId: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  lastActivityAt: string
}

// ============================================================================
// Admin Auth Types
// ============================================================================

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminLoginResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  user: AdminUser
}

export interface AdminMfaRequiredResponse {
  mfaRequired: true
  sessionToken: string
  expiresAt: string
}

export interface AdminMfaVerifyRequest {
  sessionToken: string
  code: string
}

export interface AdminMfaSetupResponse {
  secret: string
  qrCodeUri: string
  backupCodes: string[]
}

export interface AdminChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ============================================================================
// Admin Dashboard Types
// ============================================================================

export interface DashboardMetrics {
  period: DatePeriod
  users: UserMetrics
  organizations: OrganizationMetrics
  notices: NoticeMetrics
  revenue: RevenueMetrics
}

export interface DatePeriod {
  start: string
  end: string
}

export interface UserMetrics {
  total: number
  active: number
  new: number
  growth: number
}

export interface OrganizationMetrics {
  total: number
  active: number
  new: number
}

export interface NoticeMetrics {
  total: number
  processing: number
  completed: number
  failed: number
  avgProcessingTimeSeconds: number
}

export interface RevenueMetrics {
  mrr: number
  arr: number
  collected: number
  refunds: number
  growth?: number
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical'
  components: HealthComponent[]
  lastCheckedAt: string
}

export interface HealthComponent {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs?: number
  message?: string
}

export interface SystemAlert {
  id: string
  alertType: string
  category: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
}

export interface AdminActivity {
  id: string
  adminUserId: string
  adminUserName: string
  action: string
  targetType: string
  targetId?: string
  description?: string
  outcome: 'success' | 'failure'
  createdAt: string
}

// ============================================================================
// Admin User Management Types
// ============================================================================

export interface AdminUserListItem {
  id: string
  email: string
  name: string
  phone?: string
  status: 'active' | 'suspended' | 'inactive'
  organization?: {
    id: string
    name: string
  }
  plan: string
  createdAt: string
  lastLoginAt?: string
}

export interface AdminUserSearchParams {
  search?: string
  status?: string
  plan?: string
  sortBy?: string
  sortDesc?: boolean
  page?: number
  pageSize?: number
}

export interface AdminUserDetailResponse {
  id: string
  email: string
  name: string
  phone?: string
  status: string
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  organization?: AdminOrgDetail
  createdAt: string
  lastLoginAt?: string
  lockedAt?: string
  lockoutReason?: string
  recentNotices: AdminNoticeItem[]
  loginHistory: AdminLoginHistoryItem[]
}

export interface AdminOrgDetail {
  id: string
  name: string
  planCode: string
  planName: string
  subscriptionStatus: string
  memberCount: number
}

export interface AdminNoticeItem {
  id: string
  noticeNumber?: string
  noticeType: string
  status: string
  createdAt: string
}

export interface AdminLoginHistoryItem {
  ipAddress?: string
  userAgent?: string
  success: boolean
  attemptedAt: string
}

// ============================================================================
// Admin Organization Management Types
// ============================================================================

export interface AdminOrganizationListItem {
  id: string
  name: string
  status: string
  planCode: string
  planName: string
  subscriptionStatus: string
  memberCount: number
  noticeCount: number
  createdAt: string
}

export interface AdminOrganizationSearchParams {
  search?: string
  status?: string
  plan?: string
  sortBy?: string
  sortDesc?: boolean
  page?: number
  pageSize?: number
}

export interface AdminOrganizationDetail {
  id: string
  name: string
  status: string
  industry?: string
  website?: string
  plan?: AdminPlanInfo
  subscription?: AdminSubscriptionInfo
  members: AdminMemberInfo[]
  gstinList: AdminGstinInfo[]
  usage: AdminUsageInfo
  recentInvoices: AdminInvoiceSummary[]
  createdAt: string
}

export interface AdminPlanInfo {
  code: string
  name: string
}

export interface AdminSubscriptionInfo {
  status: string
  billingCycle: string
  currentPeriodStart: string
  currentPeriodEnd: string
  seatsIncluded: number
  seatsAdditional: number
  cancelAtPeriodEnd: boolean
}

export interface AdminMemberInfo {
  userId: string
  email: string
  name: string
  role: string
  joinedAt: string
}

export interface AdminGstinInfo {
  id: string
  gstin: string
  legalName: string
  state: string
}

export interface AdminUsageInfo {
  noticeCount: number
  storageUsedMb: number
  activeCredits: number
}

export interface AdminInvoiceSummary {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  createdAt: string
}

export interface AdminCreditInfo {
  id: string
  amount: number
  remainingAmount: number
  type: string
  reason: string
  status: string
  grantedBy: string
  expiresAt?: string
  createdAt: string
}

// ============================================================================
// Admin Billing Types
// ============================================================================

export interface BillingOverview {
  period: DatePeriod
  mrr: number
  arr: number
  revenueCollected: number
  refundsIssued: number
  activeSubscriptions: number
  trialSubscriptions: number
  cancelledSubscriptions: number
  trialConversionRate: number
}

export interface AdminSubscriptionListItem {
  id: string
  organizationId: string
  organizationName: string
  planCode: string
  planName: string
  status: string
  billingCycle: string
  currentPeriodEnd: string
  seatsTotal: number
  cancelAtPeriodEnd: boolean
  createdAt: string
}

export interface AdminSubscriptionSearchParams {
  search?: string
  status?: string
  plan?: string
  page?: number
  pageSize?: number
}

export interface AdminPaymentInfo {
  id: string
  amount: number
  status: string
  method: string
  createdAt: string
}

export interface AdminSubscriptionDetail {
  id: string
  organizationId: string
  organizationName: string
  plan?: AdminPlanInfo
  status: string
  billingCycle: string
  seatsIncluded: number
  seatsAdditional: number
  currentPeriodStart: string
  currentPeriodEnd: string
  trialStart?: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  cancellationReason?: string
  payments: AdminPaymentInfo[]
  invoices: AdminInvoiceSummary[]
  createdAt: string
}

export interface AdminInvoiceListItem {
  id: string
  invoiceNumber: string
  organizationId: string
  organizationName: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: string
  dueDate: string
  paidAt?: string
  createdAt: string
  paymentId?: string // Payment ID for refund processing
}

// ============================================================================
// Admin Audit Types
// ============================================================================

export interface AdminAuditLog {
  id: string
  adminUserId: string
  adminUserName: string
  adminUserEmail: string
  action: string
  targetType: string
  targetId?: string
  description?: string
  details?: Record<string, unknown>
  outcome: string
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
  durationMs?: number
  createdAt: string
}

export interface AuditSearchParams {
  adminUserId?: string
  action?: string
  targetType?: string
  targetId?: string
  outcome?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
}

export interface AuditSearchResult {
  items: AdminAuditLog[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuditStats {
  period: DatePeriod
  totalActions: number
  failedActions: number
  actionsByType: { action: string; count: number }[]
  actionsByAdmin: { adminId: string; adminName: string; count: number }[]
}

// ============================================================================
// Common Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  code?: string
  errors?: Record<string, string[]>
}

// ============================================================================
// Permission Constants
// ============================================================================

export const ADMIN_PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EXPORT: 'dashboard:export',

  // Users
  USERS_VIEW: 'users:view',
  USERS_SUSPEND: 'users:suspend',
  USERS_DELETE: 'users:delete',
  USERS_IMPERSONATE: 'users:impersonate',
  USERS_RESET_PASSWORD: 'users:reset_password',

  // Organizations
  ORGS_VIEW: 'organizations:view',
  ORGS_UPDATE: 'organizations:update',
  ORGS_DELETE: 'organizations:delete',
  ORGS_CREDITS: 'organizations:credits',

  // Billing
  BILLING_VIEW: 'billing:view',
  BILLING_REFUND: 'billing:refund',
  BILLING_OVERRIDE: 'billing:override',

  // AI Operations
  AI_OPS_VIEW: 'ai:view',
  AI_OPS_RETRY: 'ai:retry',
  AI_OPS_PROMPTS: 'ai:prompts',

  // Audit
  AUDIT_VIEW: 'audit:view',
  AUDIT_EXPORT: 'audit:export',

  // Content
  CONTENT_VIEW: 'content:view',
  CONTENT_EDIT: 'content:edit',
  CONTENT_PUBLISH: 'content:publish',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  ADMIN_MANAGE: 'admin:manage',
} as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS]

// ============================================================================
// Admin Role Helpers
// ============================================================================

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS_ADMIN: 'operations_admin',
  FINANCE_ADMIN: 'finance_admin',
  SUPPORT_ADMIN: 'support_admin',
  CONTENT_ADMIN: 'content_admin',
} as const

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  operations_admin: 'Operations Admin',
  finance_admin: 'Finance Admin',
  support_admin: 'Support Admin',
  content_admin: 'Content Admin',
}
