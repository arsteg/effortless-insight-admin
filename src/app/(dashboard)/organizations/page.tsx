'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MoreHorizontal, Eye, Building2, UserX, UserCheck, Plus, Trash2 } from 'lucide-react'
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
import { PageHeader, DataTable, StatusBadge, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminOrganizationListItem } from '@/types/admin'
import {
  useOrganizations,
  useSuspendOrganization,
  useUnsuspendOrganization,
} from '@/hooks/use-organizations'
import { ApplyCreditDialog } from './_components/apply-credit-dialog'
import { DeleteOrganizationDialog } from './_components/delete-organization-dialog'

export default function OrganizationsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Dialog states
  const [creditOrg, setCreditOrg] = useState<AdminOrganizationListItem | null>(null)
  const [deleteOrg, setDeleteOrg] = useState<AdminOrganizationListItem | null>(null)

  const { data, isLoading } = useOrganizations({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    plan: planFilter !== 'all' ? planFilter : undefined,
    page,
    pageSize,
  })

  const suspendMutation = useSuspendOrganization()
  const unsuspendMutation = useUnsuspendOrganization()

  const columns: Column<AdminOrganizationListItem>[] = [
    {
      key: 'name',
      header: 'Organization',
      cell: (org) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-medium">{org.name}</span>
            <p className="text-xs text-muted-foreground">{org.memberCount} members</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      cell: (org) => (
        <div>
          <Badge variant="outline" className="capitalize">
            {org.planName}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            <StatusBadge status={org.subscriptionStatus} />
          </p>
        </div>
      ),
    },
    {
      key: 'notices',
      header: 'Notices',
      cell: (org) => (
        <span className="text-sm">{org.noticeCount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (org) => <StatusBadge status={org.status} />,
    },
    {
      key: 'created',
      header: 'Created',
      cell: (org) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(org.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[50px]',
      cell: (org) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/organizations/${org.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <RequirePermission permission={ADMIN_PERMISSIONS.ORGS_CREDITS}>
              <DropdownMenuItem onClick={() => setCreditOrg(org)}>
                <Plus className="mr-2 h-4 w-4" />
                Apply Credit
              </DropdownMenuItem>
            </RequirePermission>
            <RequirePermission permission={ADMIN_PERMISSIONS.ORGS_UPDATE}>
              {org.status === 'suspended' ? (
                <DropdownMenuItem
                  onClick={() => unsuspendMutation.mutate(org.id)}
                  disabled={unsuspendMutation.isPending}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Unsuspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    suspendMutation.mutate({
                      orgId: org.id,
                      reason: 'Administrative action',
                    })
                  }
                  disabled={suspendMutation.isPending}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Suspend
                </DropdownMenuItem>
              )}
            </RequirePermission>
            <RequirePermission permission={ADMIN_PERMISSIONS.ORGS_DELETE}>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOrg(org)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Organization
              </DropdownMenuItem>
            </RequirePermission>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Manage organizations and their subscriptions"
      />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={(value) => setPlanFilter(value ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(org) => org.id}
        onRowClick={(org) => router.push(`/organizations/${org.id}`)}
        emptyMessage="No organizations found"
        searchPlaceholder="Search by name..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={page}
        pageSize={pageSize}
        totalCount={data?.totalCount ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />

      {/* Dialogs */}
      <ApplyCreditDialog
        organization={creditOrg}
        open={!!creditOrg}
        onOpenChange={(open) => !open && setCreditOrg(null)}
      />
      <DeleteOrganizationDialog
        organization={deleteOrg}
        open={!!deleteOrg}
        onOpenChange={(open) => !open && setDeleteOrg(null)}
      />
    </div>
  )
}
