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
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
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
