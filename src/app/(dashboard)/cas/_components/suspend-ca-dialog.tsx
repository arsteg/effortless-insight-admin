'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AdminCaProfileListItem } from '@/types/admin'
import { useSuspendCa } from '@/hooks/use-cas'

interface SuspendCaDialogProps {
  ca: AdminCaProfileListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuspendCaDialog({ ca, open, onOpenChange }: SuspendCaDialogProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const suspendMutation = useSuspendCa()

  const handleSuspend = async () => {
    if (!reason.trim()) return

    await suspendMutation.mutateAsync({
      caProfileId: ca.id,
      request: {
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Suspend CA
          </DialogTitle>
          <DialogDescription>
            Suspend {ca.userName}&apos;s CA account. They will lose access to all client data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Suspending this CA will:
              <ul className="list-disc ml-4 mt-2">
                <li>Revoke access to all {ca.activeClientCount} active client(s)</li>
                <li>Cancel all {ca.pendingInvitationCount} pending invitation(s)</li>
                <li>Prevent the CA from sending new invitations</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-medium">{ca.userName}</p>
            <p className="text-sm text-muted-foreground">{ca.userEmail}</p>
            {ca.firmName && (
              <p className="text-sm">Firm: {ca.firmName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for suspension *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this CA is being suspended..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any internal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSuspend}
            disabled={!reason.trim() || suspendMutation.isPending}
          >
            {suspendMutation.isPending ? 'Suspending...' : 'Suspend CA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
