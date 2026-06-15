'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertTriangle } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AdminInvoiceListItem } from '@/types/admin'
import { useProcessRefund } from '@/hooks/use-billing'

const refundSchema = z.object({
  refundType: z.enum(['full', 'partial']),
  amount: z.number().optional(),
  reason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)'),
})

type RefundFormData = z.infer<typeof refundSchema>

interface RefundDialogProps {
  invoice: AdminInvoiceListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RefundDialog({ invoice, open, onOpenChange }: RefundDialogProps) {
  const processRefund = useProcessRefund()
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')

  const form = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      refundType: 'full',
      amount: undefined,
      reason: '',
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const handleSubmit = async (data: RefundFormData) => {
    if (!invoice) return

    const amount = data.refundType === 'full' ? null : data.amount ?? null

    await processRefund.mutateAsync({
      paymentId: invoice.id, // Using invoice ID as payment reference
      amount,
      reason: data.reason,
    })
    onOpenChange(false)
    form.reset()
    setRefundType('full')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Refund invoice {invoice?.invoiceNumber} for {invoice?.organizationName}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            This action will initiate a refund through Razorpay. The refund may take 5-7 business
            days to process.
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Invoice Total</span>
              <span className="font-medium">
                {invoice ? formatCurrency(invoice.totalAmount) : '-'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Refund Type</Label>
            <RadioGroup
              value={refundType}
              onValueChange={(value: 'full' | 'partial') => {
                setRefundType(value)
                form.setValue('refundType', value)
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal">
                  Full Refund
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="font-normal">
                  Partial Refund
                </Label>
              </div>
            </RadioGroup>
          </div>

          {refundType === 'partial' && (
            <div className="space-y-2">
              <Label>Refund Amount (INR)</Label>
              <Input
                type="number"
                min={1}
                max={invoice?.totalAmount}
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason for refund</Label>
            <Textarea
              placeholder="Explain why this refund is being processed..."
              rows={3}
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processRefund.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={processRefund.isPending}>
              {processRefund.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Process Refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
