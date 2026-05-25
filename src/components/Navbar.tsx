'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Bell, User, Settings, Trophy, MessageCircle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/ui/Logo'

const NAV = [
  { href: '/dashboard',    icon: Home,           label: 'Home'       },
  { href: '/search',       icon: Search,         label: 'Search'     },
  { href: '/leaderboard',  icon: Trophy,         label: 'Spotlight'  },
  { href: '/feed',         icon: Bell,           label: 'Feed'       },
  { href: '/chat',         icon: MessageCircle,  label: 'Chat'       },
  { href: '/profile/me',   icon: User,           label: 'Profile'    },
  { href: '/settings',     icon: Settings,       label: 'Settings'   },
]

// Mobile nav: Home, Search, [FAB], Feed, Profile
const MOBILE_LEFT  = [NAV[0], NAV[1]]
const MOBILE_RIGHT = [NAV[3], NAV[5]]

export default function Navbar() {
  const path = usePathname()

  function isActive(href: string) {
    if (href === '/profile/me') return path.startsWith('/profile')
    return path.startsWith(href)
  }

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-6 bg-bg/80 backdrop-blur-md border-b border-border">
        <Link href="/dashboard" className="mr-8">
          <Logo wordmark size={28} textSize="text-xl" showSlogan />
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
                  : 'text-muted hover:text-foreground hover:bg-surface',
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop primary CTA */}
        <Link
          href="/search"
          className="ml-4 flex items-center gap-2 px-5 py-2 bg-primary text-[#1a0f40] font-black rounded-xl text-sm shadow-glow-sm hover:shadow-glow-md hover:bg-primary/90 transition-all"
        >
          <Star size={14} fill="currentColor" />
          Reflect
        </Link>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-bg/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Left side: Home, Search */}
        {MOBILE_LEFT.map(({ href, icon: Icon, label }) => {
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

        {/* Center FAB — Rate someone */}
        <div className="flex items-center justify-center px-2">
          <Link
            href="/search"
            className="relative -top-4 flex flex-col items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-glow-md hover:bg-primary/90 transition-all active:scale-95"
            title="Reflect on someone"
          >
            <Star size={24} fill="#1a0f40" color="#1a0f40" strokeWidth={2} />
            <span className="text-[9px] font-black text-[#1a0f40] mt-0.5 leading-none">Reflect</span>
          </Link>
        </div>

        {/* Right side: Feed, Profile */}
        {MOBILE_RIGHT.map(({ href, icon: Icon, label }) => {
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
