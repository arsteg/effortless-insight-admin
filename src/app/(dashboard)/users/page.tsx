'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MoreHorizontal, Eye, UserX, UserCheck, Key, Trash2, Users as UsersIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader, DataTable, StatusBadge, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminUserListItem } from '@/types/admin'
import {
  useUsers,
  useSuspendUser,
  useUnsuspendUser,
  useResetUserPassword,
} from '@/hooks/use-users'
import { useOrganizations } from '@/hooks/use-organizations'
import { SuspendUserDialog } from './_components/suspend-user-dialog'
import { ImpersonateUserDialog } from './_components/impersonate-user-dialog'
import { DeleteUserDialog } from './_components/delete-user-dialog'

export default function UsersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [organizationFilter, setOrganizationFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Dialog states
  const [suspendUser, setSuspendUser] = useState<AdminUserListItem | null>(null)
  const [impersonateUser, setImpersonateUser] = useState<AdminUserListItem | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUserListItem | null>(null)

  // Fetch organizations for filter dropdown
  const { data: organizationsData } = useOrganizations({ pageSize: 100 })

  const { data, isLoading } = useUsers({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    plan: planFilter !== 'all' ? planFilter : undefined,
    organizationId: organizationFilter !== 'all' ? organizationFilter : undefined,
    page,
    pageSize,
  })

  const unsuspendMutation = useUnsuspendUser()
  const resetPasswordMutation = useResetUserPassword()

  const columns: Column<AdminUserListItem>[] = [
    {
      key: 'name',
      header: 'User',
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      cell: (user) =>
        user.organization ? (
          <span className="text-sm">{user.organization.name}</span>
        ) : (
          <span className="text-sm text-muted-foreground">No organization</span>
        ),
    },
    {
      key: 'plan',
      header: 'Plan',
      cell: (user) => (
        <Badge variant="outline" className="capitalize">
          {user.plan}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      cell: (user) =>
        user.lastLoginAt ? (
          <span className="text-sm text-muted-foreground">
            {format(new Date(user.lastLoginAt), 'MMM d, yyyy')}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Never</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[50px]',
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <RequirePermission permission={ADMIN_PERMISSIONS.USERS_IMPERSONATE}>
                <DropdownMenuItem onClick={() => setImpersonateUser(user)}>
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Impersonate
                </DropdownMenuItem>
              </RequirePermission>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <RequirePermission permission={ADMIN_PERMISSIONS.USERS_RESET_PASSWORD}>
                <DropdownMenuItem
                  onClick={() => resetPasswordMutation.mutate(user.id)}
                  disabled={resetPasswordMutation.isPending}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </DropdownMenuItem>
              </RequirePermission>
              <RequirePermission permission={ADMIN_PERMISSIONS.USERS_SUSPEND}>
                {user.status === 'suspended' ? (
                  <DropdownMenuItem
                    onClick={() => unsuspendMutation.mutate(user.id)}
                    disabled={unsuspendMutation.isPending}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Unsuspend
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setSuspendUser(user)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Suspend
                  </DropdownMenuItem>
                )}
              </RequirePermission>
            </DropdownMenuGroup>
            <RequirePermission permission={ADMIN_PERMISSIONS.USERS_DELETE}>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setDeleteUser(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </RequirePermission>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage platform users and their accounts"
      />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={organizationFilter}
          onValueChange={(value) => {
            setOrganizationFilter(value ?? 'all')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Organization">
              {organizationFilter === 'all'
                ? 'All Organizations'
                : organizationsData?.items?.find((org) => org.id === organizationFilter)?.name ?? 'Select Organization'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizationsData?.items?.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={(value) => setPlanFilter(value ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(user) => user.id}
        onRowClick={(user) => router.push(`/users/${user.id}`)}
        emptyMessage="No users found"
        searchPlaceholder="Search by email, name, or phone..."
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
      <SuspendUserDialog
        user={suspendUser}
        open={!!suspendUser}
        onOpenChange={(open) => !open && setSuspendUser(null)}
      />
      <ImpersonateUserDialog
        user={impersonateUser}
        open={!!impersonateUser}
        onOpenChange={(open) => !open && setImpersonateUser(null)}
      />
      <DeleteUserDialog
        user={deleteUser}
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      />
    </div>
  )
}
