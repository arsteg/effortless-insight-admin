'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MoreHorizontal, Eye, UserX, Users, Building2, FileText } from 'lucide-react'
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
import { ADMIN_PERMISSIONS, type AdminCaRelationshipListItem } from '@/types/admin'
import { useCaRelationships, useRevokeCaRelationship } from '@/hooks/use-cas'
import { ConfirmDialog } from '@/components/common'

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return <Badge variant="default" className="bg-green-500">Active</Badge>
    case 'revoked':
      return <Badge variant="destructive">Revoked</Badge>
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function CaRelationshipsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Dialog state
  const [revokingRelationship, setRevokingRelationship] = useState<AdminCaRelationshipListItem | null>(null)

  const { data, isLoading } = useCaRelationships({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    pageSize,
  })

  const revokeMutation = useRevokeCaRelationship()

  const handleRevoke = async () => {
    if (!revokingRelationship) return
    await revokeMutation.mutateAsync({
      relationshipId: revokingRelationship.id,
      reason: 'Admin revocation',
    })
    setRevokingRelationship(null)
  }

  const columns: Column<AdminCaRelationshipListItem>[] = [
    {
      key: 'ca',
      header: 'CA',
      cell: (rel) => (
        <div>
          <p className="font-medium">{rel.caUserName}</p>
          <p className="text-sm text-muted-foreground">{rel.caUserEmail}</p>
          {rel.caFirmName && (
            <p className="text-xs text-muted-foreground">{rel.caFirmName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (rel) => (
        <div>
          <p className="font-medium">{rel.clientUserName}</p>
          <p className="text-sm text-muted-foreground">{rel.clientUserEmail}</p>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      cell: (rel) => (
        rel.organizationName ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{rel.organizationName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (rel) => getStatusBadge(rel.status),
    },
    {
      key: 'gstins',
      header: 'GSTINs',
      cell: (rel) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>{rel.gstinCount}</span>
        </div>
      ),
    },
    {
      key: 'notices',
      header: 'Notices',
      cell: (rel) => rel.noticeCount,
    },
    {
      key: 'accepted',
      header: 'Accepted',
      cell: (rel) => (
        rel.acceptedAt
          ? format(new Date(rel.acceptedAt), 'MMM d, yyyy')
          : <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (rel) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/cas/${rel.caUserId}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View CA
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/users/${rel.clientUserId}`)}>
              <Users className="mr-2 h-4 w-4" />
              View Client
            </DropdownMenuItem>
            {rel.organizationId && (
              <DropdownMenuItem onClick={() => router.push(`/organizations/${rel.organizationId}`)}>
                <Building2 className="mr-2 h-4 w-4" />
                View Organization
              </DropdownMenuItem>
            )}
            {rel.status === 'active' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setRevokingRelationship(rel)}
                  className="text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Revoke Access
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
          title="CA-Client Relationships"
          description="View and manage CA-Client relationships across the platform"
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
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          emptyMessage="No relationships found"
          keyExtractor={(rel) => rel.id}
          page={page}
          pageSize={pageSize}
          totalCount={data?.totalCount}
          totalPages={data?.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchPlaceholder="Search by CA name, client, or organization..."
          searchValue={search}
          onSearchChange={setSearch}
        />

        {/* Revoke Confirmation Dialog */}
        <ConfirmDialog
          open={!!revokingRelationship}
          onOpenChange={(open) => !open && setRevokingRelationship(null)}
          title="Revoke CA Access"
          description={`Are you sure you want to revoke ${revokingRelationship?.caUserName}'s access to ${revokingRelationship?.clientUserName}'s data? This action cannot be undone.`}
          confirmText="Revoke Access"
          confirmVariant="destructive"
          onConfirm={handleRevoke}
          isLoading={revokeMutation.isPending}
        />
      </div>
    </RequirePermission>
  )
}
