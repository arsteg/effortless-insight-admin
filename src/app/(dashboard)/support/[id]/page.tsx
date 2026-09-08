'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, LifeBuoy, Loader2, Send, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, LoadingState } from '@/components/common'
import { cn } from '@/lib/utils'
import {
  useSupportTicketDetail,
  useReplyToTicket,
  useSetTicketStatus,
} from '@/hooks/use-support-tickets'
import type { SupportTicketStatus } from '@/lib/api/support'

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SupportTicketDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [reply, setReply] = useState('')

  const { data: ticket, isLoading, error } = useSupportTicketDetail(resolvedParams.id)
  const replyMutation = useReplyToTicket()
  const statusMutation = useSetTicketStatus()

  if (isLoading) {
    return <LoadingState message="Loading ticket..." />
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {error ? `Error: ${error.message}` : 'Ticket not found'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/support')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tickets
        </Button>
      </div>
    )
  }

  const isClosed = ticket.status === 'closed'

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          onClick={() => router.push('/support')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tickets
        </Button>
        <PageHeader
          title={ticket.subject}
          description={`Opened ${format(new Date(ticket.createdAt), 'd MMM yyyy, h:mm a')} · category: ${ticket.category}`}
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Status</span>
        <Select
          value={ticket.status}
          onValueChange={(value) =>
            value &&
            statusMutation.mutate({
              ticketId: ticket.id,
              status: value as SupportTicketStatus,
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(Object.keys(STATUS_LABELS) as SupportTicketStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        <Badge variant="outline">{ticket.messages.length} messages</Badge>
      </div>

      <div className="space-y-4 max-w-3xl">
        {ticket.messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex', message.isFromSupport ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg border p-3',
                message.isFromSupport ? 'border-primary/20 bg-primary/5' : 'bg-muted/50'
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                {message.isFromSupport ? (
                  <LifeBuoy className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                <span className="font-medium">{message.senderName}</span>
                <span>·</span>
                <span>{format(new Date(message.createdAt), 'd MMM, h:mm a')}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{message.body}</p>
            </div>
          </div>
        ))}
      </div>

      {isClosed ? (
        <p className="text-sm text-muted-foreground max-w-3xl">
          This ticket is closed. Change the status to reply.
        </p>
      ) : (
        <div className="space-y-2 max-w-3xl">
          <Textarea
            value={reply}
            rows={4}
            placeholder="Reply to the customer… (shown as EffortlessInsight Support)"
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              onClick={() =>
                replyMutation.mutate(
                  { ticketId: ticket.id, message: reply },
                  { onSuccess: () => setReply('') }
                )
              }
              disabled={reply.trim().length === 0 || replyMutation.isPending}
            >
              {replyMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send reply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
