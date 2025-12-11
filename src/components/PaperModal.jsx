import SDGBadge from './SDGBadge'

export default function PaperModal({ paper, sdgLookup, onClose }) {
  if (!paper) return null

  const { title, authors = [], abstract, similarity_score: similarityScore = 0, sdg_ids: sdgIds = [] } = paper

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/5 bg-slate-950 p-8 text-left shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              {Math.round(similarityScore * 100)}% match
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{authors.join(', ')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sdgIds.map((sdgId) => {
            const sdg = sdgLookup.get(sdgId)
            return <SDGBadge key={sdgId} label={`SDG ${sdgId} ${sdg?.name ? `· ${sdg.name}` : ''}`} color={sdg?.color} />
          })}
        </div>

        <div className="mt-6 space-y-2 text-slate-200">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Abstract</p>
          <p className="text-base leading-relaxed text-slate-100">{abstract}</p>
        </div>
      </div>
    </div>
  )
}
