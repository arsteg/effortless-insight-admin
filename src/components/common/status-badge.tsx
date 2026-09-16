import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default'

interface StatusBadgeProps {
  status: string
  type?: StatusType
  className?: string
}

const statusTypeMap: Record<string, StatusType> = {
  // User/Org statuses
  active: 'success',
  suspended: 'error',
  inactive: 'warning',
  pending: 'warning',
  deleted: 'error',
  // Subscription statuses
  trialing: 'info',
  active_subscription: 'success',
  past_due: 'warning',
  cancelled: 'error',
  unpaid: 'error',
  // Payment/Invoice statuses
  paid: 'success',
  failed: 'error',
  refunded: 'warning',
  pending_payment: 'warning',
  // Health statuses
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
  critical: 'error',
  // Alert statuses
  acknowledged: 'warning',
  resolved: 'success',
  // Credit statuses
  available: 'success',
  expired: 'error',
  used: 'default',
}

const typeStyles: Record<StatusType, string> = {
  success: 'bg-mint-50 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  error: 'bg-coral-50 text-coral-700 dark:bg-coral-500/15 dark:text-coral-300',
  info: 'bg-azure-50 text-azure-700 dark:bg-azure-500/15 dark:text-azure-300',
  default: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_')
  const statusType = type || statusTypeMap[normalizedStatus] || 'default'

  return (
    <Badge
      variant="secondary"
      className={cn('font-medium', typeStyles[statusType], className)}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
    </Badge>
  )
}
