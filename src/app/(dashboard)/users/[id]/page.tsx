'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Shield,
  FileText,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, StatusBadge, LoadingState } from '@/components/common'
import { useUserDetail } from '@/hooks/use-users'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: user, isLoading, error } = useUserDetail(resolvedParams.id)

  if (isLoading) {
    return <LoadingState message="Loading user details..." />
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="User Details" description={`Viewing profile for ${user.name}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <StatusBadge status={user.status} className="mt-2" />

              <Separator className="my-4" />

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{user.email}</span>
                  {user.emailVerified && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                    {user.phoneVerified && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Last login {format(new Date(user.lastLoginAt), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>2FA {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              {user.lockedAt && (
                <>
                  <Separator className="my-4" />
                  <div className="w-full p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm">
                    <p className="font-medium text-red-600 dark:text-red-400">Account Locked</p>
                    <p className="text-muted-foreground mt-1">{user.lockoutReason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Locked at {format(new Date(user.lockedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="organization" className="p-6">
            <TabsList>
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
              <TabsTrigger value="activity">Login History</TabsTrigger>
            </TabsList>

            <TabsContent value="organization" className="mt-4">
              {user.organization ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.organization.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.organization.planName} Plan
                      </p>
                    </div>
                    <StatusBadge status={user.organization.subscriptionStatus} className="ml-auto" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Members</p>
                      <p className="text-lg font-semibold">{user.organization.memberCount}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="text-lg font-semibold">{user.organization.planCode}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/organizations/${user.organization?.id}`)}
                  >
                    View Organization
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  This user is not part of any organization
                </p>
              )}
            </TabsContent>

            <TabsContent value="notices" className="mt-4">
              <ScrollArea className="h-[300px]">
                {user.recentNotices && user.recentNotices.length > 0 ? (
                  <div className="space-y-3">
                    {user.recentNotices.map((notice) => (
                      <div
                        key={notice.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {notice.noticeNumber || notice.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">{notice.noticeType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={notice.status} />
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notice.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No notices found</p>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ScrollArea className="h-[300px]">
                {user.loginHistory && user.loginHistory.length > 0 ? (
                  <div className="space-y-3">
                    {user.loginHistory.map((login, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              login.success ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          <div>
                            <p className="text-sm">
                              {login.success ? 'Successful login' : 'Failed login attempt'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {login.ipAddress || 'Unknown IP'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(login.attemptedAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No login history</p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
