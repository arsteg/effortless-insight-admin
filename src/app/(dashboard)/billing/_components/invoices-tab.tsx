'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, Eye, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { DataTable, StatusBadge, type Column } from '@/components/common'
import { RequirePermission } from '@/components/auth'
import { ADMIN_PERMISSIONS, type AdminInvoiceListItem } from '@/types/admin'
import { useInvoices, useProcessRefund } from '@/hooks/use-billing'
import { RefundDialog } from './refund-dialog'
import { adminClient } from '@/lib/api/client'

export function InvoicesTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [refundInvoice, setRefundInvoice] = useState<AdminInvoiceListItem | null>(null)
  const [viewInvoice, setViewInvoice] = useState<AdminInvoiceListItem | null>(null)

  const handleDownloadPdf = async (invoice: AdminInvoiceListItem) => {
    try {
      const response = await adminClient.get(`/admin/billing/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Invoice downloaded successfully')
    } catch (error) {
      toast.error('Failed to download invoice PDF')
    }
  }

  const { data, isLoading } = useInvoices({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    pageSize,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const columns: Column<AdminInvoiceListItem>[] = [
    {
      key: 'invoice',
      header: 'Invoice',
      cell: (invoice) => (
        <div>
          <span className="font-medium font-mono">{invoice.invoiceNumber}</span>
          <p className="text-xs text-muted-foreground">
            {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      cell: (invoice) => <span className="text-sm">{invoice.organizationName}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (invoice) => (
        <div>
          <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
          <p className="text-xs text-muted-foreground">
            Tax: {formatCurrency(invoice.taxAmount)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (invoice) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[50px]',
      cell: (invoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setViewInvoice(invoice)}>
              <Eye className="mr-2 h-4 w-4" />
              View Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            {invoice.status === 'paid' && (
              <>
                <DropdownMenuSeparator />
                <RequirePermission permission={ADMIN_PERMISSIONS.BILLING_REFUND}>
                  <DropdownMenuItem onClick={() => setRefundInvoice(invoice)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Process Refund
                  </DropdownMenuItem>
                </RequirePermission>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <Card className="p-6">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        keyExtractor={(invoice) => invoice.id}
        emptyMessage="No invoices found"
        searchPlaceholder="Search by invoice number..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        page={page}
        pageSize={pageSize}
        totalCount={data?.totalCount ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />

      <RefundDialog
        invoice={refundInvoice}
        open={!!refundInvoice}
        onOpenChange={(open) => !open && setRefundInvoice(null)}
      />

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-medium">{viewInvoice.organizationName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={viewInvoice.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">{format(new Date(viewInvoice.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{format(new Date(viewInvoice.dueDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(viewInvoice.totalAmount - viewInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span>{formatCurrency(viewInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-t font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(viewInvoice.totalAmount)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewInvoice(null)}>
                  Close
                </Button>
                <Button onClick={() => handleDownloadPdf(viewInvoice)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
