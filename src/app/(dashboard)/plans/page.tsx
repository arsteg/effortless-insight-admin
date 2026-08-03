'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { PageHeader, DataTable, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminPlanListItem } from '@/types/admin'
import {
  usePlans,
  useDeletePlan,
  useActivatePlan,
  useDeactivatePlan,
} from '@/hooks/use-plans'
import { PlanEditorDialog } from './_components/plan-editor-dialog'

export default function PlansPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Dialog states
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null)

  const { data, isLoading } = usePlans({
    search: search || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    page,
    pageSize,
  })

  const deleteMutation = useDeletePlan()
  const activateMutation = useActivatePlan()
  const deactivateMutation = useDeactivatePlan()

  const handleCreate = () => {
    setEditingPlanId(null)
    setEditorOpen(true)
  }

  const handleEdit = (planId: string) => {
    setEditingPlanId(planId)
    setEditorOpen(true)
  }

  const handleDelete = () => {
    if (deletePlanId) {
      deleteMutation.mutate(deletePlanId)
      setDeletePlanId(null)
    }
  }

  const handleToggleActive = (plan: AdminPlanListItem) => {
    if (plan.isActive) {
      deactivateMutation.mutate(plan.id)
    } else {
      activateMutation.mutate(plan.id)
    }
  }

  const formatPrice = (priceInPaise?: number | null) => {
    if (priceInPaise == null) return 'N/A'
    if (priceInPaise === 0) return 'Free'
    return `₹${(priceInPaise / 100).toLocaleString('en-IN')}`
  }

  const columns: Column<AdminPlanListItem>[] = [
    {
      key: 'code',
      header: 'Plan',
      cell: (plan) => (
        <button
          onClick={() => handleEdit(plan.id)}
          className="flex flex-col text-left hover:underline cursor-pointer"
        >
          <span className="font-medium text-primary">{plan.displayName}</span>
          <span className="text-sm text-muted-foreground font-mono">{plan.code}</span>
        </button>
      ),
    },
    {
      key: 'pricing',
      header: 'Pricing',
      cell: (plan) => (
        <div className="flex flex-col">
          {plan.pricingMonthly != null && (
            <span className="text-sm">
              {formatPrice(plan.pricingMonthly)}/mo
            </span>
          )}
          {plan.pricingAnnually != null && (
            <span className="text-sm text-muted-foreground">
              {formatPrice(plan.pricingAnnually)}/yr
            </span>
          )}
          {plan.pricingMonthly == null && plan.pricingAnnually == null && (
            <span className="text-sm text-muted-foreground">Contact Sales</span>
          )}
        </div>
      ),
    },
    {
      key: 'subscribers',
      header: 'Subscribers',
      cell: (plan) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{plan.subscriberCount}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (plan) => (
        <div className="flex items-center gap-2">
          {plan.isActive ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="mr-1 h-3 w-3" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
              <XCircle className="mr-1 h-3 w-3" />
              Inactive
            </Badge>
          )}
          {plan.isPopular && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Popular
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'sortOrder',
      header: 'Order',
      cell: (plan) => <span className="text-sm text-muted-foreground">{plan.sortOrder}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (plan) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(plan.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[50px]',
      cell: (plan) => (
        <RequirePermission permission={ADMIN_PERMISSIONS.PLANS_MANAGE}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(plan.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Plan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleActive(plan)}
                disabled={activateMutation.isPending || deactivateMutation.isPending}
              >
                {plan.isActive ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeletePlanId(plan.id)}
                className="text-destructive focus:text-destructive"
                disabled={plan.subscriberCount > 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              {plan.subscriberCount > 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  Cannot delete: {plan.subscriberCount} active subscriber{plan.subscriberCount > 1 ? 's' : ''}
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </RequirePermission>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Subscription Plans"
          description="Manage subscription plans and pricing"
        />
        <RequirePermission permission={ADMIN_PERMISSIONS.PLANS_MANAGE}>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </RequirePermission>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => { value && setStatusFilter(value); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(plan) => plan.id}
        emptyMessage="No plans found. Create your first subscription plan to get started."
        page={page}
        pageSize={pageSize}
        totalPages={data?.totalPages ?? 0}
        totalCount={data?.totalCount ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />

      <AlertDialog open={!!deletePlanId} onOpenChange={(open) => !open && setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plan? This action cannot be undone.
              This will soft delete the plan and hide it from the admin view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlanEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        planId={editingPlanId}
      />
    </div>
  )
}
