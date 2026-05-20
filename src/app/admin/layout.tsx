import { requireAdmin } from '@/lib/admin-auth'
import Link from 'next/link'
import { LayoutDashboard, Users, Star, Settings2, ShieldCheck, LogOut } from 'lucide-react'

const NAV = [
  { href: '/admin',          icon: LayoutDashboard, label: 'Overview'  },
  { href: '/admin/users',    icon: Users,            label: 'Users'     },
  { href: '/admin/ratings',  icon: Star,             label: 'Ratings'   },
  { href: '/admin/metrics',  icon: Settings2,        label: 'Metrics'   },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-800 bg-gray-900">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-gray-900" />
            </div>
            <div>
              <p className="font-black text-sm text-white leading-tight">Lens Admin</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[110px]">{email}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut size={16} />
            Back to app
          </Link>
        </div>
      </aside>

      {/* ── Mobile top nav ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={14} className="text-gray-900" />
          </div>
          <span className="font-black text-sm text-white flex-1">Lens Admin</span>
        </div>
        <div className="flex overflow-x-auto border-t border-gray-800 px-2 pb-1 gap-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 md:p-8 p-4 pt-24 md:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
