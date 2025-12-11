export default function SDGBadge({ label, color = '#0f172a' }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}
