import { useState, useEffect } from "react"
import { api } from "../utils/api"

const CATEGORIES = ["Groceries","Transport","Utilities","Entertainment","Medical","Loan Payment","Rent","Takeaways","Other"]

export default function Budget() {
  const [targets, setTargets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [category, setCategory] = useState("Groceries")
  const [amount, setAmount] = useState("")

  const now = new Date()

  const fetchAll = () => {
    api("/budget-targets").then(setTargets)
    api(`/expenses?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then(setExpenses)
  }

  useEffect(() => { fetchAll() }, [])

  const save = async () => {
    if (!amount) return
    await api("/budget-targets", { method: "POST", body: JSON.stringify({ category, target: parseFloat(amount) }) })
    setAmount(""); fetchAll()
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`

  const spentByCategory = (cat) => expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)

  return (
    <div>
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