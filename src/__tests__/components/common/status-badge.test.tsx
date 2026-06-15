import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/common/status-badge'

describe('StatusBadge', () => {
  describe('status text formatting', () => {
    it('should capitalize first letter', () => {
      render(<StatusBadge status="active" />)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should replace underscores with spaces', () => {
      render(<StatusBadge status="past_due" />)
      expect(screen.getByText('Past due')).toBeInTheDocument()
    })

    it('should handle uppercase status', () => {
      render(<StatusBadge status="ACTIVE" />)
      expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    })
  })

  describe('status type mapping', () => {
    it('should apply success style for active status', () => {
      render(<StatusBadge status="active" />)
      const badge = screen.getByText('Active')
      expect(badge.className).toContain('bg-green')
    })

    it('should apply error style for suspended status', () => {
      render(<StatusBadge status="suspended" />)
      const badge = screen.getByText('Suspended')
      expect(badge.className).toContain('bg-red')
    })

    it('should apply warning style for pending status', () => {
      render(<StatusBadge status="pending" />)
      const badge = screen.getByText('Pending')
      expect(badge.className).toContain('bg-yellow')
    })

    it('should apply info style for trialing status', () => {
      render(<StatusBadge status="trialing" />)
      const badge = screen.getByText('Trialing')
      expect(badge.className).toContain('bg-blue')
    })

    it('should apply default style for unknown status', () => {
      render(<StatusBadge status="unknown" />)
      const badge = screen.getByText('Unknown')
      expect(badge.className).toContain('bg-gray')
    })
  })

  describe('type override', () => {
    it('should use provided type over mapped type', () => {
      render(<StatusBadge status="active" type="error" />)
      const badge = screen.getByText('Active')
      expect(badge.className).toContain('bg-red')
    })
  })

  describe('className prop', () => {
    it('should apply additional className', () => {
      render(<StatusBadge status="active" className="custom-class" />)
      const badge = screen.getByText('Active')
      expect(badge.className).toContain('custom-class')
    })
  })

  describe('all status types', () => {
    const statusTests = [
      { status: 'active', expectedColor: 'green' },
      { status: 'suspended', expectedColor: 'red' },
      { status: 'inactive', expectedColor: 'yellow' },
      { status: 'deleted', expectedColor: 'red' },
      { status: 'paid', expectedColor: 'green' },
      { status: 'failed', expectedColor: 'red' },
      { status: 'refunded', expectedColor: 'yellow' },
      { status: 'healthy', expectedColor: 'green' },
      { status: 'degraded', expectedColor: 'yellow' },
      { status: 'down', expectedColor: 'red' },
      { status: 'critical', expectedColor: 'red' },
      { status: 'acknowledged', expectedColor: 'yellow' },
      { status: 'resolved', expectedColor: 'green' },
      { status: 'available', expectedColor: 'green' },
      { status: 'expired', expectedColor: 'red' },
      { status: 'used', expectedColor: 'gray' },
    ]

    statusTests.forEach(({ status, expectedColor }) => {
      it(`should apply ${expectedColor} style for ${status} status`, () => {
        const { container } = render(<StatusBadge status={status} />)
        const badge = container.querySelector('[data-slot="badge"]')
        expect(badge?.className).toContain(`bg-${expectedColor}`)
      })
    })
  })

  describe('status normalization', () => {
    it('should normalize status with spaces', () => {
      render(<StatusBadge status="past due" />)
      const badge = screen.getByText('Past due')
      expect(badge.className).toContain('bg-yellow')
    })

    it('should handle mixed case status', () => {
      render(<StatusBadge status="Active" />)
      const badge = screen.getByText('Active')
      expect(badge.className).toContain('bg-green')
    })
  })
})
