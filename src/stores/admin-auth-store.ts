'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AdminUser, AdminPermission } from '@/types/admin'
import { adminApi } from '@/lib/api/admin'
import { adminTokens } from '@/lib/api/client'

interface AdminAuthState {
  adminUser: AdminUser | null
  isAuthenticated: boolean
  isMfaVerified: boolean
  isLoading: boolean
  mfaSessionToken: string | null
  error: string | null
  login: (email: string, password: string) => Promise<{ requiresMfa: boolean }>
  verifyMfa: (code: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  clearAuth: () => void
  clearError: () => void
  hasPermission: (permission: AdminPermission | string) => boolean
  hasAnyPermission: (permissions: (AdminPermission | string)[]) => boolean
  isRole: (role: string) => boolean
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      adminUser: null,
      isAuthenticated: false,
      isMfaVerified: false,
      isLoading: false,
      mfaSessionToken: null,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await adminApi.auth.login({ email, password })
          if ('mfaRequired' in response && response.mfaRequired) {
            set({ isLoading: false, mfaSessionToken: response.sessionToken })
            return { requiresMfa: true }
          }
          const loginResponse = response as { accessToken: string; refreshToken: string; user: AdminUser }
          adminTokens.setTokens(loginResponse.accessToken, loginResponse.refreshToken)
          set({ adminUser: loginResponse.user, isAuthenticated: true, isMfaVerified: true, isLoading: false, mfaSessionToken: null })
          return { requiresMfa: false }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed'
          set({ isLoading: false, error: message })
          throw error
        }
      },

      verifyMfa: async (code: string) => {
        const { mfaSessionToken } = get()
        if (!mfaSessionToken) throw new Error('No MFA session token')
        set({ isLoading: true, error: null })
        try {
          const response = await adminApi.auth.verifyMfa({ sessionToken: mfaSessionToken, code })
          adminTokens.setTokens(response.accessToken, response.refreshToken)
          set({ adminUser: response.user, isAuthenticated: true, isMfaVerified: true, isLoading: false, mfaSessionToken: null })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'MFA verification failed'
          set({ isLoading: false, error: message })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try { await adminApi.auth.logout() } catch { /* ignore */ } finally {
          adminTokens.clearTokens()
          set({ adminUser: null, isAuthenticated: false, isMfaVerified: false, isLoading: false, mfaSessionToken: null, error: null })
        }
      },

      loadUser: async () => {
        const token = adminTokens.getAccessToken()
        if (!token) { set({ isAuthenticated: false, adminUser: null }); return }
        set({ isLoading: true })
        try {
          const user = await adminApi.auth.me()
          set({ adminUser: user, isAuthenticated: true, isMfaVerified: true, isLoading: false })
        } catch {
          adminTokens.clearTokens()
          set({ adminUser: null, isAuthenticated: false, isMfaVerified: false, isLoading: false })
        }
      },

      clearAuth: () => set({ adminUser: null, isAuthenticated: false, isMfaVerified: false, mfaSessionToken: null, error: null }),

      clearError: () => set({ error: null }),

      hasPermission: (permission: AdminPermission | string) => {
        const { adminUser } = get()
        if (!adminUser) return false
        if (adminUser.role === 'super_admin') return true
        return adminUser.permissions.includes(permission)
      },

      hasAnyPermission: (permissions: (AdminPermission | string)[]) => {
        return permissions.some((p) => get().hasPermission(p))
      },

      isRole: (role: string) => get().adminUser?.role === role,
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ adminUser: state.adminUser, isAuthenticated: state.isAuthenticated, isMfaVerified: state.isMfaVerified }),
    }
  )
)

export default useAdminAuthStore
