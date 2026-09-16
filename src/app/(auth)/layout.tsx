import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-azure-600 via-azure-700 to-[#0c2f4d] p-12 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        {/* soft depth orbs */}
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-lavender-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-mint-400/15 blur-3xl" />
        <div className="relative max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary-foreground"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground">
              Admin Portal
            </h1>
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            EffortlessInsight
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Secure administrative access to manage users, organizations, billing, and platform operations.
          </p>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
