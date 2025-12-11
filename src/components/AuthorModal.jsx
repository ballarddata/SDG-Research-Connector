import SDGBadge from './SDGBadge'

export default function AuthorModal({
  recommendation,
  authorDetails,
  papers,
  sdgLookup,
  loading = false,
  onClose,
  onContact,
}) {
  if (!recommendation) return null

  const sharedSdgs = recommendation.shared_sdgs ?? []

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-white/5 bg-slate-950 p-8 text-left shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
              {Math.round((recommendation.similarity_score ?? 0) * 100)}% match
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{recommendation.author_name}</h3>
            <p className="text-sm text-slate-400">{recommendation.institution_name}</p>
            {authorDetails?.email ? (
              <p className="text-sm text-slate-400">{authorDetails.email}</p>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              Close
            </button>
            <button
              onClick={onContact}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-950 transition hover:bg-cyan-300"
            >
              Contact
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sharedSdgs.map((sdgId) => {
            const sdg = sdgLookup.get(sdgId)
            return <SDGBadge key={sdgId} label={`SDG ${sdgId} ${sdg?.name ? `· ${sdg.name}` : ''}`} color={sdg?.color} />
          })}
        </div>

        <section className="mt-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Highlighted papers</p>
          <div className="mt-3 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading author details…</p>
            ) : papers.length === 0 ? (
              <p className="text-sm text-slate-500">No papers found for the shared SDGs yet.</p>
            ) : (
              papers.map((paper) => (
                <div key={paper.id} className="rounded-2xl border border-white/5 bg-slate-900/70 p-4">
                  <p className="text-base font-semibold text-white">{paper.title}</p>
                  <p className="text-sm text-slate-400">{paper.abstract?.slice(0, 160)}...</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(paper.sdg_ids ?? []).map((sdgId) => {
                      const sdg = sdgLookup.get(sdgId)
                      return <SDGBadge key={sdgId} label={`SDG ${sdgId}`} color={sdg?.color} />
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
