'use client'

import type { ReactNode } from 'react'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { RequireAuth } from '@/components/auth/require-auth'
import { ErrorBoundary } from '@/components/error-boundary'
import type { AdminPermission } from '@/types/admin'

interface AdminLayoutProps {
  children: ReactNode
  permissions?: (AdminPermission | string)[]
  requireAll?: boolean
}

export function AdminLayout({ children, permissions, requireAll }: AdminLayoutProps) {
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
    </RequireAuth>
  )
}
