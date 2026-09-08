import { adminClient, extractData } from './client'

// ============================================================================
// Incomplete signups — people who verified their mobile via OTP but never
// finished registration. The API removes rows automatically when the signup
// completes, so this list is the follow-up call sheet.
// ============================================================================

export interface SignupAttempt {
  id: string
  mobile: string
  name: string | null
  email: string | null
  source: 'web' | 'mobile' | string
  mobileVerifiedAt: string
  contactedAt: string | null
  contactNotes: string | null
  createdAt: string
}

export interface SignupAttemptListResponse {
  items: SignupAttempt[]
  total: number
  page: number
  pageSize: number
}

export const adminSignupsApi = {
  list: async (params?: {
    contacted?: boolean
    search?: string
    page?: number
    pageSize?: number
  }): Promise<SignupAttemptListResponse> => {
    const response = await adminClient.get('/admin/signup-attempts', { params })
    return extractData(response)
  },

  setContacted: async (
    id: string,
    contacted: boolean,
    notes?: string
  ): Promise<SignupAttempt> => {
    const response = await adminClient.post(`/admin/signup-attempts/${id}/contact`, {
      contacted,
      notes,
    })
    return extractData(response)
  },

  remove: async (id: string): Promise<void> => {
    await adminClient.delete(`/admin/signup-attempts/${id}`)
  },
}
