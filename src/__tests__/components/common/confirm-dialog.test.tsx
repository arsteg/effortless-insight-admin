import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/common/confirm-dialog'

// Mock the AlertDialog components
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="alert-dialog" data-open={open}>
      {children}
      <button data-testid="mock-close" onClick={() => onOpenChange(false)}>Close</button>
    </div>
  ),
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-trigger" onClick={() => {
      // Simulate opening dialog by clicking trigger
      const event = new CustomEvent('open-dialog')
      document.dispatchEvent(event)
    }}>{children}</div>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-header">{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="alert-dialog-title">{children}</h2>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="alert-dialog-description">{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-dialog-footer">{children}</div>
  ),
  AlertDialogCancel: ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => (
    <button data-testid="alert-dialog-cancel" disabled={disabled}>{children}</button>
  ),
  AlertDialogAction: ({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
    <button data-testid="alert-dialog-action" onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
}))

describe('ConfirmDialog', () => {
  it('should render the trigger', () => {
    const onConfirm = jest.fn()
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Confirm Delete"
        description="Are you sure you want to delete?"
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('should render dialog content', () => {
    const onConfirm = jest.fn()
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Confirm Delete"
        description="Are you sure you want to delete?"
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Confirm Delete')
    expect(screen.getByTestId('alert-dialog-description')).toHaveTextContent('Are you sure you want to delete?')
  })

  it('should use default labels when not provided', () => {
    const onConfirm = jest.fn()
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Confirm"
        description="Are you sure?"
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByTestId('alert-dialog-cancel')).toHaveTextContent('Cancel')
    expect(screen.getByTestId('alert-dialog-action')).toHaveTextContent('Confirm')
  })

  it('should use custom labels when provided', () => {
    const onConfirm = jest.fn()
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Confirm"
        description="Are you sure?"
        confirmLabel="Yes, delete"
        cancelLabel="No, keep it"
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByTestId('alert-dialog-cancel')).toHaveTextContent('No, keep it')
    expect(screen.getByTestId('alert-dialog-action')).toHaveTextContent('Yes, delete')
  })

  it('should call onConfirm when action button is clicked', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined)
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Confirm"
        description="Are you sure?"
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByTestId('alert-dialog-action'))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled()
    })
  })

  it('should handle async onConfirm', async () => {
    const onConfirm = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Confirm"
        description="Are you sure?"
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByTestId('alert-dialog-action'))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled()
    })
  })

  it('should apply destructive class when destructive is true', () => {
    const onConfirm = jest.fn()
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Confirm"
        description="Are you sure?"
        onConfirm={onConfirm}
        destructive={true}
      />
    )

    const actionButton = screen.getByTestId('alert-dialog-action')
    expect(actionButton).toHaveClass('bg-destructive/10')
  })

  it('should not apply destructive class when destructive is false', () => {
    const onConfirm = jest.fn()
    render(
      <ConfirmDialog
        trigger={<button>Delete</button>}
        title="Confirm"
        description="Are you sure?"
        onConfirm={onConfirm}
        destructive={false}
      />
    )

    const actionButton = screen.getByTestId('alert-dialog-action')
    expect(actionButton).not.toHaveClass('bg-destructive/10')
  })
})
