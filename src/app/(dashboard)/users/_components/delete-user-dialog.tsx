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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { AdminUserListItem } from '@/types/admin'
import { useDeleteUser } from '@/hooks/use-users'

interface DeleteUserDialogProps {
  user: AdminUserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const deleteMutation = useDeleteUser()
  const [gdprRequest, setGdprRequest] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const isConfirmed = confirmText === user?.email

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isConfirmed) return

    await deleteMutation.mutateAsync({
      userId: user.id,
      reason,
      gdprRequest,
      confirmed: true,
    })
    onOpenChange(false)
    setReason('')
    setConfirmText('')
    setGdprRequest(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete User</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The user&apos;s account will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            This will permanently delete all data associated with {user?.name}:
            <ul className="mt-2 list-disc list-inside text-sm">
              <li>User profile and settings</li>
              <li>All notices and documents</li>
              <li>Activity history and audit logs</li>
              <li>Any organization memberships</li>
            </ul>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for deletion</Label>
            <Textarea
              placeholder="Provide a reason for deleting this user..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="gdpr"
              checked={gdprRequest}
              onCheckedChange={(checked) => setGdprRequest(!!checked)}
            />
            <Label htmlFor="gdpr" className="text-sm font-normal">
              This is a GDPR data deletion request
            </Label>
          </div>

          <div className="space-y-2">
            <Label>
              Type <span className="font-mono font-semibold">{user?.email}</span> to confirm
            </Label>
            <Input
              placeholder="Enter email to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={deleteMutation.isPending || !isConfirmed || !reason}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete User Permanently
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
