'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MoreHorizontal, Eye, RefreshCw, ArrowUpDown } from 'lucide-react'
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
import { Card } from '@/components/ui/card'
import { DataTable, StatusBadge, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminSubscriptionListItem } from '@/types/admin'
import { useSubscriptions, useOverridePlan } from '@/hooks/use-billing'
import { OverridePlanDialog } from './override-plan-dialog'

export function SubscriptionsTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [overrideSubscription, setOverrideSubscription] = useState<AdminSubscriptionListItem | null>(null)

  const { data, isLoading } = useSubscriptions({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    plan: planFilter !== 'all' ? planFilter : undefined,
    page,
    pageSize,
  })

  const columns: Column<AdminSubscriptionListItem>[] = [
    {
      key: 'organization',
      header: 'Organization',
      cell: (sub) => (
        <div>
          <span className="font-medium">{sub.organizationName}</span>
          <p className="text-xs text-muted-foreground">ID: {sub.organizationId.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      cell: (sub) => (
        <div>
          <Badge variant="outline" className="capitalize">
            {sub.planName}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">{sub.billingCycle}</p>
        </div>
      ),
    },
    {
      key: 'seats',
      header: 'Seats',
      cell: (sub) => <span>{sub.seatsTotal}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (sub) => (
        <div>
          <StatusBadge status={sub.status} />
          {sub.cancelAtPeriodEnd && (
            <p className="text-xs text-destructive mt-1">Canceling</p>
          )}
        </div>
      ),
    },
    {
      key: 'periodEnd',
      header: 'Period End',
      cell: (sub) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[50px]',
      cell: (sub) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/billing/subscriptions/${sub.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/organizations/${sub.organizationId}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Organization
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <RequirePermission permission={ADMIN_PERMISSIONS.BILLING_OVERRIDE}>
              <DropdownMenuItem onClick={() => setOverrideSubscription(sub)}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Override Plan
              </DropdownMenuItem>
            </RequirePermission>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <Card className="p-6">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={(value) => setPlanFilter(value ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
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
        keyExtractor={(sub) => sub.id}
        emptyMessage="No subscriptions found"
        searchPlaceholder="Search by organization..."
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

      <OverridePlanDialog
        subscription={overrideSubscription}
        open={!!overrideSubscription}
        onOpenChange={(open) => !open && setOverrideSubscription(null)}
      />
    </Card>
  )
}
