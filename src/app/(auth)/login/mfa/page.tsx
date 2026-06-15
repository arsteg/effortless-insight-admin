'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { useAdminAuthStore } from '@/stores/admin-auth-store'

export default function MfaPage() {
  const router = useRouter()
  const { verifyMfaAsync, isVerifyingMfa, error, clearError } = useAdminAuth()
  const { mfaSessionToken } = useAdminAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Redirect to login if no MFA session
    if (!mfaSessionToken) {
      router.push('/login')
    }
  }, [mfaSessionToken, router])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (newCode.every((digit) => digit) && newCode.join('').length === 6) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      handleSubmit(pastedData)
    }
  }

  const handleSubmit = async (codeString?: string) => {
    const fullCode = codeString || code.join('')
    if (fullCode.length !== 6) return

    clearError()
    try {
      await verifyMfaAsync(fullCode)
    } catch {
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (!mfaSessionToken) {
    return null
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 lg:hidden mb-4">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Admin Portal</span>
        </div>
        <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifyingMfa}
                className="w-12 h-12 text-center text-xl font-semibold"
              />
            ))}
          </div>

          <Button
            onClick={() => handleSubmit()}
            className="w-full"
            disabled={isVerifyingMfa || code.some((d) => !d)}
          >
            {isVerifyingMfa && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleBackToLogin}
            disabled={isVerifyingMfa}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
