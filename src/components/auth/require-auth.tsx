'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { useMfaSetup } from '@/hooks/use-admin-auth'
import { Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QRCodeSVG } from 'qrcode.react'
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
  // TODO: MFA temporarily disabled for development
  // if (adminUser && !adminUser.mfaEnabled) {
  //   return <MfaSetupRequired />
  // }

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

function MfaSetupRequired() {
  const [showSetup, setShowSetup] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const { loadUser } = useAdminAuthStore()
  const mfaSetup = useMfaSetup()

  const handleStartSetup = async () => {
    await mfaSetup.setupAsync()
    setShowSetup(true)
  }

  const handleConfirm = async () => {
    await mfaSetup.confirmAsync(mfaCode)
    setMfaCode('')
    setShowSetup(false)
    // Reload user to get updated mfaEnabled status
    await loadUser()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle>MFA Required</CardTitle>
          <CardDescription>
            Two-factor authentication is required for all admin accounts.
            {!showSetup && ' Please set up MFA to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showSetup && mfaSetup.setupData ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-4 rounded-lg border bg-muted/50">
                <QRCodeSVG
                  value={mfaSetup.setupData.qrCodeUri}
                  size={192}
                  level="M"
                  includeMargin
                />
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your authenticator app
                </p>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Manual entry code:</p>
                  <code className="text-sm font-mono break-all">{mfaSetup.setupData.secret}</code>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Enter verification code</Label>
                <div className="flex gap-2">
                  <Input
                    id="mfa-code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleConfirm}
                    disabled={mfaSetup.isConfirming || mfaCode.length !== 6}
                  >
                    {mfaSetup.isConfirming && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSetup(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button onClick={handleStartSetup} disabled={mfaSetup.isSettingUp}>
                {mfaSetup.isSettingUp && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Set Up MFA Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
