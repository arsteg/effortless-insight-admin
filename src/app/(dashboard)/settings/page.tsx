'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Shield, Key, User, Bell, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { useAdminAuth, useMfaSetup } from '@/hooks/use-admin-auth'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(16, 'Password must be at least 16 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function SettingsPage() {
  const { adminUser } = useAdminAuthStore()
  const { changePassword, isChangingPassword } = useAdminAuth()
  const mfaSetup = useMfaSetup()

  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState({
    criticalAlerts: true,
    securityAlerts: true,
    dailySummary: false,
    emailNotifications: true,
  })

  const handleNotificationChange = (key: keyof typeof notificationPrefs, value: boolean) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true)
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate saving to localStorage
      localStorage.setItem('admin_notification_prefs', JSON.stringify(notificationPrefs))
      toast.success('Notification preferences saved')
    } catch (error) {
      toast.error('Failed to save notification preferences')
    } finally {
      setIsSavingNotifications(false)
    }
  }

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('admin_notification_prefs')
    if (saved) {
      try {
        setNotificationPrefs(JSON.parse(saved))
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, [])

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const handlePasswordChange = (data: ChangePasswordFormData) => {
    changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    })
    passwordForm.reset()
  }

  const handleMfaSetup = async () => {
    await mfaSetup.setupAsync()
    setShowMfaSetup(true)
  }

  const handleMfaConfirm = async () => {
    await mfaSetup.confirmAsync(mfaCode)
    setShowMfaSetup(false)
    setMfaCode('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View your admin profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={adminUser?.name ?? ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={adminUser?.email ?? ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={adminUser?.role?.replace(/_/g, ' ') ?? ''}
                    disabled
                    className="capitalize"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 h-10">
                    {adminUser?.isActive ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          {/* MFA Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </div>
                {adminUser?.mfaEnabled ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Disabled
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showMfaSetup && mfaSetup.setupData ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 p-4 rounded-lg border bg-muted/50">
                    <img
                      src={mfaSetup.setupData.qrCodeUri}
                      alt="MFA QR Code"
                      className="h-48 w-48"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      Scan this QR code with your authenticator app
                    </p>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Manual entry code:</p>
                      <code className="text-sm font-mono">{mfaSetup.setupData.secret}</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Enter verification code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                      />
                      <Button
                        onClick={handleMfaConfirm}
                        disabled={mfaSetup.isConfirming || mfaCode.length !== 6}
                      >
                        {mfaSetup.isConfirming && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verify
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setShowMfaSetup(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {adminUser?.mfaEnabled
                      ? 'Your account is protected with two-factor authentication.'
                      : 'Enable two-factor authentication for enhanced security.'}
                  </p>
                  {!adminUser?.mfaEnabled && (
                    <Button onClick={handleMfaSetup} disabled={mfaSetup.isSettingUp}>
                      {mfaSetup.isSettingUp && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Enable MFA
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password regularly for better security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register('currentPassword')}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="critical-alerts">Critical Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for critical system issues
                  </p>
                </div>
                <Switch
                  id="critical-alerts"
                  checked={notificationPrefs.criticalAlerts}
                  onCheckedChange={(checked) => handleNotificationChange('criticalAlerts', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="security-alerts">Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications for security-related events
                  </p>
                </div>
                <Switch
                  id="security-alerts"
                  checked={notificationPrefs.securityAlerts}
                  onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-summary">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of platform activity
                  </p>
                </div>
                <Switch
                  id="daily-summary"
                  checked={notificationPrefs.dailySummary}
                  onCheckedChange={(checked) => handleNotificationChange('dailySummary', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationPrefs.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                {isSavingNotifications ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
