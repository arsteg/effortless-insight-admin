'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { adminApi, type BillingSystemSettings } from '@/lib/api/admin'

export function BillingSettingsTab() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'billing-settings'],
    queryFn: () => adminApi.systemSettings.getBillingSettings(),
    staleTime: 60000,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<BillingSystemSettings>) =>
      adminApi.systemSettings.updateBillingSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing-settings'] })
      toast.success('Billing settings updated')
    },
    onError: () => {
      toast.error('Failed to update billing settings')
    },
  })

  const handleToggle = (key: keyof BillingSystemSettings, value: boolean) => {
    updateMutation.mutate({ [key]: value })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Billing Settings
        </CardTitle>
        <CardDescription>
          Global billing configuration that affects all users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="additional-seats">Additional Seats / Per-Seat Pricing</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to purchase additional seats beyond their plan limit.
              When disabled, the &quot;Add Seats&quot; option will be hidden from all users.
            </p>
          </div>
          <Switch
            id="additional-seats"
            checked={settings?.additionalSeatsEnabled ?? true}
            onCheckedChange={(checked) => handleToggle('additionalSeatsEnabled', checked)}
            disabled={updateMutation.isPending}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="trial-enabled">Trial Period</Label>
            <p className="text-sm text-muted-foreground">
              Allow new users to start a free trial before subscribing.
            </p>
          </div>
          <Switch
            id="trial-enabled"
            checked={settings?.trialEnabled ?? true}
            onCheckedChange={(checked) => handleToggle('trialEnabled', checked)}
            disabled={updateMutation.isPending}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="downgrades-allowed">Allow Plan Downgrades</Label>
            <p className="text-sm text-muted-foreground">
              When disabled, users can only upgrade to higher plans and cannot downgrade
              to lower-priced plans. A message will be shown on the pricing page informing
              users of this restriction.
            </p>
          </div>
          <Switch
            id="downgrades-allowed"
            checked={settings?.downgradesAllowed ?? false}
            onCheckedChange={(checked) => handleToggle('downgradesAllowed', checked)}
            disabled={updateMutation.isPending}
          />
        </div>

        {!settings?.downgradesAllowed && (
          <>
            <Separator />
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Plan downgrades are currently disabled. Users will see a message
                on the pricing page informing them that they can only upgrade to higher plans.
                If they need to downgrade, they should contact support.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
