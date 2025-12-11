import SDGMultiSelect from './SDGMultiSelect'

export default function SearchBar({
  query,
  onQueryChange,
  selectedSdgs,
  onSdgsChange,
  sdgOptions,
  onSubmit,
  loading,
}) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <form
      className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-6 shadow-2xl shadow-emerald-500/5"
      onSubmit={handleSubmit}
    >
      <label className="block text-sm font-semibold text-white">
        What research are you looking for?
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Climate change adaptation..."
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
        />
      </label>

      <SDGMultiSelect options={sdgOptions} selected={selectedSdgs} onChange={onSdgsChange} />

      <button
        type="submit"
        disabled={loading || query.trim() === ''}
        className="w-full rounded-2xl bg-emerald-500 py-3 text-center text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/70 disabled:text-white/70"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
