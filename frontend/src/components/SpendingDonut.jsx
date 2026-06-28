const SEGMENTS = [
  { key: "needs",   label: "Needs",     color: "#22c55e" },
  { key: "wants",   label: "Wants",     color: "#f97316" },
  { key: "debt",    label: "Debt",      color: "#ef4444" },
  { key: "savings", label: "Remaining", color: "#3b82f6" },
]

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`
}

export default function SpendingDonut({ data }) {
  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const income = data.total_income
  if (!income || income === 0) return null

  const debtPayments = data.loan_details
    ? data.loan_details.reduce((s, l) => s + (l.monthly_payment || 0), 0)
    : 0

  const remaining = Math.max(data.remaining, 0)
  const values = { needs: data.needs, wants: data.wants, debt: debtPayments, savings: remaining }
  const total = Object.values(values).reduce((s, v) => s + v, 0)
  if (total === 0) return null

  const cx = 80, cy = 80, r = 60
  let currentAngle = 0
  const segments = SEGMENTS.map(seg => {
    const value = values[seg.key]
    const pct = value / total
    const sweep = pct * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sweep
    currentAngle += sweep
    return { ...seg, value, pct, startAngle, endAngle, sweep }
  }).filter(s => s.sweep > 2)

  const [active, setActive] = useState(null)
  const activeSegment = active ? segments.find(s => s.key === active) : null

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 mb-5">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-4">Where your money goes</p>
      <div className="flex items-center gap-5">
        <div className="flex-shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {segments.map(seg => (
              <path
                key={seg.key}
                d={describeArc(cx, cy, r, seg.startAngle, seg.endAngle)}
                fill="none"
                stroke={seg.color}
                strokeWidth={active === seg.key ? 26 : 22}
                strokeLinecap="butt"
                style={{ cursor: "pointer", transition: "stroke-width 0.15s" }}
                onMouseEnter={() => setActive(seg.key)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(active === seg.key ? null : seg.key)}
              />
            ))}
            <text x={cx} y={cy - 8} textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="600"
              className="fill-gray-900 dark:fill-gray-50">
              {activeSegment ? activeSegment.label : "Income"}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#9ca3af" fontSize="10">
              {activeSegment ? fmt(activeSegment.value) : fmt(income)}
            </text>
            {activeSegment && (
              <text x={cx} y={cy + 24} textAnchor="middle" fill="#9ca3af" fontSize="9">
                {Math.round(activeSegment.pct * 100)}% of spend
              </text>
            )}
          </svg>
        </div>
        <div className="flex-1 space-y-2.5">
          {segments.map(seg => (
            <div key={seg.key} className="flex items-center justify-between cursor-pointer"
              onMouseEnter={() => setActive(seg.key)} onMouseLeave={() => setActive(null)}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <span className={`text-xs ${active === seg.key ? "font-semibold text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"}`}>
                  {seg.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{fmt(seg.value)}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{Math.round(seg.pct * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"