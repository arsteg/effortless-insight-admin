import { render, screen } from '@testing-library/react'
import { LoadingState, FullPageLoading } from '@/components/common/loading-state'

describe('LoadingState', () => {
  describe('basic rendering', () => {
    it('should render with default message', () => {
      render(<LoadingState />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render with custom message', () => {
      render(<LoadingState message="Please wait..." />)
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
    })

    it('should not render message when empty string', () => {
      render(<LoadingState message="" />)
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('size variations', () => {
    it('should render with small size', () => {
      const { container } = render(<LoadingState size="sm" />)
      const loader = container.querySelector('svg')
      expect(loader).toBeInTheDocument()
      expect(loader?.classList.contains('h-4')).toBe(true)
    })

    it('should render with medium size (default)', () => {
      const { container } = render(<LoadingState />)
      const loader = container.querySelector('svg')
      expect(loader).toBeInTheDocument()
      expect(loader?.classList.contains('h-8')).toBe(true)
    })

    it('should render with large size', () => {
      const { container } = render(<LoadingState size="lg" />)
      const loader = container.querySelector('svg')
      expect(loader).toBeInTheDocument()
      expect(loader?.classList.contains('h-12')).toBe(true)
    })
  })

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(<LoadingState className="custom-class" />)
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('spinner animation', () => {
    it('should have animate-spin class', () => {
      const { container } = render(<LoadingState />)
      const loader = container.querySelector('svg')
      expect(loader).toBeInTheDocument()
      expect(loader?.classList.contains('animate-spin')).toBe(true)
    })
  })
})

describe('FullPageLoading', () => {
  it('should render full page loading state', () => {
    const { container } = render(<FullPageLoading />)
    expect(container.firstChild).toHaveClass('min-h-screen')
  })

  it('should render with custom message', () => {
    render(<FullPageLoading message="Loading dashboard..." />)
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })

  it('should use large size for loader', () => {
    const { container } = render(<FullPageLoading />)
    const loader = container.querySelector('svg')
    expect(loader).toBeInTheDocument()
    expect(loader?.classList.contains('h-12')).toBe(true)
  })
})
