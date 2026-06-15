'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Settings,
  CreditCard,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PageHeader, DataTable, StatusBadge, LoadingState, StatCard, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminAuditLog } from '@/types/admin'
import {
  useAuditLogs,
  useAuditStats,
  useAuditActionTypes,
  useAuditTargetTypes,
  useExportAudit,
} from '@/hooks/use-audit'
import { cn } from '@/lib/utils'

const periodOptions = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all')
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all')
  const [period, setPeriod] = useState('7d')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const { data, isLoading } = useAuditLogs({
    search: search || undefined,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    targetType: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
    outcome: outcomeFilter !== 'all' ? outcomeFilter : undefined,
    page,
    pageSize,
  })

  const { data: stats, isLoading: statsLoading } = useAuditStats(period)
  const { data: actionTypes } = useAuditActionTypes()
  const { data: targetTypes } = useAuditTargetTypes()
  const exportAudit = useExportAudit()

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="h-4 w-4" />
    if (action.includes('org')) return <Users className="h-4 w-4" />
    if (action.includes('billing') || action.includes('payment')) return <CreditCard className="h-4 w-4" />
    if (action.includes('config') || action.includes('setting')) return <Settings className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const columns: Column<AdminAuditLog>[] = [
    {
      key: 'action',
      header: 'Action',
      cell: (log) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            {getActionIcon(log.action)}
          </div>
          <div>
            <span className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</span>
            {log.targetType && (
              <p className="text-xs text-muted-foreground">
                {log.targetType} {log.targetId ? `#${log.targetId.slice(0, 8)}` : ''}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'admin',
      header: 'Admin',
      cell: (log) => (
        <div>
          <span className="text-sm">{log.adminUserName}</span>
          <p className="text-xs text-muted-foreground">{log.adminUserEmail}</p>
        </div>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      cell: (log) => (
        <div className="flex items-center gap-2">
          {log.outcome === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              'text-sm capitalize',
              log.outcome === 'success' ? 'text-green-600' : 'text-red-600'
            )}
          >
            {log.outcome}
          </span>
        </div>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (log) => (
        <div className="text-sm">
          <p>{format(new Date(log.createdAt), 'MMM d, yyyy')}</p>
          <p className="text-muted-foreground">{format(new Date(log.createdAt), 'HH:mm:ss')}</p>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      cell: (log) => (
        <div className="max-w-[200px]">
          {log.description && (
            <p className="text-sm text-muted-foreground truncate">{log.description}</p>
          )}
          {log.ipAddress && (
            <p className="text-xs text-muted-foreground">IP: {log.ipAddress}</p>
          )}
        </div>
      ),
    },
  ]

  const handleExport = () => {
    exportAudit.mutate({
      action: actionFilter !== 'all' ? actionFilter : undefined,
      targetType: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Audit Logs"
          description="Track all administrative actions on the platform"
        />
        <RequirePermission permission={ADMIN_PERMISSIONS.AUDIT_EXPORT}>
          <Button onClick={handleExport} disabled={exportAudit.isPending}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </RequirePermission>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Actions"
          value={stats?.totalActions.toLocaleString() ?? '-'}
          description="This period"
          icon={<FileText className="h-4 w-4" />}
          isLoading={statsLoading}
        />
        <StatCard
          title="Failed Actions"
          value={stats?.failedActions.toLocaleString() ?? '-'}
          description="This period"
          icon={<XCircle className="h-4 w-4" />}
          isLoading={statsLoading}
        />
        <StatCard
          title="Success Rate"
          value={
            stats
              ? `${(((stats.totalActions - stats.failedActions) / stats.totalActions) * 100).toFixed(1)}%`
              : '-'
          }
          description="This period"
          icon={<CheckCircle className="h-4 w-4" />}
          isLoading={statsLoading}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Period</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={period} onValueChange={(value) => setPeriod(value ?? '7d')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={actionFilter} onValueChange={(value) => setActionFilter(value ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes?.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={targetTypeFilter} onValueChange={(value) => setTargetTypeFilter(value ?? 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Target Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {targetTypes?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={outcomeFilter} onValueChange={(value) => setOutcomeFilter(value ?? 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            keyExtractor={(log) => log.id}
            emptyMessage="No audit logs found"
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
        </CardContent>
      </Card>
    </div>
  )
}
