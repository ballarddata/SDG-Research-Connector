import { Link, NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { user, loading } = useAuth()
  const location = useLocation()

  const navItems = [
    { to: '/search', label: 'Search' },
    { to: '/recommendations', label: 'Recommendations' },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          SRC
        </Link>

        {!loading && user ? (
          <div className="flex flex-1 items-center justify-end gap-6">
            <nav className="hidden items-center gap-4 text-sm text-slate-300 sm:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition ${
                      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.email}</p>
              <p className="text-xs text-slate-400">Authenticated</p>
            </div>

            <button
              onClick={handleSignOut}
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex-1 text-right text-sm text-slate-400">
            {location.pathname === '/' ? 'Public view' : 'Checking auth…'}
          </div>
        )}
      </div>
    </header>
  )
}
