'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Plus,
  Shield,
  UserX,
  UserCheck,
  Key,
  Trash2,
  ShieldOff,
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PageHeader, DataTable, StatusBadge, type Column } from '@/components/common'
import { RequirePermission, RequireRole } from '@/components/auth'
import { ADMIN_PERMISSIONS, ADMIN_ROLE_LABELS, type AdminUser } from '@/types/admin'
import {
  useAdminUsers,
  useSuspendAdmin,
  useReactivateAdmin,
  useResetAdminPassword,
  useDisableAdminMfa,
} from '@/hooks/use-admin-management'
import { CreateAdminDialog } from './_components/create-admin-dialog'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    page,
    pageSize,
  })

  const suspendAdmin = useSuspendAdmin()
  const reactivateAdmin = useReactivateAdmin()
  const resetPassword = useResetAdminPassword()
  const disableMfa = useDisableAdminMfa()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'admin',
      header: 'Admin',
      cell: (admin) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={admin.avatarUrl} alt={admin.name} />
            <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium">{admin.name}</span>
            <p className="text-sm text-muted-foreground">{admin.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (admin) => (
        <Badge variant="outline" className="capitalize">
          {ADMIN_ROLE_LABELS[admin.role] || admin.role.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'mfa',
      header: 'MFA',
      cell: (admin) =>
        admin.mfaEnabled ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Shield className="mr-1 h-3 w-3" />
            Enabled
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <ShieldOff className="mr-1 h-3 w-3" />
            Disabled
          </Badge>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (admin) => (
        <StatusBadge status={admin.isActive ? 'active' : 'suspended'} />
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      cell: (admin) =>
        admin.lastLoginAt ? (
          <span className="text-sm text-muted-foreground">
            {format(new Date(admin.lastLoginAt), 'MMM d, yyyy HH:mm')}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Never</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[50px]',
      cell: (admin) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => resetPassword.mutate(admin.id)}
              disabled={resetPassword.isPending}
            >
              <Key className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
            {admin.mfaEnabled && (
              <DropdownMenuItem
                onClick={() =>
                  disableMfa.mutate({
                    adminId: admin.id,
                    reason: 'Admin reset requested',
                  })
                }
                disabled={disableMfa.isPending}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable MFA
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {admin.isActive ? (
              <DropdownMenuItem
                onClick={() =>
                  suspendAdmin.mutate({
                    adminId: admin.id,
                    reason: 'Administrative action',
                  })
                }
                disabled={suspendAdmin.isPending}
              >
                <UserX className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => reactivateAdmin.mutate(admin.id)}
                disabled={reactivateAdmin.isPending}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Admin Users"
          description="Manage administrative users and their permissions"
        />
        <RequireRole role="super_admin">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </RequireRole>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="operations_admin">Operations Admin</SelectItem>
            <SelectItem value="finance_admin">Finance Admin</SelectItem>
            <SelectItem value="support_admin">Support Admin</SelectItem>
            <SelectItem value="content_admin">Content Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(admin) => admin.id}
        emptyMessage="No admin users found"
        searchPlaceholder="Search by name or email..."
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

      <CreateAdminDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
