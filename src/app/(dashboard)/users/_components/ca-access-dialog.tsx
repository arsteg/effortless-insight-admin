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
import type { AdminUserDetailResponse, AdminUserListItem } from '@/types/admin'
import { useGrantCaAccess, useRevokeCaAccess } from '@/hooks/use-users'

const caAccessSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)'),
})

type CaAccessFormData = z.infer<typeof caAccessSchema>

interface CaAccessDialogProps {
  user: AdminUserListItem | AdminUserDetailResponse | null
  mode: 'grant' | 'revoke'
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CaAccessDialog({ user, mode, open, onOpenChange }: CaAccessDialogProps) {
  const grantMutation = useGrantCaAccess()
  const revokeMutation = useRevokeCaAccess()
  const mutation = mode === 'grant' ? grantMutation : revokeMutation

  const form = useForm<CaAccessFormData>({
    resolver: zodResolver(caAccessSchema),
    defaultValues: { reason: '' },
  })

  const handleSubmit = async (data: CaAccessFormData) => {
    if (!user) return

    await mutation.mutateAsync({ userId: user.id, reason: data.reason })
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'grant' ? 'Grant Free CA Access' : 'Revoke Free CA Access'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'grant'
              ? `This waives subscription requirements for every organization ${user?.name} owns, effective immediately.`
              : `This immediately removes ${user?.name}'s free access. Any organization they own will be billed against its actual subscription plan on the next request.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              placeholder={
                mode === 'grant'
                  ? 'Why is this CA being granted free access (e.g. verified CA, partnership agreement)...'
                  : 'Why is this CA’s free access being revoked...'
              }
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={mode === 'grant' ? 'default' : 'destructive'}
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'grant' ? 'Grant Access' : 'Revoke Access'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
