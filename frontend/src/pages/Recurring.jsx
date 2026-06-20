import { useState, useEffect } from "react"
import { api } from "../utils/api"

export default function Recurring() {
  const [recurring, setRecurring] = useState([])
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [day, setDay] = useState("")

  const fetch = () => api("/recurring").then(setRecurring)
  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!name || !amount || !day) return
    await api("/recurring", { method: "POST", body: JSON.stringify({ name, amount: parseFloat(amount), day_of_month: parseInt(day) }) })
    setName(""); setAmount(""); setDay(""); fetch()
  }

const remove = async (id) => {
  const item = recurring.find(r => r.id === id)
  if (!window.confirm(`Delete "${item?.name ?? "this payment"}"? This can't be undone.`)) return
  await api(`/recurring/${id}`, { method: "DELETE" })
  fetch()
}

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const total = recurring.reduce((s, r) => s + r.amount, 0)
  const sorted = [...recurring].sort((a, b) => a.day_of_month - b.day_of_month)

  return (
    <div>
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total committed monthly</p>
        <p className="text-2xl font-semibold text-blue-700">{fmt(total)}</p>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Add recurring payment</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-5 space-y-3">
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Description (Rent, Netflix…)" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Amount (R)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Day of month (1-31)" type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)} />
        <button onClick={add} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Add recurring</button>
      </div>

      {sorted.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No recurring payments yet</p>}
      {sorted.map(r => (
        <div key={r.id} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 mb-2">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{r.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Due day {r.day_of_month} each month</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-700">{fmt(r.amount)}</span>
            <button onClick={() => remove(r.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}