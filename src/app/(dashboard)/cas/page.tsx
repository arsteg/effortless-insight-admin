'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MoreHorizontal, Eye, UserCheck, UserX, Shield, ShieldOff, Building2 } from 'lucide-react'
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
import { PageHeader, DataTable, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminCaProfileListItem, type AdminCaStatus } from '@/types/admin'
import { useCas, useVerifyCa, useRevokeVerification, useSuspendCa, useUnsuspendCa } from '@/hooks/use-cas'
import { VerifyCaDialog } from './_components/verify-ca-dialog'
import { SuspendCaDialog } from './_components/suspend-ca-dialog'

function getStatusBadge(status: AdminCaStatus) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-500">Active</Badge>
    case 'suspended':
      return <Badge variant="destructive">Suspended</Badge>
    case 'pending_verification':
      return <Badge variant="secondary">Pending Verification</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function CasPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Dialog states
  const [verifyingCa, setVerifyingCa] = useState<AdminCaProfileListItem | null>(null)
  const [suspendingCa, setSuspendingCa] = useState<AdminCaProfileListItem | null>(null)

  const { data, isLoading } = useCas({
    search: search || undefined,
    status: statusFilter !== 'all' ? (statusFilter as AdminCaStatus) : undefined,
    isVerified: verifiedFilter !== 'all' ? verifiedFilter === 'verified' : undefined,
    page,
    pageSize,
  })

  const unsuspendMutation = useUnsuspendCa()
  const revokeVerificationMutation = useRevokeVerification()

  const columns: Column<AdminCaProfileListItem>[] = [
    {
      key: 'name',
      header: 'CA Name',
      cell: (ca) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{ca.userName}</p>
            {ca.isVerified && (
              <Shield className="h-4 w-4 text-green-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{ca.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'firm',
      header: 'Firm',
      cell: (ca) => (
        <div>
          {ca.firmName ? (
            <>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{ca.firmName}</p>
              </div>
              {ca.membershipNumber && (
                <p className="text-sm text-muted-foreground">
                  ICAI: {ca.membershipNumber}
                </p>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (ca) => getStatusBadge(ca.status),
    },
    {
      key: 'verification',
      header: 'Verification',
      cell: (ca) => (
        <div>
          {ca.isVerified ? (
            <div>
              <Badge variant="default" className="bg-green-500 gap-1">
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
              {ca.verifiedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(ca.verifiedAt), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          ) : (
            <Badge variant="outline">Not Verified</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'freePlan',
      header: 'Free Plan',
      cell: (ca) =>
        ca.allowFreePlan ? (
          <Badge variant="default" className="bg-green-500">Enabled</Badge>
        ) : (
          <Badge variant="outline">Not Enabled</Badge>
        ),
    },
    {
      key: 'clients',
      header: 'Clients',
      cell: (ca) => (
        <div className="text-center">
          <p className="font-medium">{ca.activeClientCount}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
      ),
    },
    {
      key: 'invitations',
      header: 'Invitations',
      cell: (ca) => (
        <div className="text-center">
          <p className="font-medium">{ca.pendingInvitationCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registered',
      cell: (ca) => format(new Date(ca.createdAt), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      header: '',
      cell: (ca) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/cas/${ca.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!ca.isVerified ? (
              <DropdownMenuItem onClick={() => setVerifyingCa(ca)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Verify CA
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => revokeVerificationMutation.mutate({ caProfileId: ca.id })}
                className="text-amber-600"
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Revoke Verification
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {ca.status === 'active' ? (
              <DropdownMenuItem
                onClick={() => setSuspendingCa(ca)}
                className="text-destructive"
              >
                <UserX className="mr-2 h-4 w-4" />
                Suspend CA
              </DropdownMenuItem>
            ) : ca.status === 'suspended' ? (
              <DropdownMenuItem
                onClick={() => unsuspendMutation.mutate(ca.id)}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Unsuspend CA
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <RequirePermission permission={ADMIN_PERMISSIONS.USERS_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Chartered Accountants"
          description="Manage CA profiles, verification, and access"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending_verification">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="not_verified">Not Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          emptyMessage="No CAs found"
          keyExtractor={(ca) => ca.id}
          onRowClick={(ca) => router.push(`/cas/${ca.id}`)}
          page={page}
          pageSize={pageSize}
          totalCount={data?.totalCount}
          totalPages={data?.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchPlaceholder="Search by name, email, or firm..."
          searchValue={search}
          onSearchChange={setSearch}
        />

        {/* Dialogs */}
        {verifyingCa && (
          <VerifyCaDialog
            ca={verifyingCa}
            open={!!verifyingCa}
            onOpenChange={(open) => !open && setVerifyingCa(null)}
          />
        )}

        {suspendingCa && (
          <SuspendCaDialog
            ca={suspendingCa}
            open={!!suspendingCa}
            onOpenChange={(open) => !open && setSuspendingCa(null)}
          />
        )}
      </div>
    </RequirePermission>
  )
}
