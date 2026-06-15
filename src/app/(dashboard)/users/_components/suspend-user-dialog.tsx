'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminUserListItem } from '@/types/admin'
import { useSuspendUser } from '@/hooks/use-users'

const suspendSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  notes: z.string().optional(),
})

type SuspendFormData = z.infer<typeof suspendSchema>

const suspendReasons = [
  { value: 'violation_terms', label: 'Terms of Service Violation' },
  { value: 'payment_issue', label: 'Payment Issues' },
  { value: 'fraudulent_activity', label: 'Fraudulent Activity' },
  { value: 'user_request', label: 'User Requested' },
  { value: 'security_concern', label: 'Security Concern' },
  { value: 'other', label: 'Other' },
]

interface SuspendUserDialogProps {
  user: AdminUserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuspendUserDialog({ user, open, onOpenChange }: SuspendUserDialogProps) {
  const suspendMutation = useSuspendUser()
  const [selectedReason, setSelectedReason] = useState('')

  const form = useForm<SuspendFormData>({
    resolver: zodResolver(suspendSchema),
    defaultValues: {
      reason: '',
      notes: '',
    },
  })

  const handleSubmit = async (data: SuspendFormData) => {
    if (!user) return

    await suspendMutation.mutateAsync({
      userId: user.id,
      reason: data.reason,
      notes: data.notes,
    })
    onOpenChange(false)
    form.reset()
    setSelectedReason('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend User</DialogTitle>
          <DialogDescription>
            This will immediately suspend {user?.name}&apos;s account. They will not be able to
            log in until unsuspended.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for suspension</Label>
            <Select
              value={selectedReason}
              onValueChange={(value) => {
                setSelectedReason(value ?? '')
                form.setValue('reason', value ?? '')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {suspendReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Additional notes (optional)</Label>
            <Textarea
              placeholder="Provide additional context for this suspension..."
              {...form.register('notes')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={suspendMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Suspend User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
