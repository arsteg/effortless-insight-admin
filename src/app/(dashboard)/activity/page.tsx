'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { Users, UserCheck, UserX, MousePointerClick, Eye, TrendingUp, Timer, LogIn } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, DataTable, type Column } from '@/components/common'
import {
  useActivityOverview,
  useActivityTrends,
  useTopPages,
  useTopEvents,
  useActivityEvents,
  useVisitors,
} from '@/hooks/use-activity'
import type { ActivityEventItem, VisitorListItem } from '@/lib/api/activity'

const RANGE_PRESETS: Record<string, { label: string; days: number }> = {
  '1': { label: 'Last 24 hours', days: 1 },
  '7': { label: 'Last 7 days', days: 7 },
  '30': { label: 'Last 30 days', days: 30 },
  '90': { label: 'Last 90 days', days: 90 },
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  page_view: 'Page view',
  session_start: 'Session start',
  signup_started: 'Signup started',
  signup_mobile_verified: 'Mobile verified',
  signup_completed: 'Signup completed',
  login: 'Login',
  logout: 'Logout',
  notice_view: 'Notice view',
  upload: 'Upload',
  search: 'Search',
  action: 'Action',
}

function eventLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type
}

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  hint?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

export default function ActivityAnalyticsPage() {
  const router = useRouter()
  const [rangeKey, setRangeKey] = useState('30')

  // Events tab filters
  const [eventType, setEventType] = useState('all')
  const [audience, setAudience] = useState('all')
  const [pageFilter, setPageFilter] = useState('')
  const [visitorFilter, setVisitorFilter] = useState('')
  const [eventsPage, setEventsPage] = useState(1)

  // Visitors tab filters
  const [visitorAudience, setVisitorAudience] = useState('all')
  const [visitorSearch, setVisitorSearch] = useState('')

  const range = useMemo(() => {
    const days = RANGE_PRESETS[rangeKey]?.days ?? 30
    return { from: new Date(Date.now() - days * 86_400_000).toISOString() }
  }, [rangeKey])

  const { data: overview } = useActivityOverview(range)
  const { data: trends } = useActivityTrends(range)
  const { data: topPages } = useTopPages(range)
  const { data: topEvents } = useTopEvents(range)

  const eventFilters = useMemo(
    () => ({
      ...range,
      eventType: eventType !== 'all' ? eventType : undefined,
      authenticated: audience === 'all' ? undefined : audience === 'authenticated',
      page: pageFilter || undefined,
      visitorId: visitorFilter || undefined,
      pageNumber: eventsPage,
      pageSize: 50,
    }),
    [range, eventType, audience, pageFilter, visitorFilter, eventsPage]
  )
  const { data: events, isLoading: eventsLoading } = useActivityEvents(eventFilters)

  const { data: visitors, isLoading: visitorsLoading } = useVisitors({
    ...range,
    authenticated: visitorAudience === 'all' ? undefined : visitorAudience === 'authenticated',
    search: visitorSearch || undefined,
  })

  const maxTrend = Math.max(1, ...(trends ?? []).map((t) => t.pageViews))

  const eventColumns: Column<ActivityEventItem>[] = [
    {
      key: 'when',
      header: 'When',
      cell: (e) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground" title={format(new Date(e.createdAt), 'PPpp')}>
          {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'event',
      header: 'Event',
      cell: (e) => (
        <div>
          <Badge variant={e.eventType === 'page_view' ? 'outline' : 'default'}>
            {eventLabel(e.eventType)}
          </Badge>
          {e.eventName && <p className="mt-0.5 text-xs text-muted-foreground">{e.eventName}</p>}
        </div>
      ),
    },
    {
      key: 'page',
      header: 'Page',
      cell: (e) => (
        <span className="block max-w-[220px] truncate font-mono text-xs">{e.page ?? '—'}</span>
      ),
    },
    {
      key: 'who',
      header: 'Who',
      cell: (e) =>
        e.userId ? (
          <div>
            <span className="text-sm">{e.userName ?? 'User'}</span>
            <p className="text-xs text-muted-foreground">{e.userEmail}</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Anonymous · {e.visitorId.slice(0, 8)}…
          </span>
        ),
    },
  ]

  const visitorColumns: Column<VisitorListItem>[] = [
    {
      key: 'visitor',
      header: 'Visitor',
      cell: (v) =>
        v.userId ? (
          <div>
            <span className="font-medium">{v.userName ?? 'User'}</span>
            <p className="text-xs text-muted-foreground">{v.userEmail}</p>
          </div>
        ) : (
          <span className="font-mono text-xs">{v.visitorId.slice(0, 12)}…</span>
        ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (v) =>
        v.userId ? (
          <Badge variant="default">Signed up</Badge>
        ) : (
          <Badge variant="outline">Anonymous</Badge>
        ),
    },
    {
      key: 'landing',
      header: 'Landed on',
      cell: (v) => (
        <div className="max-w-[220px]">
          <span className="block truncate font-mono text-xs">{v.landingPage ?? '—'}</span>
          {v.firstReferrer && (
            <span className="block truncate text-xs text-muted-foreground">
              from {v.firstReferrer}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'events',
      header: 'Events',
      cell: (v) => <span className="text-sm">{v.eventCount}</span>,
    },
    {
      key: 'first',
      header: 'First seen',
      cell: (v) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(v.firstSeenAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'last',
      header: 'Last seen',
      cell: (v) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(v.lastSeenAt), { addSuffix: true })}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Activity Analytics"
          description="Portal visitors and user activity — anonymous journeys are linked to accounts after signup/login"
        />
        <Select value={rangeKey} onValueChange={(v) => v && setRangeKey(v)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(RANGE_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Unique visitors" value={overview?.uniqueVisitors ?? '—'} icon={Users} />
        <StatCard
          title="Anonymous / Signed-in"
          value={`${overview?.anonymousVisitors ?? '—'} / ${overview?.authenticatedVisitors ?? '—'}`}
          icon={UserX}
        />
        <StatCard title="Sessions" value={overview?.sessions ?? '—'} icon={Timer} />
        <StatCard title="Page views" value={overview?.pageViews ?? '—'} icon={Eye} />
        <StatCard
          title="Signups"
          value={overview?.signups ?? '—'}
          icon={UserCheck}
          hint={overview ? `${overview.conversionRate}% of unique visitors` : undefined}
        />
        <StatCard title="Logins" value={overview?.logins ?? '—'} icon={LogIn} />
        <StatCard title="Total events" value={overview?.totalEvents ?? '—'} icon={MousePointerClick} />
        <StatCard
          title="Conversion rate"
          value={overview ? `${overview.conversionRate}%` : '—'}
          icon={TrendingUp}
          hint="visitor → signup"
        />
      </div>

      {/* Trend chart (page views per day, visitors in tooltip) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Daily activity</CardTitle>
        </CardHeader>
        <CardContent>
          {trends && trends.length > 0 ? (
            <div className="flex h-36 items-end gap-[2px]">
              {trends.map((t) => (
                <div
                  key={t.date}
                  className="group relative flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
                  style={{ height: `${Math.max(2, (t.pageViews / maxTrend) * 100)}%` }}
                  title={`${format(new Date(t.date), 'PP')}\n${t.pageViews} page views · ${t.visitors} visitors · ${t.signups} signups`}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most visited pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(topPages ?? []).map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-mono text-xs">{p.key}</span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {p.count} views · {p.visitors} visitors
                </span>
              </div>
            ))}
            {(!topPages || topPages.length === 0) && (
              <p className="text-sm text-muted-foreground">No page views yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most common actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(topEvents ?? []).map((e) => (
              <div key={e.key} className="flex items-center justify-between gap-2 text-sm">
                <span>{eventLabel(e.key)}</span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {e.count} times · {e.visitors} visitors
                </span>
              </div>
            ))}
            {(!topEvents || topEvents.length === 0) && (
              <p className="text-sm text-muted-foreground">No events yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail tabs */}
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Recent activity</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={eventType} onValueChange={(v) => { setEventType(v ?? 'all'); setEventsPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All event types</SelectItem>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={audience} onValueChange={(v) => { setAudience(v ?? 'all'); setEventsPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
                  <SelectItem value="authenticated">Signed in</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by page…"
              value={pageFilter}
              onChange={(e) => { setPageFilter(e.target.value); setEventsPage(1) }}
              className="w-[180px]"
            />
            <Input
              placeholder="Visitor ID…"
              value={visitorFilter}
              onChange={(e) => { setVisitorFilter(e.target.value); setEventsPage(1) }}
              className="w-[180px]"
            />
            {events && (
              <span className="text-sm text-muted-foreground">{events.total} events</span>
            )}
          </div>

          <DataTable
            columns={eventColumns}
            data={events?.items ?? []}
            isLoading={eventsLoading}
            keyExtractor={(e) => e.id}
            onRowClick={(e) => router.push(`/activity/visitor/${encodeURIComponent(e.visitorId)}`)}
            emptyMessage="No activity matches the filters"
          />
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={visitorAudience} onValueChange={(v) => setVisitorAudience(v ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
                  <SelectItem value="authenticated">Signed up</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search visitor id, user name, or email…"
              value={visitorSearch}
              onChange={(e) => setVisitorSearch(e.target.value)}
              className="w-[280px]"
            />
            {visitors && (
              <span className="text-sm text-muted-foreground">{visitors.total} visitors</span>
            )}
          </div>

          <DataTable
            columns={visitorColumns}
            data={visitors?.items ?? []}
            isLoading={visitorsLoading}
            keyExtractor={(v) => v.visitorId}
            onRowClick={(v) => router.push(`/activity/visitor/${encodeURIComponent(v.visitorId)}`)}
            emptyMessage="No visitors in this period"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
