import { useEffect, useMemo, useState } from 'react'
import RecommendationCard from '../components/RecommendationCard'
import AuthorModal from '../components/AuthorModal'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function RecommendationsPage() {
  const { user } = useAuth()
  const [sdgs, setSdgs] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [authorDetails, setAuthorDetails] = useState(null)
  const [authorPapers, setAuthorPapers] = useState([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [viewLogId, setViewLogId] = useState(null)

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

  useEffect(() => {
    if (!user) return

    const loadRecommendations = async () => {
      setLoading(true)
      setError('')
      const { data, error: rpcError } = await supabase.rpc('get_recommendations_for_user', {
        user_email_param: user.email,
        limit_count: 10,
      })
      if (rpcError) {
        console.error(rpcError)
        setError('Unable to load recommendations.')
      } else {
        setRecommendations(data ?? [])
      }
      setLoading(false)
    }

    loadRecommendations()
  }, [user])

  const handleSelectRecommendation = async (recommendation) => {
    setSelected(recommendation)
    setAuthorDetails(null)
    setAuthorPapers([])
    setDetailsLoading(true)

    const { data: logData, error: logError } = await supabase
      .from('recommendation_views')
      .insert({
        recommendation_id: recommendation.recommendation_id,
        user_id: user.id,
        action_taken: 'viewed',
      })
      .select('id')
      .single()

    if (logError) {
      console.error('Failed to log recommendation view', logError)
    } else {
      setViewLogId(logData?.id ?? null)
    }

    await loadAuthorContext(recommendation)
    setDetailsLoading(false)
  }

  const loadAuthorContext = async (recommendation) => {
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id, name, email, institutions(name)')
      .eq('id', recommendation.author_id)
      .maybeSingle()

    if (authorError) {
      console.error('Failed to fetch author details', authorError)
    } else {
      setAuthorDetails({
        ...author,
        institution: author?.institutions?.name ?? recommendation.institution_name,
      })
    }

    let paperQuery = supabase
      .from('papers')
      .select('id, title, abstract, paper_sdgs(sdg_id), author_papers!inner(author_id)')
      .eq('author_papers.author_id', recommendation.author_id)
      .limit(10)

    if (recommendation.shared_sdgs?.length) {
      paperQuery = paperQuery.in('paper_sdgs.sdg_id', recommendation.shared_sdgs)
    }

    const { data: paperData, error: paperError } = await paperQuery

    if (paperError) {
      console.error('Failed to fetch papers', paperError)
      setAuthorPapers([])
      return
    }

    const normalized = (paperData ?? []).map((paper) => ({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      sdg_ids: (paper.paper_sdgs ?? []).map((sdg) => sdg.sdg_id),
    }))

    setAuthorPapers(normalized)
  }

  const handleCloseModal = () => {
    setSelected(null)
    setAuthorDetails(null)
    setAuthorPapers([])
    setViewLogId(null)
  }

  const handleContact = async () => {
    if (!selected) return

    if (viewLogId) {
      const { error: updateError } = await supabase
        .from('recommendation_views')
        .update({ action_taken: 'email_sent' })
        .eq('id', viewLogId)
      if (updateError) {
        console.error('Failed to update recommendation view', updateError)
      }
    }

    const emailTarget = selected.author_email ?? authorDetails?.email
    if (!emailTarget) {
      console.warn('No email available for author')
      return
    }

    const subject = encodeURIComponent(
      `Research Collaboration Opportunity - SDG ${selected.shared_sdgs?.join(', ') ?? ''}`,
    )
    const body = encodeURIComponent(
      `Hi ${selected.author_name},\n\nI came across your work via the SDG Research Connector and would love to connect on the SDGs we share.`,
    )

    window.location.href = `mailto:${emailTarget}?subject=${subject}&body=${body}`
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10 md:px-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Collaboration radar</p>
        <h1 className="text-3xl font-semibold text-white">Researchers aligned with your SDG focus</h1>
        <p className="text-sm text-slate-400">Updated weekly through the Supabase recommendation job.</p>
      </div>

      <section className="min-h-[200px] rounded-3xl border border-white/5 bg-white/5 p-6">
        {loading ? (
          <p className="text-sm text-slate-400">Loading recommendations…</p>
        ) : error ? (
          <p className="text-sm text-rose-300">{error}</p>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-slate-400">No recommendations yet. Check back after the next refresh job.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.recommendation_id}
                recommendation={recommendation}
                sdgLookup={sdgLookup}
                onSelect={handleSelectRecommendation}
              />
            ))}
          </div>
        )}
      </section>

      <AuthorModal
        recommendation={selected}
        authorDetails={authorDetails}
        papers={authorPapers}
        sdgLookup={sdgLookup}
        loading={detailsLoading}
        onClose={handleCloseModal}
        onContact={handleContact}
      />
    </div>
  )
}
