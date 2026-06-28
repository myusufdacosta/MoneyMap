import { useState, useEffect } from "react"
import { api } from "../utils/api"

const CATEGORIES = ["Groceries","Transport","Utilities","Entertainment","Medical","Loan Payment","Rent","Takeaways","Bank Charges","Other"]

const CATEGORY_EMOJI = {
  Groceries: "🛒", Transport: "🚗", Utilities: "💡", Entertainment: "🎬",
  Medical: "💊", "Loan Payment": "🏦", Rent: "🏠", Takeaways: "🍔",
  "Bank Charges": "💳", Other: "📦"
}

export default function Budget() {
  const [targets, setTargets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [category, setCategory] = useState("Groceries")
  const [amount, setAmount] = useState("")
  const [editingId, setEditingId] = useState(null)

  const now = new Date()

  const fetchAll = () => {
    api("/budget-targets").then(setTargets)
    api(`/expenses?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then(setExpenses)
    api(`/dashboard?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then(setDashboard)
  }

  useEffect(() => { fetchAll() }, [])

  const save = async () => {
    if (!amount) return
    await api("/budget-targets", { method: "POST", body: JSON.stringify({ category, target: parseFloat(amount) }) })
    setAmount(""); setEditingId(null); fetchAll()
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const spentByCategory = (cat) => expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)

  const pctOfIncome = (amt) => dashboard && dashboard.total_income > 0 ? Math.round((amt / dashboard.total_income) * 100) : 0
  const needs5030Pct = dashboard ? pctOfIncome(dashboard.needs) : 0
  const wants5030Pct = dashboard ? pctOfIncome(dashboard.wants) : 0
  const savings5030Pct = dashboard ? pctOfIncome(dashboard.remaining) : 0
  const onTrack = needs5030Pct <= 50 && wants5030Pct <= 30 && savings5030Pct >= 20

  const categoryRows = CATEGORIES.map(cat => {
    const target = targets.find(t => t.category === cat)
    const spent = spentByCategory(cat)
    if (!target && spent === 0) return null
    const pct = target ? (spent / target.target) * 100 : 0
    const remaining = target ? target.target - spent : 0
    const over = target && spent > target.target
    const warning = target && !over && pct >= 80
    const barColor = over ? "bg-red-500" : warning ? "bg-amber-400" : "bg-green-500"
    const barWidth = target ? `${Math.min(pct, 100)}%` : "0%"
    return { cat, target, spent, pct, remaining, over, warning, barColor, barWidth }
  }).filter(Boolean)

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">50/20/30 salary plan</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-5 space-y-4">
        {!dashboard || dashboard.total_income === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Add this month's income to see your plan</p>
        ) : (
          <>
            {[
              { label: "Needs", pct: needs5030Pct, target: 50, value: dashboard.needs, good: needs5030Pct <= 50 },
              { label: "Wants", pct: wants5030Pct, target: 30, value: dashboard.wants, good: wants5030Pct <= 30 },
              { label: "Savings & debt", pct: savings5030Pct, target: 20, value: dashboard.remaining, good: savings5030Pct >= 20, invert: true },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-50">
                    {row.label} <span className="text-gray-400 font-normal">· target {row.target}%</span>
                  </p>
                  <p className={`text-xs font-semibold ${row.good ? "text-green-700" : "text-red-500"}`}>
                    {row.pct}% · {fmt(row.value)}
                  </p>
                </div>
                <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${row.good ? "bg-green-500" : row.invert ? "bg-amber-400" : "bg-red-500"}`}
                    style={{ width: `${Math.min(Math.max(row.pct, 0), 100)}%` }}
                  />
                  <div className="absolute top-0 h-2 w-0.5 bg-gray-900 dark:bg-gray-100 opacity-40" style={{ left: `${row.target}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
              {onTrack ? "🎉 You're on track with the 50/20/30 rule this month!" : "The marker on each bar shows the target."}
            </p>
          </>
        )}
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Category budgets</p>

      {categoryRows.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Set a budget below to start tracking by category</p>
      )}

      <div className="space-y-2 mb-5">
        {categoryRows.map(({ cat, target, spent, pct, remaining, over, warning, barColor, barWidth }) => (
          <div key={cat} className={`bg-white dark:bg-gray-800 border rounded-xl p-4 ${over ? "border-red-200 dark:border-red-800" : warning ? "border-amber-200 dark:border-amber-800" : "border-gray-100 dark:border-gray-700"}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{CATEGORY_EMOJI[cat] || "📦"}</span>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{cat}</p>
                {over && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">Over</span>}
                {warning && !over && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">Almost</span>}
                {!target && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">No budget set</span>}
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {fmt(spent)}{target ? ` / ${fmt(target.target)}` : ""}
              </p>
            </div>
            {target && (
              <>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-1.5 overflow-hidden">
                  <div className={`h-2 rounded-full transition-all duration-700 ${barColor}`} style={{ width: barWidth }} />
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs ${over ? "text-red-500" : warning ? "text-amber-600" : "text-gray-400 dark:text-gray-500"}`}>
                    {over ? `R${Math.round(spent - target.target).toLocaleString()} over budget` : warning ? `Only ${fmt(remaining)} left — slow down` : `${fmt(remaining)} remaining`}
                  </p>
                  <button onClick={() => { setCategory(cat); setAmount(String(target.target)); setEditingId(cat) }} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">Edit</button>
                </div>
              </>
            )}
            {!target && (
              <button onClick={() => { setCategory(cat); setAmount(""); setEditingId(cat) }} className="text-xs text-blue-500 hover:text-blue-700 mt-1">+ Set a budget for this category</button>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">
        {editingId ? `Editing budget for ${editingId}` : "Set budget target"}
      </p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <select className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" value={category} onChange={e => { setCategory(e.target.value); setEditingId(null) }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Monthly budget (R)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <button onClick={save} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">
          {editingId ? "Update budget" : "Set budget"}
        </button>
        {editingId && (
          <button onClick={() => { setEditingId(null); setAmount("") }} className="w-full text-xs text-gray-400 py-1">Cancel</button>
        )}
      </div>
    </div>
  )
}