import { useState, useEffect } from "react"
import { api } from "../utils/api"

const CATEGORIES = ["Groceries","Transport","Utilities","Entertainment","Medical","Loan Payment","Rent","Takeaways","Other"]

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [desc, setDesc] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("Groceries")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [type, setType] = useState("Need")
  const [filter, setFilter] = useState("All")

  const fetch = () => api("/expenses").then(setExpenses)
  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!desc || !amount || !date) return
    await api("/expenses", { method: "POST", body: JSON.stringify({ description: desc, amount: parseFloat(amount), category, date, type }) })
    setDesc(""); setAmount(""); fetch()
  }

  const remove = async (id) => {
    await api(`/expenses/${id}`, { method: "DELETE" })
    fetch()
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const filtered = filter === "All" ? expenses : expenses.filter(e => e.category === filter)
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const wants = expenses.filter(e => e.type === "Want").reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total expenses</p>
          <p className="text-xl font-semibold text-red-600">{fmt(total)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Leakage (wants)</p>
          <p className="text-xl font-semibold text-amber-600">{fmt(wants)}</p>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-900 mb-3">Add expense</p>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 space-y-3">
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Amount (R)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={() => setType("Need")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === "Need" ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500"}`}>Need</button>
          <button onClick={() => setType("Want")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === "Want" ? "bg-red-500 text-white border-red-500" : "border-gray-200 text-gray-500"}`}>Want</button>
        </div>
        <button onClick={add} className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium">Add expense</button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {["All", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-full text-xs border ${filter === c ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500"}`}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No expenses yet</p>}
      {filtered.map(e => (
        <div key={e.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 mb-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{e.description}</p>
            <p className="text-xs text-gray-400">{e.category} · {e.date}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.type === "Need" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{e.type}</span>
            <span className="text-sm font-semibold text-gray-900">{fmt(e.amount)}</span>
            <button onClick={() => remove(e.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}