import { useState, useEffect } from "react"
import { api } from "../utils/api"

export default function Income() {
  const [income, setIncome] = useState([])
  const [source, setSource] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [editing, setEditing] = useState(null)
  const [editSource, setEditSource] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")

  const fetch = () => api("/income").then(setIncome)
  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!source || !amount || !date) return
    await api("/income", { method: "POST", body: JSON.stringify({ source, amount: parseFloat(amount), date }) })
    setSource(""); setAmount(""); fetch()
  }

  const startEdit = (i) => {
    setEditing(i.id)
    setEditSource(i.source)
    setEditAmount(i.amount)
    setEditDate(i.date)
  }

  const saveEdit = async (id) => {
    await api(`/income/${id}`, { method: "PUT", body: JSON.stringify({ source: editSource, amount: parseFloat(editAmount), date: editDate }) })
    setEditing(null); fetch()
  }

  const remove = async (id) => {
    const item = income.find(i => i.id === id)
    if (!window.confirm(`Delete "${item?.source ?? "this income"}"? This can't be undone.`)) return
    await api(`/income/${id}`, { method: "DELETE" })
    fetch()
  }

  const fmt = n => `R${Math.round(n).toLocaleString("en-ZA")}`
  const total = income.reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total this month</p>
        <p className="text-2xl font-semibold text-green-700">{fmt(total)}</p>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Add income</p>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-5 space-y-3">
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Source (Salary, side hustle…)" value={source} onChange={e => setSource(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Amount (R)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={add} className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Add income</button>
      </div>

      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">History</p>
      {income.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No income added yet</p>}
      {income.map(i => (
        <div key={i.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 mb-2">
          {editing === i.id ? (
            <div className="space-y-2">
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" value={editSource} onChange={e => setEditSource(e.target.value)} />
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
              <input className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-100" type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(i.id)} className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg py-2 text-sm font-medium">Save</button>
                <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm text-gray-500 dark:text-gray-400">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{i.source}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{i.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-green-700">{fmt(i.amount)}</span>
                <button onClick={() => startEdit(i)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                <button onClick={() => remove(i.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}