'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { RequireAuth } from '@/components/auth/require-auth'
import { ErrorBoundary } from '@/components/error-boundary'
import { useIdleTimeout } from '@/hooks/use-idle-timeout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { AdminPermission } from '@/types/admin'

interface AdminLayoutProps {
  children: ReactNode
  permissions?: (AdminPermission | string)[]
  requireAll?: boolean
}

export function AdminLayout({ children, permissions, requireAll }: AdminLayoutProps) {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  const handleWarning = useCallback(() => {
    setShowTimeoutWarning(true)
  }, [])

  const handleTimeout = useCallback(() => {
    toast.info('You have been logged out due to inactivity')
  }, [])

  const { resetTimers } = useIdleTimeout({
    onWarning: handleWarning,
    onTimeout: handleTimeout,
    enabled: true,
  })

  const handleStayLoggedIn = useCallback(() => {
    setShowTimeoutWarning(false)
    resetTimers()
  }, [resetTimers])

  return (
    <RequireAuth permissions={permissions} requireAll={requireAll}>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>

      <AlertDialog open={showTimeoutWarning} onOpenChange={setShowTimeoutWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
            <AlertDialogDescription>
              Your session will expire in 2 minutes due to inactivity.
              Click below to stay logged in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleStayLoggedIn}>
              Stay Logged In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RequireAuth>
  )
}
