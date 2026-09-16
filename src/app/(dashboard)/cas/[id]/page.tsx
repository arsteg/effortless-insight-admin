'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Users,
  FileText,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminCaStatus } from '@/types/admin'
import {
  useCaDetail,
  useVerifyCa,
  useRevokeVerification,
  useSuspendCa,
  useUnsuspendCa,
  useGrantCaFreePlan,
  useRevokeCaFreePlan,
} from '@/hooks/use-cas'

function getStatusBadge(status: AdminCaStatus) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-500">Active</Badge>
    case 'suspended':
      return <Badge variant="destructive">Suspended</Badge>
    case 'pending_verification':
      return <Badge variant="secondary">Pending Verification</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function CaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const caProfileId = params.id as string

  const { data: ca, isLoading } = useCaDetail(caProfileId)

  const verifyMutation = useVerifyCa()
  const revokeVerificationMutation = useRevokeVerification()
  const suspendMutation = useSuspendCa()
  const unsuspendMutation = useUnsuspendCa()
  const grantFreePlanMutation = useGrantCaFreePlan()
  const revokeFreePlanMutation = useRevokeCaFreePlan()

  const isFreePlanUpdating =
    grantFreePlanMutation.isPending || revokeFreePlanMutation.isPending

  const handleFreePlanChange = (allow: boolean) => {
    if (allow) {
      grantFreePlanMutation.mutate({ caProfileId })
    } else {
      revokeFreePlanMutation.mutate({ caProfileId })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!ca) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/cas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to CAs
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground">CA profile not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <RequirePermission permission={ADMIN_PERMISSIONS.USERS_VIEW}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{ca.userName}</h1>
              {getStatusBadge(ca.status)}
              {ca.isVerified && (
                <Badge variant="default" className="bg-green-500 gap-1">
                  <Shield className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{ca.userEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            {!ca.isVerified ? (
              <Button
                variant="outline"
                onClick={() => verifyMutation.mutate({
                  caProfileId: ca.id,
                  request: { membershipVerified: true },
                })}
                disabled={verifyMutation.isPending}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Verify CA
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => revokeVerificationMutation.mutate({ caProfileId: ca.id })}
                disabled={revokeVerificationMutation.isPending}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Revoke Verification
              </Button>
            )}
            {ca.status === 'active' ? (
              <Button
                variant="destructive"
                onClick={() => suspendMutation.mutate({
                  caProfileId: ca.id,
                  request: { reason: 'Admin action' },
                })}
                disabled={suspendMutation.isPending}
              >
                <UserX className="mr-2 h-4 w-4" />
                Suspend
              </Button>
            ) : ca.status === 'suspended' ? (
              <Button
                onClick={() => unsuspendMutation.mutate(ca.id)}
                disabled={unsuspendMutation.isPending}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Unsuspend
              </Button>
            ) : null}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ca.activeClientCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ca.pendingInvitationCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authorized GSTINs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ca.totalAuthorizedGstins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {format(new Date(ca.createdAt), 'MMM d, yyyy')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="clients">Clients ({ca.relationships?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="invitations">Invitations ({ca.recentInvitations?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{ca.userName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{ca.userEmail}</span>
                  </div>
                  {ca.userMobile && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Mobile</span>
                      <span className="font-medium">{ca.userMobile}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Firm Name</span>
                    <span className="font-medium">{ca.firmName || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">ICAI Membership</span>
                    <span className="font-medium">{ca.membershipNumber || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {ca.isVerified ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                        <Shield className="h-6 w-6 text-green-500" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            Verified Chartered Accountant
                          </p>
                          {ca.verifiedAt && (
                            <p className="text-sm text-green-600 dark:text-green-500">
                              Verified on {format(new Date(ca.verifiedAt), 'MMMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      {ca.verifiedByAdminName && (
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Verified By</span>
                          <span className="font-medium">{ca.verifiedByAdminName}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      <ShieldOff className="h-6 w-6 text-amber-500" />
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-400">
                          Not Verified
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-500">
                          This CA has not been verified yet
                        </p>
                      </div>
                    </div>
                  )}

                  {ca.status === 'suspended' && (
                    <div className="mt-4 space-y-2">
                      <Separator />
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                        <UserX className="h-6 w-6 text-red-500" />
                        <div>
                          <p className="font-medium text-red-700 dark:text-red-400">
                            Account Suspended
                          </p>
                          {ca.suspendedAt && (
                            <p className="text-sm text-red-600 dark:text-red-500">
                              Suspended on {format(new Date(ca.suspendedAt), 'MMMM d, yyyy')}
                            </p>
                          )}
                          {ca.suspendedReason && (
                            <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                              Reason: {ca.suspendedReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Free plan access */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Access</CardTitle>
                  <CardDescription>
                    Chartered Accountants use EffortlessInsight free of charge. Enabling this
                    puts their organization on the CA operator plan as a normal active
                    subscription; disabling it cancels that subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RequirePermission permission={ADMIN_PERMISSIONS.USERS_SUSPEND}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="allowFreePlan"
                        checked={ca.allowFreePlan}
                        disabled={isFreePlanUpdating}
                        onCheckedChange={(checked) => handleFreePlanChange(checked === true)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="allowFreePlan" className="text-sm font-medium">
                          Allow Free Plan for CA
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {ca.allowFreePlan
                            ? 'This CA has free access to the application.'
                            : 'This CA cannot access the application until the free plan is enabled or they subscribe to a paid plan.'}
                        </p>
                      </div>
                    </div>
                  </RequirePermission>

                  {!ca.organizationId && (
                    <p className="text-sm text-muted-foreground">
                      This CA has not created an organization yet. The grant is saved now and
                      applied automatically when they do.
                    </p>
                  )}

                  {ca.freePlanGrantedAt && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-muted-foreground">Granted</span>
                      <span className="font-medium">
                        {format(new Date(ca.freePlanGrantedAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {!ca.allowFreePlan && ca.freePlanRevokedAt && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-muted-foreground">Revoked</span>
                      <span className="font-medium">
                        {format(new Date(ca.freePlanRevokedAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Client Relationships</CardTitle>
                <CardDescription>All clients associated with this CA</CardDescription>
              </CardHeader>
              <CardContent>
                {ca.relationships && ca.relationships.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>GSTINs</TableHead>
                        <TableHead>Notices</TableHead>
                        <TableHead>Accepted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ca.relationships.map((rel) => (
                        <TableRow key={rel.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rel.clientUserName}</p>
                              <p className="text-sm text-muted-foreground">{rel.clientUserEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{rel.organizationName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={rel.status === 'active' ? 'default' : 'secondary'}>
                              {rel.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{rel.gstinCount}</TableCell>
                          <TableCell>{rel.noticeCount}</TableCell>
                          <TableCell>
                            {rel.acceptedAt
                              ? format(new Date(rel.acceptedAt), 'MMM d, yyyy')
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No client relationships found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invitations</CardTitle>
                <CardDescription>Invitations sent by this CA</CardDescription>
              </CardHeader>
              <CardContent>
                {ca.recentInvitations && ca.recentInvitations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invitee Email</TableHead>
                        <TableHead>GSTIN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ca.recentInvitations.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.inviteeEmail}</TableCell>
                          <TableCell>
                            <code className="text-sm">{inv.gstin}</code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                inv.status === 'accepted'
                                  ? 'default'
                                  : inv.status === 'pending'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(inv.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(inv.expiresAt), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No invitations found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RequirePermission>
  )
}
