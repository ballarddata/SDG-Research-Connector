import { useEffect, useMemo, useState } from 'react'
import SearchBar from '../components/SearchBar'
import PaperCard from '../components/PaperCard'
import PaperModal from '../components/PaperModal'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [selectedSdgs, setSelectedSdgs] = useState([])
  const [sdgs, setSdgs] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activePaper, setActivePaper] = useState(null)

  const sdgLookup = useMemo(() => new Map(sdgs.map((sdg) => [sdg.id, sdg])), [sdgs])

  useEffect(() => {
    const loadSdgs = async () => {
      const { data, error: sdgError } = await supabase.from('sdgs').select('*').order('id')
      if (sdgError) {
        console.error('Unable to load SDGs', sdgError)
      } else {
        setSdgs(data ?? [])
      }
    }
    loadSdgs()
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query }),
      })

      if (!response.ok) {
        throw new Error('Unable to generate embedding. Please try again.')
      }

      const { embedding } = await response.json()
      if (!embedding) throw new Error('Embedding not returned from API.')

      const { data, error: rpcError } = await supabase.rpc('search_papers', {
        query_embedding: embedding,
        sdg_filter: selectedSdgs.length ? selectedSdgs : null,
        limit_count: 20,
      })

      if (rpcError) throw rpcError

      setResults(data ?? [])
      await logSearch(data?.length ?? 0)
    } catch (err) {
      console.error(err)
      setError(err.message ?? 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const logSearch = async (resultCount) => {
    if (!user) return
    const payload = {
      user_id: user.id,
      query_text: query,
      sdg_filters: selectedSdgs,
      results_count: resultCount,
    }
    const { error: logError } = await supabase.from('search_logs').insert(payload)
    if (logError) {
      console.error('Failed to log search', logError)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10 md:px-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Semantic search</p>
        <h1 className="text-3xl font-semibold text-white">Find papers aligned with the SDGs</h1>
        <p className="text-sm text-slate-400">
          Powered by embeddings from the Vercel Python function and Supabase pgvector search.
        </p>
      </div>

      <SearchBar
        query={query}
        onQueryChange={setQuery}
        selectedSdgs={selectedSdgs}
        onSdgsChange={setSelectedSdgs}
        sdgOptions={sdgs}
        onSubmit={handleSearch}
        loading={loading}
      />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <section className="min-h-[200px] rounded-3xl border border-white/5 bg-white/5 p-6">
        {loading ? (
          <p className="text-sm text-slate-400">Searching…</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-slate-400">No results yet. Try searching for “climate adaptation”.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((paper) => (
              <PaperCard key={paper.paper_id} paper={paper} sdgLookup={sdgLookup} onSelect={setActivePaper} />
            ))}
          </div>
        )}
      </section>

      <PaperModal paper={activePaper} sdgLookup={sdgLookup} onClose={() => setActivePaper(null)} />
    </div>
  )
}
