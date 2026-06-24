'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Users,
  FileText,
  CreditCard,
  HardDrive,
  Gift,
  Calendar,
  Globe,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader, StatusBadge, LoadingState, StatCard } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS } from '@/types/admin'
import { useOrganizationDetail, useOrganizationCredits } from '@/hooks/use-organizations'
import { ApplyCreditDialog } from '../_components/apply-credit-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrganizationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [creditDialogOpen, setCreditDialogOpen] = useState(false)

  const { data: org, isLoading, error } = useOrganizationDetail(resolvedParams.id)
  const { data: credits, isLoading: creditsLoading } = useOrganizationCredits(resolvedParams.id)

  if (isLoading) {
    return <LoadingState message="Loading organization details..." />
  }

  if (error || !org) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {error ? `Error: ${error.message}` : 'Organization not found'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">ID: {resolvedParams.id}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={org.name} description="Organization Details" />
        <StatusBadge status={org.status} className="ml-auto" />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Members"
          value={org.members?.length ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Notices"
          value={org.usage?.noticeCount ?? 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title="Storage Used"
          value={`${((org.usage?.storageUsedMb ?? 0) / 1024).toFixed(1)} GB`}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <StatCard
          title="Active Credits"
          value={formatCurrency(org.usage?.activeCredits ?? 0)}
          icon={<Gift className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Organization Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{org.industry || 'Industry not specified'}</span>
              </div>
              {org.website && (
                <div className="flex items-start gap-3 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {org.website}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>Created {format(new Date(org.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <Separator />

            {/* Subscription Info */}
            {org.subscription && (
              <div className="space-y-2">
                <h4 className="font-medium">Subscription</h4>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{org.plan?.name ?? 'Unknown Plan'}</span>
                    <StatusBadge status={org.subscription.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {org.subscription.billingCycle} billing
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {org.subscription.seatsIncluded + org.subscription.seatsAdditional} seats total
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Renews {format(new Date(org.subscription.currentPeriodEnd), 'MMM d, yyyy')}
                  </p>
                  {org.subscription.cancelAtPeriodEnd && (
                    <Badge variant="destructive" className="text-xs">
                      Canceling at period end
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <RequirePermission permission={ADMIN_PERMISSIONS.ORGS_CREDITS}>
              <Button
                onClick={() => setCreditDialogOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Gift className="mr-2 h-4 w-4" />
                Apply Credit
              </Button>
            </RequirePermission>
          </CardContent>
        </Card>

        {/* Details Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="members" className="p-6">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="gstins">GSTINs</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              <ScrollArea className="h-[350px]">
                {org.members && org.members.length > 0 ? (
                  <div className="space-y-3">
                    {org.members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/users/${member.userId}`)}
                      >
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="capitalize">
                            {member.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No members found</p>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="gstins" className="mt-4">
              <ScrollArea className="h-[350px]">
                {org.gstinList && org.gstinList.length > 0 ? (
                  <div className="space-y-3">
                    {org.gstinList.map((gstin) => (
                      <div key={gstin.id} className="rounded-lg border p-3">
                        <p className="font-mono font-medium">{gstin.gstin}</p>
                        <p className="text-sm text-muted-foreground">{gstin.legalName}</p>
                        <p className="text-xs text-muted-foreground">{gstin.state}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No GSTINs registered</p>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="credits" className="mt-4">
              <ScrollArea className="h-[350px]">
                {creditsLoading ? (
                  <LoadingState size="sm" />
                ) : credits && credits.length > 0 ? (
                  <div className="space-y-3">
                    {credits.map((credit) => (
                      <div
                        key={credit.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{formatCurrency(credit.amount)}</p>
                          <p className="text-sm text-muted-foreground">{credit.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            By {credit.grantedBy} • {format(new Date(credit.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={credit.status} />
                          <p className="text-sm mt-1">
                            {formatCurrency(credit.remainingAmount)} remaining
                          </p>
                          {credit.expiresAt && (
                            <p className="text-xs text-muted-foreground">
                              Expires {format(new Date(credit.expiresAt), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No credits</p>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="invoices" className="mt-4">
              <ScrollArea className="h-[350px]">
                {org.recentInvoices && org.recentInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {org.recentInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                          <StatusBadge status={invoice.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">No invoices</p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <ApplyCreditDialog
        organization={org ? { id: org.id, name: org.name } as any : null}
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
      />
    </div>
  )
}
