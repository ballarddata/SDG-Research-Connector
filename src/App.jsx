import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabaseClient.js'

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [loading, setLoading] = useState(false)

  const highlights = useMemo(
    () => [
      { title: 'Semantic search', description: 'Find relevant research mapped to the UN SDGs using embeddings.' },
      { title: 'Author matching', description: 'Surface top cross-campus collaborators based on shared goals.' },
      { title: 'BYU SSO ready', description: 'Supabase auth will plug into BYU SAML once SSO is enabled.' },
      { title: 'Analytics aware', description: 'Every search and recommendation view is logged for insights.' },
    ],
    [],
  )

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleEmailSignIn = async (event) => {
    event.preventDefault()

    if (!email) {
      setStatus({ type: 'error', message: 'Enter an email to continue.' })
      return
    }

    setLoading(true)
    setStatus({ type: 'idle', message: '' })

    const emailRedirectTo = typeof window !== 'undefined' ? window.location.origin : undefined

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    })

    if (error) {
      setStatus({ type: 'error', message: error.message })
    } else {
      setStatus({
        type: 'success',
        message: 'Magic link sent! Check your inbox to finish signing in.',
      })
      setEmail('')
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setStatus({ type: 'success', message: 'You are signed out.' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-16 md:px-12">
        <header className="space-y-6 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            SDG Research Connector · MVP build in progress
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Link BYU researchers with the UN Sustainable Development Goals
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-300 md:text-lg">
              Discover relevant papers faster, spot collaboration opportunities, and keep every insight tied back to
              the SDGs that matter most.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-300">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">Semantic search</span>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">Author recommendations</span>
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-200">Supabase + Vercel stack</span>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-900/40 p-8 shadow-2xl shadow-emerald-500/5">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Project snapshot</p>
              <h2 className="text-2xl font-semibold text-white">A clear runway to the MVP</h2>
              <p className="text-slate-300">
                The MVP focuses on search, recommendations, and auth. Admin tooling, feedback loops, and bulk importers
                will come right after we ship the core experience.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-slate-900/80 p-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Access</p>
              <h2 className="text-2xl font-semibold text-white">Sign in with your BYU email</h2>
              <p className="text-sm text-slate-400">
                Email-based sign-in keeps things simple until the SAML SSO connection is ready.
              </p>
            </div>

            {session ? (
              <div className="mt-8 space-y-4 rounded-2xl border border-white/5 bg-white/5 p-6">
                <div>
                  <p className="text-sm text-slate-400">Signed in as</p>
                  <p className="text-lg font-medium text-white">{session.user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSignIn} className="mt-8 space-y-4">
                <label className="block text-sm font-medium text-slate-200">
                  BYU email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@byu.edu"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/60 disabled:text-white/70"
                >
                  {loading ? 'Sending magic link…' : 'Email me a magic link'}
                </button>
              </form>
            )}

            {status.message ? (
              <p
                className={`mt-4 text-sm ${
                  status.type === 'error' ? 'text-rose-300' : 'text-emerald-300'
                }`}
              >
                {status.message}
              </p>
            ) : null}
          </section>
        </main>

        <section className="rounded-3xl border border-white/5 bg-white/5 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-200">Up next</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Search UI & recommendation feed</h3>
          <p className="mt-3 text-sm text-slate-300">
            As soon as auth is stable, we will layer in the Search page, paper details, and the recommendation explorer
            outlined in the SDD.
          </p>
        </section>
      </div>
    </div>
  )
}

export default App
