import { adminClient, extractData } from './client'

// ============================================================================
// Activity analytics — portal visitor & user activity. Anonymous visitors
// are identified by a first-party random id; once they sign up or log in
// their pre-signup journey is linked to the account.
// ============================================================================

export interface ActivityOverview {
  uniqueVisitors: number
  anonymousVisitors: number
  authenticatedVisitors: number
  sessions: number
  pageViews: number
  totalEvents: number
  signups: number
  logins: number
  conversionRate: number
}

export interface ActivityTrendPoint {
  date: string
  visitors: number
  pageViews: number
  events: number
  signups: number
}

export interface ActivityCountItem {
  key: string
  count: number
  visitors: number
}

export interface ActivityEventItem {
  id: string
  visitorId: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  sessionId: string
  eventType: string
  eventName: string | null
  page: string | null
  referrer: string | null
  entityType: string | null
  entityId: string | null
  metadata: string | null
  createdAt: string
}

export interface ActivityEventListResponse {
  items: ActivityEventItem[]
  total: number
  page: number
  pageSize: number
}

export interface VisitorListItem {
  visitorId: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  firstSeenAt: string
  lastSeenAt: string
  firstReferrer: string | null
  landingPage: string | null
  eventCount: number
}

export interface VisitorListResponse {
  items: VisitorListItem[]
  total: number
  page: number
  pageSize: number
}

export interface VisitorJourneyResponse {
  visitor: VisitorListItem
  events: ActivityEventItem[]
  totalEvents: number
  page: number
  pageSize: number
}

export interface ActivityRangeParams {
  from?: string
  to?: string
}

export interface ActivityEventFilters extends ActivityRangeParams {
  visitorId?: string
  userId?: string
  eventType?: string
  page?: string
  authenticated?: boolean
  pageNumber?: number
  pageSize?: number
}

export const adminActivityApi = {
  overview: async (params?: ActivityRangeParams): Promise<ActivityOverview> => {
    const response = await adminClient.get('/admin/activity/overview', { params })
    return extractData(response)
  },

  trends: async (params?: ActivityRangeParams): Promise<ActivityTrendPoint[]> => {
    const response = await adminClient.get('/admin/activity/trends', { params })
    return extractData(response)
  },

  topPages: async (params?: ActivityRangeParams & { limit?: number }): Promise<ActivityCountItem[]> => {
    const response = await adminClient.get('/admin/activity/top-pages', { params })
    return extractData(response)
  },

  topEvents: async (params?: ActivityRangeParams & { limit?: number }): Promise<ActivityCountItem[]> => {
    const response = await adminClient.get('/admin/activity/top-events', { params })
    return extractData(response)
  },

  events: async (params?: ActivityEventFilters): Promise<ActivityEventListResponse> => {
    const response = await adminClient.get('/admin/activity/events', { params })
    return extractData(response)
  },

  visitors: async (
    params?: ActivityRangeParams & {
      authenticated?: boolean
      search?: string
      pageNumber?: number
      pageSize?: number
    }
  ): Promise<VisitorListResponse> => {
    const response = await adminClient.get('/admin/activity/visitors', { params })
    return extractData(response)
  },

  journey: async (params: {
    visitorId?: string
    userId?: string
    pageNumber?: number
    pageSize?: number
  }): Promise<VisitorJourneyResponse> => {
    const response = await adminClient.get('/admin/activity/journey', { params })
    return extractData(response)
  },
}
