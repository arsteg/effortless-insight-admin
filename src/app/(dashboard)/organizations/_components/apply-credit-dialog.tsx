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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminOrganizationListItem } from '@/types/admin'
import { useApplyCredit } from '@/hooks/use-organizations'

const creditSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  reason: z.string().min(1, 'Please provide a reason'),
  type: z.string().min(1, 'Please select a credit type'),
  expiresAt: z.string().optional(),
})

type CreditFormData = z.infer<typeof creditSchema>

const creditTypes = [
  { value: 'promotional', label: 'Promotional' },
  { value: 'compensation', label: 'Service Compensation' },
  { value: 'referral', label: 'Referral Bonus' },
  { value: 'loyalty', label: 'Loyalty Reward' },
  { value: 'other', label: 'Other' },
]

interface ApplyCreditDialogProps {
  organization: AdminOrganizationListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplyCreditDialog({ organization, open, onOpenChange }: ApplyCreditDialogProps) {
  const applyCredit = useApplyCredit()

  const form = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      amount: 100,
      reason: '',
      type: '',
      expiresAt: '',
    },
  })

  const handleSubmit = async (data: CreditFormData) => {
    if (!organization) return

    await applyCredit.mutateAsync({
      orgId: organization.id,
      amount: data.amount,
      reason: data.reason,
      type: data.type,
      expiresAt: data.expiresAt || undefined,
    })
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Credit</DialogTitle>
          <DialogDescription>
            Add credit to {organization?.name}&apos;s account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (INR)</Label>
            <Input
              type="number"
              min={1}
              {...form.register('amount', { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Credit Type</Label>
            <Select
              value={form.watch('type')}
              onValueChange={(value) => form.setValue('type', value ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {creditTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-destructive">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="Why are you applying this credit?"
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Expiration Date (optional)</Label>
            <Input type="date" {...form.register('expiresAt')} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={applyCredit.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={applyCredit.isPending}>
              {applyCredit.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply Credit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
