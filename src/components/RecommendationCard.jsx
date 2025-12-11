import SDGBadge from './SDGBadge'

export default function RecommendationCard({ recommendation, sdgLookup, onSelect }) {
  const { author_name: name, institution_name: institution, similarity_score: score = 0, shared_sdgs: sharedSdgs = [] } =
    recommendation

  return (
    <button
      onClick={() => onSelect?.(recommendation)}
      className="w-full rounded-3xl border border-white/5 bg-slate-900/70 p-6 text-left transition hover:-translate-y-1 hover:border-cyan-400/80 hover:bg-slate-900"
    >
      <div className="flex items-center justify-between text-xs text-cyan-200">
        <span className="uppercase tracking-[0.3em]">Collaboration</span>
        <span>{Math.round(score * 100)}% match</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-white">{name}</h3>
      <p className="text-sm text-slate-400">{institution}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {sharedSdgs.map((sdgId) => {
          const sdg = sdgLookup.get(sdgId)
          return <SDGBadge key={sdgId} label={`SDG ${sdgId}`} color={sdg?.color} />
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Papers in shared SDGs: {recommendation.paper_count ?? '–'}
      </p>
    </button>
  )
}
