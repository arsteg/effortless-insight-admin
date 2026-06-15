'use client'

import type { ReactNode } from 'react'
import { AdminLayout } from '@/components/layout'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
