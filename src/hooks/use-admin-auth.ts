'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { adminApi } from '@/lib/api/admin'
import type { AdminMfaSetupResponse } from '@/types/admin'

export function useAdminAuth() {
  const store = useAdminAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      store.login(email, password),
    onSuccess: (result) => {
      if (!result.requiresMfa) {
        toast.success('Login successful')
        router.push('/dashboard')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed')
    },
  })

  const verifyMfaMutation = useMutation({
    mutationFn: (code: string) => store.verifyMfa(code),
    onSuccess: () => {
      toast.success('MFA verified successfully')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'MFA verification failed')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => store.logout(),
    onSuccess: () => {
      queryClient.clear()
      router.push('/login')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      adminApi.auth.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password')
    },
  })

  return {
    ...store,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    verifyMfa: verifyMfaMutation.mutate,
    verifyMfaAsync: verifyMfaMutation.mutateAsync,
    isVerifyingMfa: verifyMfaMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
  }
}

export function useMfaSetup() {
  const setupMutation = useMutation({
    mutationFn: () => adminApi.auth.setupMfa(),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to setup MFA')
    },
  })

  const confirmMutation = useMutation({
    mutationFn: (code: string) => adminApi.auth.confirmMfa(code),
    onSuccess: () => {
      toast.success('MFA enabled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm MFA')
    },
  })

  const disableMutation = useMutation({
    mutationFn: ({ password, code }: { password: string; code: string }) =>
      adminApi.auth.disableMfa(password, code),
    onSuccess: () => {
      toast.success('MFA disabled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disable MFA')
    },
  })

  return {
    setup: setupMutation.mutate,
    setupAsync: setupMutation.mutateAsync,
    isSettingUp: setupMutation.isPending,
    setupData: setupMutation.data as AdminMfaSetupResponse | undefined,
    confirm: confirmMutation.mutate,
    confirmAsync: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    backupCodes: confirmMutation.data?.backupCodes,
    disable: disableMutation.mutate,
    isDisabling: disableMutation.isPending,
  }
}
