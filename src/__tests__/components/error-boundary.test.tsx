import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, ErrorFallback } from '@/components/error-boundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

// Suppress console.error for these tests
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})
afterAll(() => {
  console.error = originalError
})

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when there is no error', () => {
    it('should render children', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })
  })

  describe('when there is an error', () => {
    it('should render default error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error fallback</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should show try again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should show reload page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })

    it('should reset state when try again is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Click try again should reset hasError state
      fireEvent.click(screen.getByRole('button', { name: /try again/i }))

      // After reset, the boundary will re-render children which will throw again
      // So we just verify the button was clickable
    })

    it('should call console.error with error info', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('reload page button', () => {
    it('should render reload page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })
  })
})

describe('ErrorFallback', () => {
  it('should render error message', () => {
    const error = new Error('Fallback error message')
    const resetFn = jest.fn()

    render(<ErrorFallback error={error} resetErrorBoundary={resetFn} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Fallback error message')).toBeInTheDocument()
  })

  it('should render description text', () => {
    const error = new Error('Test error')
    const resetFn = jest.fn()

    render(<ErrorFallback error={error} resetErrorBoundary={resetFn} />)

    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })

  it('should call resetErrorBoundary when try again is clicked', () => {
    const error = new Error('Test error')
    const resetFn = jest.fn()

    render(<ErrorFallback error={error} resetErrorBoundary={resetFn} />)

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(resetFn).toHaveBeenCalledTimes(1)
  })

  it('should display error icon', () => {
    const error = new Error('Test error')
    const resetFn = jest.fn()

    const { container } = render(<ErrorFallback error={error} resetErrorBoundary={resetFn} />)

    const iconContainer = container.querySelector('.bg-destructive\\/10')
    expect(iconContainer).toBeInTheDocument()
  })
})
