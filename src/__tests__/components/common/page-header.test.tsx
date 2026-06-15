import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/common/page-header'

describe('PageHeader', () => {
  describe('basic rendering', () => {
    it('should render title', () => {
      render(<PageHeader title="Dashboard" />)
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    })

    it('should render title as h1', () => {
      render(<PageHeader title="Dashboard" />)
      const heading = screen.getByRole('heading', { name: 'Dashboard' })
      expect(heading.tagName).toBe('H1')
    })
  })

  describe('description', () => {
    it('should render description when provided', () => {
      render(<PageHeader title="Dashboard" description="Overview of system metrics" />)
      expect(screen.getByText('Overview of system metrics')).toBeInTheDocument()
    })

    it('should not render description paragraph when not provided', () => {
      render(<PageHeader title="Dashboard" />)
      expect(screen.queryByText('Overview of system metrics')).not.toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('should render actions when provided', () => {
      render(
        <PageHeader
          title="Dashboard"
          actions={<button>Add New</button>}
        />
      )
      expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument()
    })

    it('should render multiple actions', () => {
      render(
        <PageHeader
          title="Dashboard"
          actions={
            <>
              <button>Action 1</button>
              <button>Action 2</button>
            </>
          }
        />
      )
      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument()
    })

    it('should not render actions container when not provided', () => {
      const { container } = render(<PageHeader title="Dashboard" />)
      expect(container.querySelector('.flex.items-center.gap-2')).not.toBeInTheDocument()
    })
  })

  describe('combined props', () => {
    it('should render all props together', () => {
      render(
        <PageHeader
          title="Users"
          description="Manage platform users"
          actions={<button>Add User</button>}
        />
      )
      expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
      expect(screen.getByText('Manage platform users')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have proper heading styles', () => {
      render(<PageHeader title="Dashboard" />)
      const heading = screen.getByRole('heading')
      expect(heading.className).toContain('text-2xl')
      expect(heading.className).toContain('font-semibold')
    })
  })
})
