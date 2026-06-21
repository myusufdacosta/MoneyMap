import { useState, useEffect } from "react"
import { api } from "../utils/api"
import HealthScoreCard from "../components/HealthScoreCard"
import QuickWinsCard from "../components/QuickWinsCard"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export default function Dashboard({ goTo }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [recurring, setRecurring] = useState([])
  const [health, setHealth] = useState(null)
  const [quickWins, setQuickWins] = useState(null)
  const [showUpcoming, setShowUpcoming] = useState(false)

  useEffect(() => {
    api(`/dashboard?month=${month}&year=${year}`).then(setData)
    api("/recurring").then(r => setRecurring([...r].sort((a, b) => a.day_of_month - b.day_of_month)))
    api(`/financial-health?month=${month}&year=${year}`).then(setHealth)
    api("/quick-wins").then(setQuickWins)
  }, [month, year])

  if (!data) return <p className="text-gray-400 dark:text-gray-500 text-sm">Loading...</p>

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const leakageColor = data.leakage_pct < 15 ? "text-green-700" : data.leakage_pct < 30 ? "text-amber-600" : "text-red-600"
  const needsPct = data.total_expenses > 0 ? (data.needs / data.total_expenses) * 100 : 50
  const today = now.getDate()
  const upcoming = recurring.filter(r => r.day_of_month >= today).slice(0, 6)
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <select className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1 bg-white dark:bg-gray-700 dark:text-gray-100" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Income</p>
          <p className="text-xl font-semibold text-green-700">{fmt(data.total_income)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses</p>
          <p className="text-xl font-semibold text-red-600">{fmt(data.total_expenses)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
          <p className={`text-xl font-semibold ${data.remaining >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(data.remaining)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total debt</p>
          <p className="text-xl font-semibold text-amber-600 mb-1">{fmt(data.total_debt)}</p>
          {data.total_debt > 0 && goTo && (
            <button onClick={() => goTo("strategy")} className="text-xs text-blue-500 hover:text-blue-700">Payoff plan →</button>
          )}
        </div>
      </div>

      {health && <HealthScoreCard data={health} />}

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Budget leakage</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-6">
        <div className="flex rounded-full overflow-hidden h-3 mb-3">
          <div className="bg-green-500" style={{ width: `${needsPct}%` }}></div>
          <div className="bg-red-400" style={{ width: `${100 - needsPct}%` }}></div>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-green-700 font-medium">{fmt(data.needs)} needs</span>
          <span className={`font-semibold ${leakageColor}`}>{data.leakage_pct}% leakage</span>
          <span className="text-red-600 font-medium">{fmt(data.wants)} wants</span>
        </div>
      </div>

      {quickWins && <QuickWinsCard recommendations={quickWins.recommendations} />}

      {upcoming.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setShowUpcoming(s => !s)}
            className="w-full flex justify-between items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Upcoming this month</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{showUpcoming ? "Hide ▲" : `${upcoming.length} due ▼`}</span>
          </button>

          {showUpcoming && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 border-t-0 rounded-b-xl overflow-hidden -mt-px">
              {upcoming.map((r, i) => (
                <div key={r.id} className={`flex justify-between items-center px-4 py-3 ${i !== upcoming.length - 1 ? "border-b border-gray-50 dark:border-gray-700/50" : ""}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{r.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Day {r.day_of_month}</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-700">{fmt(r.amount)}</p>
                </div>
              ))}
              {goTo && (
                <button onClick={() => goTo("recurring")} className="w-full text-center text-xs text-blue-500 hover:text-blue-700 py-2 bg-gray-50 dark:bg-gray-800/60">
                  Manage recurring payments →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}