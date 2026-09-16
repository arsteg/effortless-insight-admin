'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { AdminCaProfileListItem } from '@/types/admin'
import { useVerifyCa } from '@/hooks/use-cas'

interface VerifyCaDialogProps {
  ca: AdminCaProfileListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerifyCaDialog({ ca, open, onOpenChange }: VerifyCaDialogProps) {
  const [membershipVerified, setMembershipVerified] = useState(false)
  const [notes, setNotes] = useState('')

  const verifyMutation = useVerifyCa()

  const handleVerify = async () => {
    await verifyMutation.mutateAsync({
      caProfileId: ca.id,
      request: {
        membershipVerified,
        notes: notes || undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Verify CA
          </DialogTitle>
          <DialogDescription>
            Verify {ca.userName} as a Chartered Accountant. This will display a verification badge on their profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-medium">{ca.userName}</p>
            <p className="text-sm text-muted-foreground">{ca.userEmail}</p>
            {ca.firmName && (
              <p className="text-sm">Firm: {ca.firmName}</p>
            )}
            {ca.membershipNumber && (
              <p className="text-sm">ICAI Membership: {ca.membershipNumber}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="membershipVerified"
              checked={membershipVerified}
              onCheckedChange={(checked) => setMembershipVerified(checked === true)}
            />
            <Label htmlFor="membershipVerified" className="text-sm">
              I have verified the ICAI membership number
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any verification notes..."
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
            onClick={handleVerify}
            disabled={verifyMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {verifyMutation.isPending ? 'Verifying...' : 'Verify CA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
