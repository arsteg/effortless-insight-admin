'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Building2, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, DataTable, type Column } from '@/components/common'
import { useSupportTickets } from '@/hooks/use-support-tickets'
import type { AdminSupportTicketListItem, SupportTicketStatus } from '@/lib/api/support'

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const STATUS_VARIANTS: Record<
  SupportTicketStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  open: 'destructive', // needs attention — make it pop in the queue
  in_progress: 'default',
  resolved: 'secondary',
  closed: 'outline',
}

const CATEGORY_LABELS: Record<string, string> = {
  question: 'Question',
  problem: 'Problem',
  billing: 'Billing',
  feature_request: 'Feature request',
  other: 'Other',
}

export default function SupportTicketsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: tickets, isLoading } = useSupportTickets(
    statusFilter !== 'all' ? (statusFilter as SupportTicketStatus) : undefined
  )

  const columns: Column<AdminSupportTicketListItem>[] = [
    {
      key: 'subject',
      header: 'Ticket',
      cell: (ticket) => (
        <div>
          <span className="font-medium">{ticket.subject}</span>
          <p className="text-xs text-muted-foreground">
            {CATEGORY_LABELS[ticket.category] ?? ticket.category}
          </p>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      cell: (ticket) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-sm">{ticket.organizationName}</span>
            <p className="text-xs text-muted-foreground">
              {ticket.createdByName} · {ticket.createdByEmail}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'messages',
      header: 'Messages',
      cell: (ticket) => (
        <span className="flex items-center gap-1 text-sm">
          <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
          {ticket.messageCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (ticket) => (
        <Badge variant={STATUS_VARIANTS[ticket.status]}>
          {STATUS_LABELS[ticket.status]}
        </Badge>
      ),
    },
    {
      key: 'updated',
      header: 'Last activity',
      cell: (ticket) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(ticket.lastMessageAt), { addSuffix: true })}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Customer tickets raised in the app — replies appear to customers as EffortlessInsight Support"
      />

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={tickets ?? []}
        isLoading={isLoading}
        keyExtractor={(ticket) => ticket.id}
        onRowClick={(ticket) => router.push(`/support/${ticket.id}`)}
        emptyMessage="No support tickets"
      />
    </div>
  )
}
