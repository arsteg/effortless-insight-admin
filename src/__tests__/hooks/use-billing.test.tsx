import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  billingKeys,
  useBillingOverview,
  useSubscriptions,
  useInvoices,
  useOverridePlan,
  useProcessRefund,
} from '@/hooks/use-billing'

jest.mock('@/lib/api/admin', () => ({
  adminApi: {
    billing: {
      getOverview: jest.fn(),
      listSubscriptions: jest.fn(),
      listInvoices: jest.fn(),
      overridePlan: jest.fn(),
      processRefund: jest.fn(),
    },
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { adminApi } from '@/lib/api/admin'
import { toast } from 'sonner'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('billingKeys', () => {
  it('should generate correct query keys', () => {
    expect(billingKeys.all).toEqual(['billing'])
    expect(billingKeys.overview('30d')).toEqual(['billing', 'overview', '30d'])
    expect(billingKeys.subscriptions()).toEqual(['billing', 'subscriptions'])
    expect(billingKeys.subscriptionList()).toEqual(['billing', 'subscriptions', 'list', undefined])
    expect(billingKeys.subscriptionDetail('123')).toEqual(['billing', 'subscriptions', 'detail', '123'])
    expect(billingKeys.invoices()).toEqual(['billing', 'invoices'])
    expect(billingKeys.invoiceList()).toEqual(['billing', 'invoices', 'list', undefined])
  })
})

describe('useBillingOverview', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch billing overview', async () => {
    const mockOverview = {
      mrr: 50000,
      arr: 600000,
      activeSubscriptions: 100,
    };
    (adminApi.billing.getOverview as jest.Mock).mockResolvedValue(mockOverview)

    const { result } = renderHook(() => useBillingOverview('30d'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockOverview)
  })
})

describe('useSubscriptions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch subscriptions', async () => {
    const mockData = { items: [{ id: '1' }], totalCount: 1 };
    (adminApi.billing.listSubscriptions as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useSubscriptions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })
})

describe('useInvoices', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should fetch invoices', async () => {
    const mockData = { items: [{ id: '1' }], totalCount: 1 };
    (adminApi.billing.listInvoices as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })
})

describe('useOverridePlan', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should override plan', async () => {
    (adminApi.billing.overridePlan as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useOverridePlan(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      subscriptionId: '1',
      planCode: 'professional',
      reason: 'Customer request',
      prorate: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Plan override applied successfully')
  })

  it('should handle error', async () => {
    (adminApi.billing.overridePlan as jest.Mock).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useOverridePlan(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      subscriptionId: '1',
      planCode: 'pro',
      reason: 'Test',
      prorate: true,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.billing.overridePlan as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useOverridePlan(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      subscriptionId: '1',
      planCode: 'pro',
      reason: 'Test',
      prorate: true,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to override plan')
  })
})

describe('useProcessRefund', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should process refund', async () => {
    (adminApi.billing.processRefund as jest.Mock).mockResolvedValue(undefined)

    const { result } = renderHook(() => useProcessRefund(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      paymentId: '1',
      amount: 100,
      reason: 'Customer request',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Refund processed successfully')
  })

  it('should handle error', async () => {
    (adminApi.billing.processRefund as jest.Mock).mockRejectedValue(new Error('Refund failed'))

    const { result } = renderHook(() => useProcessRefund(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      paymentId: '1',
      amount: 100,
      reason: 'Test',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Refund failed')
  })

  it('should use default error message', async () => {
    const error = new Error();
    (adminApi.billing.processRefund as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useProcessRefund(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      paymentId: '1',
      amount: 100,
      reason: 'Test',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Failed to process refund')
  })
})
