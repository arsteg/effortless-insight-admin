import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'

type StatAccent = 'azure' | 'mint' | 'amber' | 'lavender' | 'coral'

const accentChip: Record<StatAccent, string> = {
  azure: 'bg-azure-50 text-azure-600 dark:bg-azure-500/15 dark:text-azure-300',
  mint: 'bg-mint-50 text-mint-600 dark:bg-mint-500/15 dark:text-mint-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  lavender: 'bg-lavender-50 text-lavender-600 dark:bg-lavender-500/15 dark:text-lavender-300',
  coral: 'bg-coral-50 text-coral-600 dark:bg-coral-500/15 dark:text-coral-300',
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  /** Accent family for the icon chip (see DESIGN_SYSTEM.md). Defaults to azure. */
  accent?: StatAccent
  trend?: number
  trendLabel?: string
  isLoading?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon,
  accent = 'azure',
  trend,
  trendLabel,
  isLoading,
  className,
}: StatCardProps) {
  const isPositiveTrend = trend !== undefined && trend >= 0

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-20" />
          </CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accentChip[accent])}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 font-semibold tabular-nums',
                isPositiveTrend ? 'text-mint-600' : 'text-coral-600'
              )}
            >
              {isPositiveTrend ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
          {(description || trendLabel) && (
            <span>{description || trendLabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
