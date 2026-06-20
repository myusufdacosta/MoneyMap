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
  const [editing, setEditing] = useState(null)
  const [editDesc, setEditDesc] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editCategory, setEditCategory] = useState("Groceries")
  const [editDate, setEditDate] = useState("")
  const [editType, setEditType] = useState("Need")

  const fetch = () => api("/expenses").then(setExpenses)
  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!desc || !amount || !date) return
    await api("/expenses", { method: "POST", body: JSON.stringify({ description: desc, amount: parseFloat(amount), category, date, type }) })
    setDesc(""); setAmount(""); fetch()
  }

  const startEdit = (e) => {
    setEditing(e.id)
    setEditDesc(e.description)
    setEditAmount(e.amount)
    setEditCategory(e.category)
    setEditDate(e.date)
    setEditType(e.type)
  }

  const saveEdit = async (id) => {
    await api(`/expenses/${id}`, { method: "PUT", body: JSON.stringify({ description: editDesc, amount: parseFloat(editAmount), category: editCategory, date: editDate, type: editType }) })
    setEditing(null); fetch()
  }

  const remove = async (id) => {
    const item = expenses.find(x => x.id === id)
    if (!window.confirm(`Delete "${item?.description ?? "this expense"}"? This can't be undone.`)) return
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
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total expenses</p>
          <p className="text-xl font-semibold text-red-600">{fmt(total)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Leakage (wants)</p>
          <p className="text-xl font-semibold text-amber-600">{fmt(wants)}</p>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Add expense</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-5 space-y-3">
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Amount (R)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <select className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={() => setType("Need")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === "Need" ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Need</button>
          <button onClick={() => setType("Want")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === "Want" ? "bg-red-500 text-white border-red-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Want</button>
        </div>
        <button onClick={add} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Add expense</button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {["All", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-full text-xs border ${filter === c ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No expenses yet</p>}
      {filtered.map(e => (
        <div key={e.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 mb-2">
          {editing === e.id ? (
            <div className="space-y-2">
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
              <select className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => setEditType("Need")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${editType === "Need" ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Need</button>
                <button onClick={() => setEditType("Want")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${editType === "Want" ? "bg-red-500 text-white border-red-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Want</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveEdit(e.id)} className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Save</button>
                <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm text-gray-500 dark:text-gray-400">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{e.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{e.category} · {e.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.type === "Need" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{e.type}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{fmt(e.amount)}</span>
                <button onClick={() => startEdit(e)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                <button onClick={() => remove(e.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}