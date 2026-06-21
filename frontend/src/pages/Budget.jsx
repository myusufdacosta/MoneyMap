import { useState, useEffect } from "react"
import { api } from "../utils/api"

const CATEGORIES = ["Groceries","Transport","Utilities","Entertainment","Medical","Loan Payment","Rent","Takeaways","Other"]

export default function Budget() {
  const [targets, setTargets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [category, setCategory] = useState("Groceries")
  const [amount, setAmount] = useState("")

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
    setAmount(""); fetchAll()
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`

  const spentByCategory = (cat) => expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)

  // 50/20/30 salary plan — targets are % of total income this month.
  // Needs/wants come from expense.type tags; the savings/debt bucket is
  // whatever's left over once needs and wants are paid (same number as
  // dashboard's "Remaining") shown here against the 20% target instead.
  const pctOfIncome = (amt) => dashboard && dashboard.total_income > 0 ? Math.round((amt / dashboard.total_income) * 100) : 0
  const needs5030Pct = dashboard ? pctOfIncome(dashboard.needs) : 0
  const wants5030Pct = dashboard ? pctOfIncome(dashboard.wants) : 0
  const savings5030Pct = dashboard ? pctOfIncome(dashboard.remaining) : 0
  const onTrack = needs5030Pct <= 50 && wants5030Pct <= 30 && savings5030Pct >= 20

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">50/20/30 salary plan — this month</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-6 space-y-4">
        {!dashboard || dashboard.total_income === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Add this month's income to see your plan</p>
        ) : (
          <>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-50">Needs <span className="text-gray-400 dark:text-gray-500 font-normal">· target 50%</span></p>
                <p className={`text-xs font-semibold ${needs5030Pct <= 50 ? "text-green-700" : "text-red-600"}`}>{needs5030Pct}% · {fmt(dashboard.needs)}</p>
              </div>
              <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${needs5030Pct <= 50 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.min(needs5030Pct, 100)}%` }}></div>
                <div className="absolute top-0 h-2 w-0.5 bg-gray-900 dark:bg-gray-100" style={{ left: "50%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-50">Wants <span className="text-gray-400 dark:text-gray-500 font-normal">· target 30%</span></p>
                <p className={`text-xs font-semibold ${wants5030Pct <= 30 ? "text-green-700" : "text-red-600"}`}>{wants5030Pct}% · {fmt(dashboard.wants)}</p>
              </div>
              <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${wants5030Pct <= 30 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.min(wants5030Pct, 100)}%` }}></div>
                <div className="absolute top-0 h-2 w-0.5 bg-gray-900 dark:bg-gray-100" style={{ left: "30%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-50">Savings & extra debt payments <span className="text-gray-400 dark:text-gray-500 font-normal">· target 20%</span></p>
                <p className={`text-xs font-semibold ${savings5030Pct >= 20 ? "text-green-700" : "text-red-600"}`}>{savings5030Pct}% · {fmt(dashboard.remaining)}</p>
              </div>
              <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${savings5030Pct >= 20 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${Math.min(Math.max(savings5030Pct, 0), 100)}%` }}></div>
                <div className="absolute top-0 h-2 w-0.5 bg-gray-900 dark:bg-gray-100" style={{ left: "20%" }}></div>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
              {onTrack ? "You're on track with the 50/20/30 rule this month 🎉" : "The marker on each bar is the target — stay left of it for needs/wants, right of it for savings."}
            </p>
          </>
        )}
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Set budget target</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-6 space-y-3">
        <select className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Monthly budget (R)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <button onClick={save} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Set budget</button>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">This month vs budget</p>
      {CATEGORIES.map(cat => {
        const target = targets.find(t => t.category === cat)
        const spent = spentByCategory(cat)
        if (!target && spent === 0) return null
        const pct = target ? Math.min(Math.round((spent / target.target) * 100), 100) : 0
        const over = target && spent > target.target
        return (
          <div key={cat} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{cat}</p>
              <p className={`text-xs font-semibold ${over ? "text-red-600" : "text-gray-500 dark:text-gray-400"}`}>
                {fmt(spent)}{target ? ` / ${fmt(target.target)}` : ""}
              </p>
            </div>
            {target && (
              <>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-1">
                  <div className={`h-2 rounded-full ${over ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }}></div>
                </div>
                <p className={`text-xs ${over ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                  {over ? `R${Math.round(spent - target.target).toLocaleString()} over budget` : `R${Math.round(target.target - spent).toLocaleString()} remaining`}
                </p>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}