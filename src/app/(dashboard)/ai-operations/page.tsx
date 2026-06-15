'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Brain,
  RefreshCw,
  Play,
  XCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader, DataTable, StatusBadge, LoadingState, StatCard, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS } from '@/types/admin'
import {
  useAIQueueStats,
  useAIJobs,
  useRetryAIJob,
  useCancelAIJob,
  useAIPrompts,
} from '@/hooks/use-ai-ops'
import type { AIJob } from '@/lib/api/admin'
import { cn } from '@/lib/utils'

export default function AIOperationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAIQueueStats()
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useAIJobs({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    jobType: jobTypeFilter !== 'all' ? jobTypeFilter : undefined,
    page,
    pageSize,
  })
  const { data: prompts, isLoading: promptsLoading } = useAIPrompts()

  const retryJob = useRetryAIJob()
  const cancelJob = useCancelAIJob()

  const handleRefresh = () => {
    refetchStats()
    refetchJobs()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const columns: Column<AIJob>[] = [
    {
      key: 'job',
      header: 'Job',
      cell: (job) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <span className="font-medium">{job.jobType}</span>
            <p className="text-xs text-muted-foreground">
              Notice: {job.noticeId.slice(0, 8)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      cell: (job) => <span className="text-sm">{job.organizationName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (job) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(job.status)}
          <span className="capitalize text-sm">{job.status}</span>
        </div>
      ),
    },
    {
      key: 'attempts',
      header: 'Attempts',
      cell: (job) => (
        <span className="text-sm">
          {job.attempts} / {job.maxAttempts}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (job) => (
        <div className="text-sm">
          <p>{format(new Date(job.createdAt), 'MMM d, HH:mm')}</p>
          {job.processingTimeMs && (
            <p className="text-xs text-muted-foreground">
              {(job.processingTimeMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      cell: (job) => (
        <div className="flex gap-1">
          {(job.status === 'failed' || job.status === 'pending') && (
            <RequirePermission permission={ADMIN_PERMISSIONS.AI_OPS_RETRY}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => retryJob.mutate(job.id)}
                disabled={retryJob.isPending}
              >
                <Play className="h-4 w-4" />
              </Button>
            </RequirePermission>
          )}
          {(job.status === 'pending' || job.status === 'processing') && (
            <RequirePermission permission={ADMIN_PERMISSIONS.AI_OPS_RETRY}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => cancelJob.mutate(job.id)}
                disabled={cancelJob.isPending}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </RequirePermission>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="AI Operations"
          description="Monitor AI processing queue and job status"
        />
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Queue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="In Queue"
          value={stats?.totalPending.toLocaleString() ?? '-'}
          description="Pending jobs"
          icon={<Clock className="h-4 w-4" />}
          isLoading={statsLoading}
        />
        <StatCard
          title="Processing"
          value={stats?.totalProcessing.toLocaleString() ?? '-'}
          description="Active jobs"
          icon={<Zap className="h-4 w-4" />}
          isLoading={statsLoading}
        />
        <StatCard
          title="Success Rate"
          value={stats ? `${stats.successRate.toFixed(1)}%` : '-'}
          description="All time"
          icon={<CheckCircle className="h-4 w-4" />}
          isLoading={statsLoading}
        />
        <StatCard
          title="Avg Processing"
          value={stats ? `${(stats.avgProcessingTimeMs / 1000).toFixed(1)}s` : '-'}
          description="Per job"
          icon={<Brain className="h-4 w-4" />}
          isLoading={statsLoading}
        />
      </div>

      {/* Job Types Breakdown */}
      {stats?.jobsByType && stats.jobsByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.jobsByType.map((item) => (
                <div key={item.type} className="flex items-center gap-4">
                  <span className="w-32 text-sm font-medium capitalize">
                    {item.type.replace(/_/g, ' ')}
                  </span>
                  <Progress
                    value={(item.count / (stats.totalCompleted + stats.totalPending + stats.totalProcessing + stats.totalFailed)) * 100}
                    className="flex-1"
                  />
                  <span className="w-16 text-right text-sm text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Processing Queue</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Management</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardContent className="pt-6">
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={jobTypeFilter} onValueChange={(value) => setJobTypeFilter(value ?? 'all')}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="classification">Classification</SelectItem>
                    <SelectItem value="extraction">Extraction</SelectItem>
                    <SelectItem value="summarization">Summarization</SelectItem>
                    <SelectItem value="embedding">Embedding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DataTable
                columns={columns}
                data={jobs?.items ?? []}
                isLoading={jobsLoading}
                keyExtractor={(job) => job.id}
                emptyMessage="No jobs found"
                page={page}
                pageSize={pageSize}
                totalCount={jobs?.totalCount ?? 0}
                totalPages={jobs?.totalPages ?? 1}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setPage(1)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>AI Prompts</CardTitle>
              <CardDescription>
                Manage and version control AI processing prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {promptsLoading ? (
                <LoadingState size="sm" />
              ) : prompts && prompts.length > 0 ? (
                <div className="space-y-4">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{prompt.name}</span>
                          <Badge variant="outline">v{prompt.version}</Badge>
                          {prompt.isActive && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {prompt.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {format(new Date(prompt.updatedAt), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <RequirePermission permission={ADMIN_PERMISSIONS.AI_OPS_PROMPTS}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </RequirePermission>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No prompts configured
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
