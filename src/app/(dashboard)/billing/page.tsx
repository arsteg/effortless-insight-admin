'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  CreditCard,
  TrendingUp,
  RefreshCw,
  DollarSign,
  Users,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, StatCard, LoadingState } from '@/components/common'
import { useBillingOverview } from '@/hooks/use-billing'
import { SubscriptionsTab } from './_components/subscriptions-tab'
import { InvoicesTab } from './_components/invoices-tab'

const periodOptions = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: '12m', label: 'Last 12 months' },
]

export default function BillingPage() {
  const [period, setPeriod] = useState('30d')
  const { data: overview, isLoading, refetch } = useBillingOverview(period)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Billing"
          description="Manage subscriptions, invoices, and revenue"
        />
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value) => setPeriod(value ?? '30d')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={overview ? formatCurrency(overview.mrr) : '-'}
          description="MRR"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Revenue Collected"
          value={overview ? formatCurrency(overview.revenueCollected) : '-'}
          description="This period"
          icon={<DollarSign className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Subscriptions"
          value={overview?.activeSubscriptions.toLocaleString() ?? '-'}
          description={`${overview?.trialSubscriptions ?? 0} in trial`}
          icon={<Users className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Refunds Issued"
          value={overview ? formatCurrency(overview.refundsIssued) : '-'}
          description="This period"
          icon={<CreditCard className="h-4 w-4" />}
          isLoading={isLoading}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Annual Recurring Revenue</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                formatCurrency(overview?.arr ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Projected annual revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trial Conversion Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                <>
                  {overview?.trialConversionRate?.toFixed(1) ?? 0}%
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Trials converting to paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelled Subscriptions</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {isLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                <>
                  {overview?.cancelledSubscriptions ?? 0}
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Subscriptions and Invoices */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <SubscriptionsTab />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
