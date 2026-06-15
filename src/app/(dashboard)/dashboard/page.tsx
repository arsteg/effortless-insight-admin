'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Users,
  Building2,
  CreditCard,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, StatCard, StatusBadge, LoadingState } from '@/components/common'
import {
  useDashboardMetrics,
  useSystemHealth,
  useSystemAlerts,
  useRecentActivity,
  useAcknowledgeAlert,
  useResolveAlert,
} from '@/hooks/use-dashboard'
import { cn } from '@/lib/utils'

const periodOptions = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export default function DashboardPage() {
  const [period, setPeriod] = useState('24h')

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics(period)
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth()
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useSystemAlerts()
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(10)

  const acknowledgeAlert = useAcknowledgeAlert()
  const resolveAlert = useResolveAlert()

  const handleRefresh = () => {
    refetchMetrics()
    refetchHealth()
    refetchAlerts()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          description="Overview of platform metrics and system health"
        />
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value) => setPeriod(value ?? '24h')}>
            <SelectTrigger className="w-[160px]">
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
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Users"
          value={metrics?.users.active.toLocaleString() ?? '-'}
          description={`${metrics?.users.new ?? 0} new this period`}
          trend={metrics?.users.growth}
          icon={<Users className="h-4 w-4" />}
          isLoading={metricsLoading}
        />
        <StatCard
          title="Organizations"
          value={metrics?.organizations.active.toLocaleString() ?? '-'}
          description={`${metrics?.organizations.new ?? 0} new this period`}
          icon={<Building2 className="h-4 w-4" />}
          isLoading={metricsLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={metrics?.revenue.mrr ? formatCurrency(metrics.revenue.mrr) : '-'}
          description="MRR"
          trend={metrics?.revenue.growth}
          icon={<CreditCard className="h-4 w-4" />}
          isLoading={metricsLoading}
        />
        <StatCard
          title="Notices Processed"
          value={metrics?.notices.completed.toLocaleString() ?? '-'}
          description={`${metrics?.notices.processing ?? 0} in queue`}
          icon={<FileText className="h-4 w-4" />}
          isLoading={metricsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Real-time status of platform services
                </CardDescription>
              </div>
              {health && (
                <StatusBadge status={health.status} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <LoadingState size="sm" />
            ) : health?.components ? (
              <div className="space-y-3">
                {health.components.map((component) => (
                  <div
                    key={component.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          component.status === 'healthy' && 'bg-green-500',
                          component.status === 'degraded' && 'bg-yellow-500',
                          component.status === 'down' && 'bg-red-500'
                        )}
                      />
                      <span className="font-medium">{component.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {component.latencyMs !== undefined && (
                        <span>{component.latencyMs}ms</span>
                      )}
                      <StatusBadge status={component.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No health data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Alerts
                </CardTitle>
                <CardDescription>
                  System alerts requiring attention
                </CardDescription>
              </div>
              {alertsData && (
                <Badge variant={alertsData.totalCount > 0 ? 'destructive' : 'secondary'}>
                  {alertsData.totalCount}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <LoadingState size="sm" />
            ) : alertsData?.alerts && alertsData.alerts.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {alertsData.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'rounded-lg border p-3',
                        alert.priority === 'critical' && 'border-red-500/50 bg-red-50 dark:bg-red-900/10',
                        alert.priority === 'high' && 'border-orange-500/50 bg-orange-50 dark:bg-orange-900/10'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alert.title}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                alert.priority === 'critical' && 'border-red-500 text-red-500',
                                alert.priority === 'high' && 'border-orange-500 text-orange-500',
                                alert.priority === 'medium' && 'border-yellow-500 text-yellow-500'
                              )}
                            >
                              {alert.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {alert.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(alert.createdAt), 'MMM d, HH:mm')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {alert.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => acknowledgeAlert.mutate(alert.id)}
                                disabled={acknowledgeAlert.isPending}
                              >
                                <Clock className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resolveAlert.mutate(alert.id)}
                                disabled={resolveAlert.isPending}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-muted-foreground">No active alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing Metrics & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notice Processing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Notice Processing
            </CardTitle>
            <CardDescription>
              AI processing performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <LoadingState size="sm" />
            ) : metrics?.notices ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">{metrics.notices.processing}</p>
                    <p className="text-sm text-muted-foreground">In Queue</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold">{metrics.notices.avgProcessingTimeSeconds}s</p>
                    <p className="text-sm text-muted-foreground">Avg Time</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">{metrics.notices.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-red-600">{metrics.notices.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {metrics.notices.total > 0
                        ? ((metrics.notices.completed / metrics.notices.total) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest admin actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <LoadingState size="sm" />
            ) : activities && activities.length > 0 ? (
              <ScrollArea className="h-[250px]">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full mt-1.5',
                          activity.outcome === 'success' ? 'bg-green-500' : 'bg-red-500'
                        )}
                      />
                      <div className="flex-1 space-y-1">
                        <p>
                          <span className="font-medium">{activity.adminUserName}</span>
                          {' '}
                          <span className="text-muted-foreground">{activity.action}</span>
                          {activity.targetType && (
                            <>
                              {' on '}
                              <span className="font-medium">{activity.targetType}</span>
                            </>
                          )}
                        </p>
                        {activity.description && (
                          <p className="text-muted-foreground">{activity.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
