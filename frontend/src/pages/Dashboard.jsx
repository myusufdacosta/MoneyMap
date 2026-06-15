import { useState, useEffect } from "react"
import { api } from "../utils/api"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export default function Dashboard() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [recurring, setRecurring] = useState([])

  useEffect(() => {
    api(`/dashboard?month=${month}&year=${year}`).then(setData)
    api(`/expenses?month=${month}&year=${year}`).then(setExpenses)
    api(`/income?month=${month}&year=${year}`).then(setIncome)
    api("/recurring").then(r => setRecurring([...r].sort((a, b) => a.day_of_month - b.day_of_month)))
  }, [month, year])

  if (!data) return <p className="text-gray-400 text-sm">Loading...</p>

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const leakageColor = data.leakage_pct < 15 ? "text-green-700" : data.leakage_pct < 30 ? "text-amber-600" : "text-red-600"
  const needsPct = data.total_expenses > 0 ? (data.needs / data.total_expenses) * 100 : 50
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const today = now.getDate()
  const upcoming = recurring.filter(r => r.day_of_month >= today).slice(0, 4)
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Income</p>
          <p className="text-xl font-semibold text-green-700">{fmt(data.total_income)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Expenses</p>
          <p className="text-xl font-semibold text-red-600">{fmt(data.total_expenses)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Remaining</p>
          <p className={`text-xl font-semibold ${data.remaining >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(data.remaining)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total debt</p>
          <p className="text-xl font-semibold text-amber-600">{fmt(data.total_debt)}</p>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-900 mb-3">Budget leakage</p>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
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

      {data.loan_details && data.loan_details.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-900 mb-3">Debt freedom dates</p>
          {data.loan_details.map(l => (
            <div key={l.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{l.name}</p>
                  <p className="text-xs text-gray-400">{l.months_remaining} months · paid off {l.payoff_date}</p>
                </div>
                <p className="text-sm font-semibold text-amber-600">{fmt(l.balance)}</p>
              </div>
            </div>
          ))}
          <div className="mb-6"></div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-900 mb-3">Upcoming this month</p>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
            {upcoming.map((r, i) => (
              <div key={r.id} className={`flex justify-between items-center px-4 py-3 ${i !== upcoming.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">Day {r.day_of_month}</p>
                </div>
                <p className="text-sm font-semibold text-blue-700">{fmt(r.amount)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {recentExpenses.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-900 mb-3">Recent expenses</p>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
            {recentExpenses.map((e, i) => (
              <div key={e.id} className={`flex justify-between items-center px-4 py-3 ${i !== recentExpenses.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.description}</p>
                  <p className="text-xs text-gray-400">{e.category} · {e.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.type === "Need" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{e.type}</span>
                  <span className="text-sm font-semibold text-gray-900">{fmt(e.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {income.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-900 mb-3">Income sources</p>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
            {income.map((i, idx) => (
              <div key={i.id} className={`flex justify-between items-center px-4 py-3 ${idx !== income.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{i.source}</p>
                  <p className="text-xs text-gray-400">{i.date}</p>
                </div>
                <p className="text-sm font-semibold text-green-700">{fmt(i.amount)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900">Total</p>
              <p className="text-sm font-semibold text-green-700">{fmt(data.total_income)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}