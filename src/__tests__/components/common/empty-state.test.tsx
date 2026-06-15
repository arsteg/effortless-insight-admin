import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/common/empty-state'

describe('EmptyState', () => {
  describe('basic rendering', () => {
    it('should render title', () => {
      render(<EmptyState title="No items found" />)
      expect(screen.getByText('No items found')).toBeInTheDocument()
    })

    it('should render title as h3', () => {
      render(<EmptyState title="No items found" />)
      const heading = screen.getByRole('heading', { name: 'No items found' })
      expect(heading.tagName).toBe('H3')
    })
  })

  describe('description', () => {
    it('should render description when provided', () => {
      render(<EmptyState title="No items" description="Try adjusting your filters" />)
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
    })

    it('should not render description paragraph when not provided', () => {
      render(<EmptyState title="No items" />)
      expect(screen.queryByText('Try adjusting your filters')).not.toBeInTheDocument()
    })
  })

  describe('icon', () => {
    it('should render icon when provided', () => {
      render(
        <EmptyState
          title="No items"
          icon={<span data-testid="test-icon">Icon</span>}
        />
      )
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('should wrap icon in styled container', () => {
      const { container } = render(
        <EmptyState
          title="No items"
          icon={<span data-testid="test-icon">Icon</span>}
        />
      )
      const iconContainer = container.querySelector('.rounded-full')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should not render icon container when not provided', () => {
      const { container } = render(<EmptyState title="No items" />)
      expect(container.querySelector('.rounded-full')).not.toBeInTheDocument()
    })
  })

  describe('action', () => {
    it('should render action when provided', () => {
      render(
        <EmptyState
          title="No items"
          action={<button>Add Item</button>}
        />
      )
      expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument()
    })

    it('should not render action container when not provided', () => {
      const { container } = render(<EmptyState title="No items" />)
      // Action div has mt-4 class
      const actionContainer = container.querySelector('.mt-4')
      expect(actionContainer).not.toBeInTheDocument()
    })
  })

  describe('className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <EmptyState title="No items" className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('combined props', () => {
    it('should render all props together', () => {
      render(
        <EmptyState
          title="No users found"
          description="There are no users matching your criteria"
          icon={<span data-testid="icon">👤</span>}
          action={<button>Add User</button>}
          className="my-empty-state"
        />
      )

      expect(screen.getByText('No users found')).toBeInTheDocument()
      expect(screen.getByText('There are no users matching your criteria')).toBeInTheDocument()
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument()
    })
  })
})
