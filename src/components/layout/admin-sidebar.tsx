'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { ADMIN_PERMISSIONS } from '@/types/admin'
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Brain,
  FileText,
  ScrollText,
  Activity,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Package,
  LifeBuoy,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useState } from 'react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: ADMIN_PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    permission: ADMIN_PERMISSIONS.USERS_VIEW,
  },
  {
    title: 'Organizations',
    href: '/organizations',
    icon: Building2,
    permission: ADMIN_PERMISSIONS.ORGS_VIEW,
  },
  {
    title: 'Billing',
    href: '/billing',
    icon: CreditCard,
    permission: ADMIN_PERMISSIONS.BILLING_VIEW,
  },
  {
    title: 'Plans',
    href: '/plans',
    icon: Package,
    permission: ADMIN_PERMISSIONS.PLANS_MANAGE,
  },
  {
    title: 'AI Operations',
    href: '/ai-operations',
    icon: Brain,
    permission: ADMIN_PERMISSIONS.AI_OPS_VIEW,
  },
  {
    title: 'Content',
    href: '/content',
    icon: FileText,
    permission: ADMIN_PERMISSIONS.CONTENT_VIEW,
  },
  {
    title: 'Support',
    href: '/support',
    icon: LifeBuoy,
  },
  {
    title: 'Incomplete Signups',
    href: '/signups',
    icon: UserPlus,
  },
  {
    title: 'Activity',
    href: '/activity',
    icon: Activity,
  },
]

const secondaryNavItems: NavItem[] = [
  {
    title: 'Audit Logs',
    href: '/audit',
    icon: ScrollText,
    permission: ADMIN_PERMISSIONS.AUDIT_VIEW,
  },
  {
    title: 'System Health',
    href: '/health',
    icon: Activity,
    permission: ADMIN_PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    title: 'Admin Users',
    href: '/admins',
    icon: Shield,
    permission: ADMIN_PERMISSIONS.ADMIN_MANAGE,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: ADMIN_PERMISSIONS.SETTINGS_VIEW,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { hasPermission } = useAdminAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredMainNav = mainNavItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )
  const filteredSecondaryNav = secondaryNavItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex flex-col border-r bg-sidebar transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-azure-400" />
              <span className="font-semibold text-lg tracking-tight text-white">Admin Portal</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard" className="mx-auto">
              <Shield className="h-6 w-6 text-azure-400" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 text-sidebar-foreground/70 hover:bg-white/10 hover:text-white', isCollapsed && 'mx-auto')}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-1">
            {filteredMainNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl mx-auto',
                          isActive
                            ? 'bg-azure-500/15 text-white ring-1 ring-inset ring-azure-400/25 [&_svg]:text-azure-300'
                            : 'text-sidebar-foreground/80 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-azure-500/15 text-white ring-1 ring-inset ring-azure-400/25 [&_svg]:text-azure-300'
                      : 'text-sidebar-foreground/80 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          <Separator className="my-4 bg-white/10" />

          <nav className="space-y-1">
            {filteredSecondaryNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl mx-auto',
                          isActive
                            ? 'bg-azure-500/15 text-white ring-1 ring-inset ring-azure-400/25 [&_svg]:text-azure-300'
                            : 'text-sidebar-foreground/80 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-azure-500/15 text-white ring-1 ring-inset ring-azure-400/25 [&_svg]:text-azure-300'
                      : 'text-sidebar-foreground/80 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  )
}
