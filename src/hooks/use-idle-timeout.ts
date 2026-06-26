'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { adminTokens } from '@/lib/api/client'
import { useAdminAuthStore } from '@/stores/admin-auth-store'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000 // 2 minutes before timeout
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove']
const THROTTLE_MS = 30000 // Only update activity timestamp every 30 seconds

export interface UseIdleTimeoutOptions {
  onTimeout?: () => void
  onWarning?: (remainingMs: number) => void
  enabled?: boolean
}

export function useIdleTimeout(options: UseIdleTimeoutOptions = {}) {
  const { onTimeout, onWarning, enabled = true } = options
  const router = useRouter()
  const { clearAuth } = useAdminAuthStore()

  const lastActivityRef = useRef<number>(Date.now())
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const warningIdRef = useRef<NodeJS.Timeout | null>(null)
  const throttleRef = useRef<number>(0)

  const handleLogout = useCallback(() => {
    adminTokens.clearTokens()
    clearAuth()
    if (onTimeout) {
      onTimeout()
    }
    router.push('/login?reason=idle_timeout')
  }, [router, clearAuth, onTimeout])

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    if (warningIdRef.current) {
      clearTimeout(warningIdRef.current)
    }

    // Set warning timer
    warningIdRef.current = setTimeout(() => {
      if (onWarning) {
        onWarning(WARNING_BEFORE_MS)
      }
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS)

    // Set logout timer
    timeoutIdRef.current = setTimeout(() => {
      handleLogout()
    }, IDLE_TIMEOUT_MS)
  }, [handleLogout, onWarning])

  const handleActivity = useCallback(() => {
    const now = Date.now()

    // Throttle activity updates
    if (now - throttleRef.current < THROTTLE_MS) {
      return
    }

    throttleRef.current = now
    lastActivityRef.current = now
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Check if user has a token
    const token = adminTokens.getAccessToken()
    if (!token) {
      return
    }

    // Initial timer setup
    resetTimers()

    // Add activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we've been idle too long while tab was hidden
        const idleTime = Date.now() - lastActivityRef.current
        if (idleTime >= IDLE_TIMEOUT_MS) {
          handleLogout()
        } else {
          resetTimers()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      if (warningIdRef.current) {
        clearTimeout(warningIdRef.current)
      }
    }
  }, [enabled, handleActivity, handleLogout, resetTimers])

  return {
    resetTimers,
    lastActivity: lastActivityRef.current,
  }
}
