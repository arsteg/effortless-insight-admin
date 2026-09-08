'use client'

import { use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, User, Globe, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common'
import { useVisitorJourney } from '@/hooks/use-activity'
import type { ActivityEventItem } from '@/lib/api/activity'

const EVENT_TYPE_LABELS: Record<string, string> = {
  page_view: 'Page view',
  session_start: 'Session start',
  signup_started: 'Signup started',
  signup_mobile_verified: 'Mobile verified',
  signup_completed: 'Signup completed ✦',
  login: 'Login',
  logout: 'Logout',
  notice_view: 'Notice view',
  upload: 'Upload',
  search: 'Search',
  action: 'Action',
}

const MILESTONES = new Set(['signup_started', 'signup_mobile_verified', 'signup_completed', 'login', 'logout'])

interface SessionGroup {
  sessionId: string
  events: ActivityEventItem[]
}

export default function VisitorJourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const visitorId = decodeURIComponent(id)

  const { data: journey, isLoading } = useVisitorJourney({ visitorId })

  // Group the chronological event stream into sessions
  const sessions: SessionGroup[] = useMemo(() => {
    const groups: SessionGroup[] = []
    for (const event of journey?.events ?? []) {
      const current = groups[groups.length - 1]
      if (!current || current.sessionId !== event.sessionId) {
        groups.push({ sessionId: event.sessionId, events: [event] })
      } else {
        current.events.push(event)
      }
    }
    return groups
  }, [journey])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/activity')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to analytics
        </Button>
        <p className="text-muted-foreground">Visitor not found.</p>
      </div>
    )
  }

  const visitor = journey.visitor

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/activity')}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to analytics
      </Button>

      <PageHeader
        title={visitor.userName ?? `Visitor ${visitor.visitorId.slice(0, 12)}…`}
        description="Chronological journey — anonymous activity before signup is included when linked"
      />

      {/* Profile card */}
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Identity</p>
              {visitor.userId ? (
                <>
                  <p className="text-sm font-medium">{visitor.userName}</p>
                  <p className="text-xs text-muted-foreground">{visitor.userEmail}</p>
                </>
              ) : (
                <Badge variant="outline">Anonymous</Badge>
              )}
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{visitor.visitorId}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">First landed on</p>
              <p className="font-mono text-xs">{visitor.landingPage ?? '—'}</p>
              {visitor.firstReferrer && (
                <p className="truncate text-xs text-muted-foreground">from {visitor.firstReferrer}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">First seen</p>
              <p className="text-sm">
                {visitor.firstSeenAt !== '0001-01-01T00:00:00'
                  ? format(new Date(visitor.firstSeenAt), 'PPp')
                  : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="text-sm">{journey.totalEvents}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session timeline */}
      {sessions.map((session, index) => (
        <Card key={`${session.sessionId}-${index}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Session {index + 1} · {format(new Date(session.events[0].createdAt), 'PPp')} ·{' '}
              {session.events.length} {session.events.length === 1 ? 'event' : 'events'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative ml-2 space-y-3 border-l pl-4">
              {session.events.map((event) => (
                <li key={event.id} className="relative">
                  <span
                    className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${
                      MILESTONES.has(event.eventType) ? 'bg-primary' : 'bg-muted-foreground/40'
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">
                      {format(new Date(event.createdAt), 'HH:mm:ss')}
                    </span>
                    <Badge variant={MILESTONES.has(event.eventType) ? 'default' : 'outline'}>
                      {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                    </Badge>
                    {event.page && <span className="font-mono text-xs">{event.page}</span>}
                    {event.eventName && (
                      <span className="text-xs text-muted-foreground">{event.eventName}</span>
                    )}
                    {event.userId && event.eventType === 'login' && (
                      <span className="text-xs text-muted-foreground">as {event.userEmail}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}

      {sessions.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No recorded activity.</p>
      )}
    </div>
  )
}
