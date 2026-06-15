'use client'

import { format } from 'date-fns'
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader, LoadingState } from '@/components/common'
import { useSystemHealth } from '@/hooks/use-dashboard'
import { cn } from '@/lib/utils'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-500'
    case 'degraded':
      return 'bg-yellow-500'
    case 'down':
    case 'critical':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case 'down':
    case 'critical':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <Activity className="h-5 w-5 text-gray-500" />
  }
}

const componentIcons: Record<string, React.ReactNode> = {
  'API Gateway': <Server className="h-5 w-5" />,
  'Main API': <Server className="h-5 w-5" />,
  'AI Service': <Cpu className="h-5 w-5" />,
  Database: <Database className="h-5 w-5" />,
  Redis: <HardDrive className="h-5 w-5" />,
  S3: <HardDrive className="h-5 w-5" />,
}

export default function HealthPage() {
  const { data: health, isLoading, refetch } = useSystemHealth()

  if (isLoading) {
    return <LoadingState message="Loading system health..." />
  }

  const healthyCount = health?.components.filter((c) => c.status === 'healthy').length ?? 0
  const totalCount = health?.components.length ?? 0
  const healthPercentage = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="System Health"
          description="Real-time monitoring of platform services"
        />
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'h-16 w-16 rounded-full flex items-center justify-center',
                  health?.status === 'healthy' && 'bg-green-100 dark:bg-green-900/30',
                  health?.status === 'degraded' && 'bg-yellow-100 dark:bg-yellow-900/30',
                  health?.status === 'critical' && 'bg-red-100 dark:bg-red-900/30'
                )}
              >
                {getStatusIcon(health?.status ?? 'unknown')}
              </div>
              <div>
                <h2 className="text-2xl font-semibold capitalize">
                  System {health?.status ?? 'Unknown'}
                </h2>
                <p className="text-muted-foreground">
                  {healthyCount} of {totalCount} services operational
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{healthPercentage.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">
                Last checked: {health?.lastCheckedAt ? format(new Date(health.lastCheckedAt), 'HH:mm:ss') : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {health?.components.map((component) => (
          <Card key={component.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    {componentIcons[component.name] ?? <Server className="h-5 w-5" />}
                  </div>
                  <CardTitle className="text-base">{component.name}</CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'capitalize',
                    component.status === 'healthy' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                    component.status === 'degraded' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                    component.status === 'down' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  )}
                >
                  {component.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {component.latencyMs !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latency</span>
                    <span
                      className={cn(
                        'font-medium',
                        component.latencyMs < 100 && 'text-green-600',
                        component.latencyMs >= 100 && component.latencyMs < 500 && 'text-yellow-600',
                        component.latencyMs >= 500 && 'text-red-600'
                      )}
                    >
                      {component.latencyMs}ms
                    </span>
                  </div>
                )}
                {component.message && (
                  <p className="text-sm text-muted-foreground">{component.message}</p>
                )}
                <Progress
                  value={component.status === 'healthy' ? 100 : component.status === 'degraded' ? 50 : 0}
                  className={cn(
                    'h-1',
                    component.status === 'healthy' && '[&>div]:bg-green-500',
                    component.status === 'degraded' && '[&>div]:bg-yellow-500',
                    component.status === 'down' && '[&>div]:bg-red-500'
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Response Time Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response Time Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm">Good (&lt;100ms)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm">Moderate (100-500ms)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm">Slow (&gt;500ms)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
