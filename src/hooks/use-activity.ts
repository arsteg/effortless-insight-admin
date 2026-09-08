'use client'

import { useQuery } from '@tanstack/react-query'
import {
  adminActivityApi,
  type ActivityRangeParams,
  type ActivityEventFilters,
} from '@/lib/api/activity'

export const activityKeys = {
  all: ['activity'] as const,
  overview: (range: ActivityRangeParams) => [...activityKeys.all, 'overview', range] as const,
  trends: (range: ActivityRangeParams) => [...activityKeys.all, 'trends', range] as const,
  topPages: (range: ActivityRangeParams) => [...activityKeys.all, 'top-pages', range] as const,
  topEvents: (range: ActivityRangeParams) => [...activityKeys.all, 'top-events', range] as const,
  events: (filters: ActivityEventFilters) => [...activityKeys.all, 'events', filters] as const,
  visitors: (params: object) => [...activityKeys.all, 'visitors', params] as const,
  journey: (params: object) => [...activityKeys.all, 'journey', params] as const,
}

export function useActivityOverview(range: ActivityRangeParams) {
  return useQuery({
    queryKey: activityKeys.overview(range),
    queryFn: () => adminActivityApi.overview(range),
    placeholderData: (previous) => previous,
  })
}

export function useActivityTrends(range: ActivityRangeParams) {
  return useQuery({
    queryKey: activityKeys.trends(range),
    queryFn: () => adminActivityApi.trends(range),
    placeholderData: (previous) => previous,
  })
}

export function useTopPages(range: ActivityRangeParams) {
  return useQuery({
    queryKey: activityKeys.topPages(range),
    queryFn: () => adminActivityApi.topPages({ ...range, limit: 10 }),
    placeholderData: (previous) => previous,
  })
}

export function useTopEvents(range: ActivityRangeParams) {
  return useQuery({
    queryKey: activityKeys.topEvents(range),
    queryFn: () => adminActivityApi.topEvents({ ...range, limit: 10 }),
    placeholderData: (previous) => previous,
  })
}

export function useActivityEvents(filters: ActivityEventFilters) {
  return useQuery({
    queryKey: activityKeys.events(filters),
    queryFn: () => adminActivityApi.events(filters),
    placeholderData: (previous) => previous,
  })
}

export function useVisitors(params: {
  from?: string
  to?: string
  authenticated?: boolean
  search?: string
  pageNumber?: number
}) {
  return useQuery({
    queryKey: activityKeys.visitors(params),
    queryFn: () => adminActivityApi.visitors({ ...params, pageSize: 25 }),
    placeholderData: (previous) => previous,
  })
}

export function useVisitorJourney(params: { visitorId?: string; userId?: string }) {
  return useQuery({
    queryKey: activityKeys.journey(params),
    queryFn: () => adminActivityApi.journey({ ...params, pageSize: 500 }),
    enabled: !!(params.visitorId || params.userId),
  })
}
