'use client'

import { useState } from 'react'
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
import type { AdminOrganizationListItem } from '@/types/admin'
import { useDeleteOrganization } from '@/hooks/use-organizations'

interface DeleteOrganizationDialogProps {
  organization: AdminOrganizationListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteOrganizationDialog({
  organization,
  open,
  onOpenChange,
}: DeleteOrganizationDialogProps) {
  const deleteMutation = useDeleteOrganization()
  const [gdprRequest, setGdprRequest] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const isConfirmed = confirmText === organization?.name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization || !isConfirmed) return

    await deleteMutation.mutateAsync({
      orgId: organization.id,
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
          <DialogTitle className="text-destructive">Delete Organization</DialogTitle>
          <DialogDescription>
            This action cannot be undone. All organization data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Deleting {organization?.name} will permanently remove:
            <ul className="mt-2 list-disc list-inside text-sm">
              <li>All organization data and settings</li>
              <li>All member accounts (if sole organization)</li>
              <li>All notices and documents ({organization?.noticeCount} notices)</li>
              <li>Subscription and billing history</li>
            </ul>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for deletion</Label>
            <Textarea
              placeholder="Provide a reason for deleting this organization..."
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
              Type <span className="font-mono font-semibold">{organization?.name}</span> to confirm
            </Label>
            <Input
              placeholder="Enter organization name to confirm"
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
              Delete Organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
