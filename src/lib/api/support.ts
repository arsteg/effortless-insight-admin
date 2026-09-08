import { adminClient, extractData } from './client'

// ============================================================================
// In-app support tickets (admin side) — customers raise tickets in the web
// app; admins track and answer them here. Replies are shown to customers as
// a shared "EffortlessInsight Support" identity.
// ============================================================================

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface AdminSupportTicketListItem {
  id: string
  organizationId: string
  organizationName: string
  createdByName: string
  createdByEmail: string
  subject: string
  category: string
  status: SupportTicketStatus
  createdAt: string
  lastMessageAt: string
  messageCount: number
}

export interface SupportTicketMessage {
  id: string
  isFromSupport: boolean
  senderName: string
  body: string
  createdAt: string
}

export interface SupportTicketDetail {
  id: string
  subject: string
  category: string
  status: SupportTicketStatus
  createdAt: string
  lastMessageAt: string
  messages: SupportTicketMessage[]
}

export const adminSupportApi = {
  list: async (params?: {
    status?: SupportTicketStatus
    page?: number
    pageSize?: number
  }): Promise<AdminSupportTicketListItem[]> => {
    const response = await adminClient.get('/admin/support-tickets', { params })
    return extractData(response)
  },

  get: async (ticketId: string): Promise<SupportTicketDetail> => {
    const response = await adminClient.get(`/admin/support-tickets/${ticketId}`)
    return extractData(response)
  },

  reply: async (ticketId: string, message: string): Promise<SupportTicketMessage> => {
    const response = await adminClient.post(`/admin/support-tickets/${ticketId}/reply`, {
      message,
    })
    return extractData(response)
  },

  setStatus: async (ticketId: string, status: SupportTicketStatus): Promise<void> => {
    await adminClient.post(`/admin/support-tickets/${ticketId}/status`, { status })
  },
}
