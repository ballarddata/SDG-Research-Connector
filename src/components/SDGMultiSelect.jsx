import { useId } from 'react'

export default function SDGMultiSelect({ options = [], selected = [], onChange }) {
  const summaryId = useId()

  const toggleSelection = (id) => {
    if (!onChange) return
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id))
    } else {
      onChange([...selected, id].sort((a, b) => a - b))
    }
  }

  const summaryLabel =
    selected.length === 0
      ? 'All SDGs'
      : selected
          .map((id) => {
            const sdg = options.find((item) => item.id === id)
            return sdg ? `${sdg.id}` : id
          })
          .join(', ')

  return (
    <details className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 open:ring-1 open:ring-emerald-400/50">
      <summary
        id={summaryId}
        className="flex cursor-pointer items-center justify-between text-sm text-slate-200 marker:content-none"
      >
        <span className="font-semibold">SDG Filters</span>
        <span className="text-xs text-slate-400">{summaryLabel}</span>
      </summary>
      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1 text-slate-200">
        {options.map((sdg) => (
          <label
            key={sdg.id}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/40 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-white">
                SDG {sdg.id}: {sdg.name}
              </p>
              <p className="text-xs text-slate-400">{sdg.short_description ?? 'Focus area'}</p>
            </div>
            <input
              type="checkbox"
              checked={selected.includes(sdg.id)}
              onChange={() => toggleSelection(sdg.id)}
              className="h-4 w-4 rounded border-white/40 bg-slate-900 text-emerald-400 focus:ring-emerald-400"
              aria-labelledby={summaryId}
            />
          </label>
        ))}
      </div>
    </details>
  )
}
