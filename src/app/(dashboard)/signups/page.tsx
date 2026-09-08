'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Phone, Smartphone, Globe, PhoneCall, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader, DataTable, type Column } from '@/components/common'
import {
  useSignupAttempts,
  useSetSignupAttemptContacted,
  useDeleteSignupAttempt,
} from '@/hooks/use-signup-attempts'
import type { SignupAttempt } from '@/lib/api/signups'

export default function IncompleteSignupsPage() {
  const [contactedFilter, setContactedFilter] = useState<string>('pending')
  const [search, setSearch] = useState('')
  const [contactTarget, setContactTarget] = useState<SignupAttempt | null>(null)
  const [contactNotes, setContactNotes] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<SignupAttempt | null>(null)

  const contacted =
    contactedFilter === 'pending' ? false : contactedFilter === 'contacted' ? true : undefined

  const { data, isLoading } = useSignupAttempts(contacted, search || undefined)
  const setContactedMutation = useSetSignupAttemptContacted()
  const deleteMutation = useDeleteSignupAttempt()

  const openContactDialog = (attempt: SignupAttempt) => {
    setContactTarget(attempt)
    setContactNotes(attempt.contactNotes ?? '')
  }

  const saveContacted = () => {
    if (!contactTarget) return
    setContactedMutation.mutate(
      { id: contactTarget.id, contacted: true, notes: contactNotes },
      { onSuccess: () => setContactTarget(null) }
    )
  }

  const columns: Column<SignupAttempt>[] = [
    {
      key: 'lead',
      header: 'Lead',
      cell: (attempt) => (
        <div>
          <a
            href={`tel:+91${attempt.mobile.slice(-10)}`}
            className="flex items-center gap-1.5 font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {attempt.mobile}
          </a>
          <p className="text-xs text-muted-foreground">
            {attempt.name ?? 'Name not captured'}
            {attempt.email ? ` · ${attempt.email}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (attempt) => (
        <Badge variant="outline" className="gap-1">
          {attempt.source === 'mobile' ? (
            <Smartphone className="h-3 w-3" />
          ) : (
            <Globe className="h-3 w-3" />
          )}
          {attempt.source === 'mobile' ? 'Mobile app' : 'Web'}
        </Badge>
      ),
    },
    {
      key: 'verified',
      header: 'Verified',
      cell: (attempt) => (
        <span
          className="text-sm text-muted-foreground"
          title={format(new Date(attempt.mobileVerifiedAt), 'PPpp')}
        >
          {formatDistanceToNow(new Date(attempt.mobileVerifiedAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (attempt) =>
        attempt.contactedAt ? (
          <div>
            <Badge variant="secondary">Contacted</Badge>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(attempt.contactedAt), { addSuffix: true })}
            </p>
          </div>
        ) : (
          <Badge variant="destructive">Awaiting call</Badge>
        ),
    },
    {
      key: 'notes',
      header: 'Notes',
      cell: (attempt) => (
        <span className="block max-w-[240px] truncate text-sm text-muted-foreground">
          {attempt.contactNotes ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (attempt) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openContactDialog(attempt)
            }}
          >
            <PhoneCall className="mr-1 h-3.5 w-3.5" />
            {attempt.contactedAt ? 'Edit notes' : 'Mark contacted'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(attempt)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incomplete Signups"
        description="People who verified their mobile with OTP but never finished registration — call them and find out what went wrong. Entries disappear automatically when the signup completes."
      />

      <div className="flex flex-wrap items-center gap-4">
        <Select value={contactedFilter} onValueChange={(value) => setContactedFilter(value ?? 'pending')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="pending">Awaiting call</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search mobile, name, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[260px]"
        />
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} {data.total === 1 ? 'lead' : 'leads'}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(attempt) => attempt.id}
        emptyMessage="No incomplete signups — everyone who verified finished registering 🎉"
      />

      {/* Mark contacted / edit notes */}
      <Dialog open={!!contactTarget} onOpenChange={(open) => !open && setContactTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as contacted</DialogTitle>
            <DialogDescription>
              {contactTarget?.mobile}
              {contactTarget?.name ? ` · ${contactTarget.name}` : ''} — record what you learned on
              the call.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Payment page confused them; will retry tomorrow"
            value={contactNotes}
            onChange={(e) => setContactNotes(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactTarget(null)}>
              Cancel
            </Button>
            <Button onClick={saveContacted} disabled={setContactedMutation.isPending}>
              {setContactedMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.mobile} will be removed from the list permanently. Use this for wrong
              numbers or people who asked not to be called.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  })
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
