'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { Loader2 } from 'lucide-react'
import type { AdminPermission } from '@/types/admin'

interface RequireAuthProps {
  children: ReactNode
  permissions?: (AdminPermission | string)[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function RequireAuth({
  children,
  permissions,
  requireAll = false,
  fallback,
}: RequireAuthProps) {
  const router = useRouter()
  const { isAuthenticated, isMfaVerified, isLoading, loadUser, hasPermission, hasAnyPermission } =
    useAdminAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || !isMfaVerified) {
    return null
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? permissions.every((p) => hasPermission(p))
      : hasAnyPermission(permissions)

    if (!hasAccess) {
      if (fallback) {
        return <>{fallback}</>
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground mt-2">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

interface RequirePermissionProps {
  permission: AdminPermission | string
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePermission({ permission, children, fallback }: RequirePermissionProps) {
  const { hasPermission } = useAdminAuthStore()

  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

interface RequireAnyPermissionProps {
  permissions: (AdminPermission | string)[]
  children: ReactNode
  fallback?: ReactNode
}

export function RequireAnyPermission({ permissions, children, fallback }: RequireAnyPermissionProps) {
  const { hasAnyPermission } = useAdminAuthStore()

  if (!hasAnyPermission(permissions)) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

interface RequireRoleProps {
  role: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const { isRole } = useAdminAuthStore()

  const roles = Array.isArray(role) ? role : [role]
  const hasRole = roles.some((r) => isRole(r))

  if (!hasRole) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
