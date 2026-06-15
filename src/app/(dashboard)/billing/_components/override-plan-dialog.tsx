'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminSubscriptionListItem } from '@/types/admin'
import { useOverridePlan } from '@/hooks/use-billing'

const overrideSchema = z.object({
  planCode: z.string().min(1, 'Please select a plan'),
  reason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)'),
  prorate: z.boolean(),
})

type OverrideFormData = z.infer<typeof overrideSchema>

const plans = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
]

interface OverridePlanDialogProps {
  subscription: AdminSubscriptionListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OverridePlanDialog({ subscription, open, onOpenChange }: OverridePlanDialogProps) {
  const overridePlan = useOverridePlan()

  const form = useForm<OverrideFormData>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      planCode: '',
      reason: '',
      prorate: true,
    },
  })

  const handleSubmit = async (data: OverrideFormData) => {
    if (!subscription) return

    await overridePlan.mutateAsync({
      subscriptionId: subscription.id,
      planCode: data.planCode,
      reason: data.reason,
      prorate: data.prorate,
    })
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Plan</DialogTitle>
          <DialogDescription>
            Change the subscription plan for {subscription?.organizationName}. Currently on{' '}
            {subscription?.planName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>New Plan</Label>
            <Select
              value={form.watch('planCode')}
              onValueChange={(value) => form.setValue('planCode', value ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans
                  .filter((p) => p.value !== subscription?.planCode)
                  .map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.formState.errors.planCode && (
              <p className="text-sm text-destructive">
                {form.formState.errors.planCode.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason for override</Label>
            <Textarea
              placeholder="Explain why this plan change is needed..."
              rows={3}
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="prorate"
              checked={form.watch('prorate')}
              onCheckedChange={(checked) => form.setValue('prorate', !!checked)}
            />
            <Label htmlFor="prorate" className="text-sm font-normal">
              Prorate the change (adjust billing for remaining period)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={overridePlan.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={overridePlan.isPending}>
              {overridePlan.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Override Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
