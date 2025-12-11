import SDGBadge from './SDGBadge'

export default function PaperCard({ paper, sdgLookup, onSelect }) {
  const { title, authors = [], similarity_score: similarityScore = 0, sdg_ids: sdgIds = [] } = paper

  const formattedScore = `${Math.round(similarityScore * 100)}% match`

  return (
    <button
      onClick={() => onSelect?.(paper)}
      className="h-full w-full rounded-3xl border border-white/5 bg-slate-900/70 p-6 text-left transition hover:-translate-y-1 hover:border-emerald-400/80 hover:bg-slate-900"
    >
      <div className="flex items-center justify-between text-xs text-emerald-300">
        <span className="font-semibold uppercase tracking-[0.3em] text-emerald-200">Paper</span>
        <span>{formattedScore}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{authors.join(', ')}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {sdgIds.length === 0 ? (
          <span className="text-xs text-slate-500">No SDGs tagged</span>
        ) : (
          sdgIds.map((sdgId) => {
            const sdg = sdgLookup.get(sdgId)
            return <SDGBadge key={sdgId} label={`SDG ${sdgId}`} color={sdg?.color} />
          })
        )}
      </div>
    </button>
  )
}
