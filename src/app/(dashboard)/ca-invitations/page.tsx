'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MoreHorizontal, Eye, XCircle, Clock, CheckCircle, AlertCircle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader, DataTable, ConfirmDialog, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminCaInvitationListItem } from '@/types/admin'
import { useCaInvitations, useCancelCaInvitation } from '@/hooks/use-cas'

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    case 'accepted':
      return (
        <Badge variant="default" className="bg-green-500 gap-1">
          <CheckCircle className="h-3 w-3" />
          Accepted
        </Badge>
      )
    case 'declined':
      return (
        <Badge variant="outline" className="gap-1">
          <XCircle className="h-3 w-3" />
          Declined
        </Badge>
      )
    case 'expired':
      return (
        <Badge variant="outline" className="text-amber-500 gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function CaInvitationsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Dialog state
  const [cancellingInvitation, setCancellingInvitation] = useState<AdminCaInvitationListItem | null>(null)

  const { data, isLoading } = useCaInvitations({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    pageSize,
  })

  const cancelMutation = useCancelCaInvitation()

  const handleCancel = async () => {
    if (!cancellingInvitation) return
    await cancelMutation.mutateAsync({
      invitationId: cancellingInvitation.id,
      reason: 'Admin cancellation',
    })
    setCancellingInvitation(null)
  }

  const columns: Column<AdminCaInvitationListItem>[] = [
    {
      key: 'ca',
      header: 'Sent By (CA)',
      cell: (inv) => (
        <div>
          <p className="font-medium">{inv.caUserName}</p>
          <p className="text-sm text-muted-foreground">{inv.caUserEmail}</p>
          {inv.caFirmName && (
            <p className="text-xs text-muted-foreground">{inv.caFirmName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'invitee',
      header: 'Invitee',
      cell: (inv) => (
        <div>
          <p className="font-medium">{inv.inviteeEmail}</p>
          {inv.acceptedUserName && (
            <p className="text-sm text-muted-foreground">
              Accepted as: {inv.acceptedUserName}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      cell: (inv) => (
        <code className="text-sm bg-muted px-2 py-1 rounded">{inv.gstin}</code>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (inv) => (
        <Badge variant="outline">{inv.invitationType}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (inv) => getStatusBadge(inv.status),
    },
    {
      key: 'sendCount',
      header: 'Sent',
      cell: (inv) => (
        <div className="text-center">
          <p className="font-medium">{inv.sendCount}x</p>
          <p className="text-xs text-muted-foreground">
            Last: {format(new Date(inv.lastSentAt), 'MMM d')}
          </p>
        </div>
      ),
    },
    {
      key: 'expires',
      header: 'Expires',
      cell: (inv) => {
        const expiresAt = new Date(inv.expiresAt)
        const isExpired = expiresAt < new Date()
        return (
          <span className={isExpired ? 'text-destructive' : ''}>
            {format(expiresAt, 'MMM d, yyyy')}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      cell: (inv) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/cas/${inv.caUserId}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View CA
            </DropdownMenuItem>
            {inv.acceptedUserId && (
              <DropdownMenuItem onClick={() => router.push(`/users/${inv.acceptedUserId}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Accepted User
              </DropdownMenuItem>
            )}
            {inv.status === 'pending' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setCancellingInvitation(inv)}
                  className="text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Invitation
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <RequirePermission permission={ADMIN_PERMISSIONS.USERS_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="CA Invitations"
          description="View and manage all CA invitations across the platform"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          emptyMessage="No invitations found"
          keyExtractor={(inv) => inv.id}
          page={page}
          pageSize={pageSize}
          totalCount={data?.totalCount}
          totalPages={data?.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchPlaceholder="Search by CA name, invitee email, or GSTIN..."
          searchValue={search}
          onSearchChange={setSearch}
        />

        {/* Cancel Confirmation Dialog */}
        <ConfirmDialog
          open={!!cancellingInvitation}
          onOpenChange={(open) => !open && setCancellingInvitation(null)}
          title="Cancel Invitation"
          description={`Are you sure you want to cancel this invitation from ${cancellingInvitation?.caUserName} to ${cancellingInvitation?.inviteeEmail}?`}
          confirmText="Cancel Invitation"
          confirmVariant="destructive"
          onConfirm={handleCancel}
          isLoading={cancelMutation.isPending}
        />
      </div>
    </RequirePermission>
  )
}
