import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/common/stat-card'

describe('StatCard', () => {
  describe('basic rendering', () => {
    it('should render title and value', () => {
      render(<StatCard title="Total Users" value={100} />)
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should render string value', () => {
      render(<StatCard title="Revenue" value="$10,000" />)
      expect(screen.getByText('$10,000')).toBeInTheDocument()
    })

    it('should render description', () => {
      render(<StatCard title="Users" value={100} description="Active this month" />)
      expect(screen.getByText('Active this month')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      const { container } = render(<StatCard title="Users" value={100} isLoading={true} />)
      // Skeleton component uses data-slot="skeleton"
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show value when loading', () => {
      render(<StatCard title="Users" value={100} isLoading={true} />)
      expect(screen.queryByText('100')).not.toBeInTheDocument()
    })
  })

  describe('trend indicator', () => {
    it('should show positive trend with up arrow', () => {
      render(<StatCard title="Users" value={100} trend={10} />)
      expect(screen.getByText('10%')).toBeInTheDocument()
    })

    it('should show negative trend with down arrow', () => {
      render(<StatCard title="Users" value={100} trend={-5} />)
      expect(screen.getByText('5%')).toBeInTheDocument()
    })

    it('should show zero trend as positive', () => {
      render(<StatCard title="Users" value={100} trend={0} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
      const trendElement = screen.getByText('0%')
      expect(trendElement.className).toContain('text-green')
    })

    it('should apply green color for positive trend', () => {
      render(<StatCard title="Users" value={100} trend={10} />)
      const trendElement = screen.getByText('10%')
      expect(trendElement.className).toContain('text-green')
    })

    it('should apply red color for negative trend', () => {
      render(<StatCard title="Users" value={100} trend={-5} />)
      const trendElement = screen.getByText('5%')
      expect(trendElement.className).toContain('text-red')
    })
  })

  describe('trendLabel', () => {
    it('should show trend label', () => {
      render(<StatCard title="Users" value={100} trend={10} trendLabel="vs last month" />)
      expect(screen.getByText('vs last month')).toBeInTheDocument()
    })

    it('should prioritize description over trendLabel', () => {
      render(
        <StatCard
          title="Users"
          value={100}
          description="Main description"
          trendLabel="Trend label"
        />
      )
      expect(screen.getByText('Main description')).toBeInTheDocument()
    })
  })

  describe('icon', () => {
    it('should render icon when provided', () => {
      render(
        <StatCard
          title="Users"
          value={100}
          icon={<span data-testid="test-icon">Icon</span>}
        />
      )
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('should not render icon container when not provided', () => {
      render(<StatCard title="Users" value={100} />)
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
    })
  })

  describe('className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <StatCard title="Users" value={100} className="custom-card" />
      )
      expect(container.firstChild).toHaveClass('custom-card')
    })
  })

  describe('edge cases', () => {
    it('should handle zero value', () => {
      render(<StatCard title="Users" value={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle large numbers', () => {
      render(<StatCard title="Users" value={1000000} />)
      expect(screen.getByText('1000000')).toBeInTheDocument()
    })

    it('should handle undefined trend', () => {
      render(<StatCard title="Users" value={100} trend={undefined} />)
      expect(screen.queryByText('%')).not.toBeInTheDocument()
    })
  })
})
