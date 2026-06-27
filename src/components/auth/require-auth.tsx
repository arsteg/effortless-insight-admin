'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  const { adminUser, isAuthenticated, isMfaVerified, isLoading, loadUser, hasPermission, hasAnyPermission } =
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

  // Enforce MFA setup per security policy §7.1
  if (adminUser && !adminUser.mfaEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>MFA Required</CardTitle>
            <CardDescription>
              Two-factor authentication is required for all admin accounts.
              Please set up MFA to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/settings?tab=security')}>
              Set Up MFA Now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
