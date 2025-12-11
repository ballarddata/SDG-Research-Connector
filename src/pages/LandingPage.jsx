import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/search', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email || !password) {
      setStatus({ type: 'error', message: 'Email and password are required.' })
      return
    }
    setLoading(true)
    setStatus({ type: 'idle', message: '' })

    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setStatus({ type: 'success', message: 'Account created! Check your inbox to confirm your email.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setStatus({ type: 'success', message: 'Signed in! Redirecting…' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:px-12">
      <section className="space-y-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          SDG Research Connector · MVP build in progress
        </p>
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Link BYU researchers with the UN Sustainable Development Goals
          </h1>
          <p className="text-lg text-slate-300">
            Discover relevant papers faster, spot collaboration opportunities, and keep every insight tied back to the
            SDGs that matter most.
          </p>
        </div>
        <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
          <FeatureCard title="Semantic search" description="Vector-powered discovery with SDG filters." />
          <FeatureCard title="Author matching" description="Surface top cross-campus collaborators." />
          <FeatureCard title="BYU SSO ready" description="Switch to SAML as soon as credentials land." />
          <FeatureCard title="Analytics aware" description="Every search and view logged to Supabase." />
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Access</p>
          <h2 className="text-2xl font-semibold text-white">Sign in with your email</h2>
          <p className="text-sm text-slate-400">Password auth keeps things simple until BYU SSO is wired up.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@byu.edu"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/70 disabled:text-white/70"
          >
            {loading ? 'Submitting…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {status.message ? (
          <p className={`text-sm ${status.type === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>{status.message}</p>
        ) : null}
        <button
          onClick={() => {
            setMode((prev) => (prev === 'sign-up' ? 'sign-in' : 'sign-up'))
            setStatus({ type: 'idle', message: '' })
          }}
          className="w-full text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline"
        >
          {mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Create one'}
        </button>
      </section>
    </div>
  )
}

function FeatureCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  )
}
