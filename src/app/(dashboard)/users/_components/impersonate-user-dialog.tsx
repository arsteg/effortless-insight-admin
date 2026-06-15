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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AdminUserListItem } from '@/types/admin'
import { useImpersonateUser } from '@/hooks/use-users'

const impersonateSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)'),
  acknowledged: z.boolean().refine((val) => val === true, 'You must acknowledge the warning'),
})

type ImpersonateFormData = z.infer<typeof impersonateSchema>

interface ImpersonateUserDialogProps {
  user: AdminUserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImpersonateUserDialog({ user, open, onOpenChange }: ImpersonateUserDialogProps) {
  const impersonateMutation = useImpersonateUser()
  const [acknowledged, setAcknowledged] = useState(false)

  const form = useForm<ImpersonateFormData>({
    resolver: zodResolver(impersonateSchema),
    defaultValues: {
      reason: '',
      acknowledged: false,
    },
  })

  const handleSubmit = async (data: ImpersonateFormData) => {
    if (!user) return

    await impersonateMutation.mutateAsync({
      userId: user.id,
      reason: data.reason,
      readOnly: true,
    })
    onOpenChange(false)
    form.reset()
    setAcknowledged(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Impersonate User</DialogTitle>
          <DialogDescription>
            View the platform as {user?.name} in read-only mode for support purposes.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            This action will be logged in the audit trail. You will have read-only access
            and cannot make any changes on behalf of the user.
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for impersonation</Label>
            <Textarea
              placeholder="Describe why you need to impersonate this user (e.g., investigating support ticket #1234)..."
              rows={3}
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="acknowledged"
              checked={acknowledged}
              onCheckedChange={(checked) => {
                setAcknowledged(!!checked)
                form.setValue('acknowledged', !!checked)
              }}
            />
            <Label htmlFor="acknowledged" className="text-sm font-normal">
              I understand that this action is logged and will only use impersonation
              for legitimate support purposes.
            </Label>
          </div>
          {form.formState.errors.acknowledged && (
            <p className="text-sm text-destructive">
              {form.formState.errors.acknowledged.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={impersonateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={impersonateMutation.isPending || !acknowledged}>
              {impersonateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Start Impersonation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
