'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Bell, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',   icon: Home,     label: 'Home'    },
  { href: '/search',      icon: Search,   label: 'Search'  },
  { href: '/feed',        icon: Bell,     label: 'Feed'    },
  { href: '/profile/me',  icon: User,     label: 'Profile' },
  { href: '/settings',    icon: Settings, label: 'Settings'},
]

// Bottom mobile nav shows only the first 4; Settings lives in the desktop top bar
const MOBILE_NAV = NAV.slice(0, 4)

export default function Navbar() {
  const path = usePathname()

  function isActive(href: string) {
    if (href === '/profile/me') return path.startsWith('/profile')
    return path.startsWith(href)
  }

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-6 bg-bg/80 backdrop-blur-md border-b border-border">
        <Link href="/dashboard" className="font-black text-xl tracking-tight text-primary mr-8">
          nosedive
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted hover:text-white hover:bg-surface',
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-bg/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted',
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px]">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
